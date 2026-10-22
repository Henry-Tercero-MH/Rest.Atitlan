// Lógica de órdenes compartida entre rutas públicas y de personal.
import { db, UNIQUE_VIOLATION } from './db/index.js';
import { publicar } from './events.js';

export const ESTADOS_ACTIVOS = ['recibido', 'confirmado', 'en_preparacion', 'listo'];

// Transiciones permitidas y roles que pueden hacerlas.
const TRANSICIONES = {
  recibido: { confirmado: ['cocina', 'admin', 'gerente'], cancelado: ['cocina', 'admin', 'gerente'] },
  confirmado: { en_preparacion: ['cocina', 'admin', 'gerente'], cancelado: ['cocina', 'admin', 'gerente'] },
  en_preparacion: { listo: ['cocina', 'admin', 'gerente'], cancelado: ['admin', 'gerente'] },
  listo: { entregado: ['cocina', 'mesero', 'admin', 'gerente'] },
};

export class ErrorNegocio extends Error {
  constructor(status, mensaje, extra = {}) {
    super(mensaje);
    this.status = status;
    this.extra = extra;
  }
}

export async function obtenerOrden(q, id) {
  const o = await q(
    `SELECT o.id, o.numero, o.estado, o.total_centavos, o.creada_en, o.actualizada_en,
            m.numero AS mesa
       FROM ordenes o LEFT JOIN mesas m ON m.id = o.mesa_id
      WHERE o.id = $1`,
    [id],
  );
  if (!o.rows[0]) return null;
  const lineas = await q(
    `SELECT l.id, l.producto_id, l.nombre, l.cantidad, l.precio_unitario_centavos, l.nota, l.estado,
            COALESCE(json_agg(json_build_object('nombre', lm.nombre, 'precio_extra_centavos', lm.precio_extra_centavos))
                     FILTER (WHERE lm.id IS NOT NULL), '[]') AS modificadores
       FROM orden_lineas l LEFT JOIN orden_linea_modificadores lm ON lm.linea_id = l.id
      WHERE l.orden_id = $1
      GROUP BY l.id ORDER BY l.id`,
    [id],
  );
  const orden = o.rows[0];
  return { ...orden, numero_visible: `#${String(orden.numero).padStart(4, '0')}`, lineas: lineas.rows };
}

function validarEntrada(body) {
  const { qr_token, idempotency_key, lineas } = body || {};
  if (typeof qr_token !== 'string' || !qr_token) throw new ErrorNegocio(400, 'Falta el código de la mesa');
  if (typeof idempotency_key !== 'string' || idempotency_key.length < 8 || idempotency_key.length > 100) {
    throw new ErrorNegocio(400, 'Clave de envío inválida');
  }
  if (!Array.isArray(lineas) || lineas.length === 0 || lineas.length > 30) {
    throw new ErrorNegocio(400, 'El pedido debe tener entre 1 y 30 platillos');
  }
  for (const l of lineas) {
    if (!Number.isInteger(l.producto_id)) throw new ErrorNegocio(400, 'Platillo inválido');
    if (!Number.isInteger(l.cantidad) || l.cantidad < 1 || l.cantidad > 50) throw new ErrorNegocio(400, 'Cantidad inválida');
    if (l.nota != null && (typeof l.nota !== 'string' || l.nota.length > 140)) throw new ErrorNegocio(400, 'La nota es muy larga');
    if (l.modificadores != null && (!Array.isArray(l.modificadores) || !l.modificadores.every(Number.isInteger))) {
      throw new ErrorNegocio(400, 'Opciones inválidas');
    }
  }
  return { qr_token, idempotency_key, lineas };
}

// Crea la orden. El cliente solo manda IDs, cantidades, modificadores y notas:
// precios, totales y disponibilidad los calcula SIEMPRE el servidor.
export async function crearOrden(body) {
  const entrada = validarEntrada(body);
  try {
    return await db().tx((q) => crearOrdenTx(q, entrada));
  } catch (err) {
    // Dos reintentos simultáneos con la misma clave: el segundo choca con la restricción única.
    if (err.code === UNIQUE_VIOLATION && String(err.detail || err.message).includes('idempotency_key')) {
      const prev = await db().query('SELECT id FROM ordenes WHERE idempotency_key = $1', [entrada.idempotency_key]);
      return { orden: await obtenerOrden(db().query, prev.rows[0].id), repetida: true };
    }
    throw err;
  }
}

async function crearOrdenTx(q, { qr_token, idempotency_key, lineas }) {
  const previa = await q('SELECT id FROM ordenes WHERE idempotency_key = $1', [idempotency_key]);
  if (previa.rows[0]) return { orden: await obtenerOrden(q, previa.rows[0].id), repetida: true };

  let mesa = null;
  let sesionId = null;
  if (qr_token !== 'general') {
    const r = await q('SELECT id, numero, estado, activa FROM mesas WHERE qr_token = $1', [qr_token]);
    mesa = r.rows[0];
    if (!mesa || !mesa.activa || mesa.estado === 'fuera_de_servicio') {
      throw new ErrorNegocio(404, 'Este código QR no es válido. Pide ayuda al personal.');
    }
    // DEMO: si la mesa no tiene sesión abierta, se abre aquí. El índice único parcial impide dos
    // sesiones abiertas aunque lleguen dos pedidos al mismo tiempo. (Pregunta abierta: ¿solo el personal abre?)
    await q(
      `INSERT INTO sesiones_mesa (mesa_id) VALUES ($1)
       ON CONFLICT (mesa_id) WHERE estado <> 'cerrada' DO NOTHING`,
      [mesa.id],
    );
    const s = await q(`SELECT id FROM sesiones_mesa WHERE mesa_id = $1 AND estado <> 'cerrada'`, [mesa.id]);
    sesionId = s.rows[0].id;
    await q(`UPDATE mesas SET estado = 'ocupada' WHERE id = $1 AND estado <> 'ocupada'`, [mesa.id]);
  }

  const ids = [...new Set(lineas.map((l) => l.producto_id))];
  const prods = await q(
    'SELECT id, nombre, precio_centavos, disponible, activo FROM productos WHERE id = ANY($1::int[])',
    [ids],
  );
  const porId = new Map(prods.rows.map((p) => [p.id, p]));
  const agotados = ids.filter((id) => !porId.get(id)?.disponible || !porId.get(id)?.activo);
  if (agotados.length) {
    throw new ErrorNegocio(409, 'Algunos platillos se agotaron. Quítalos del pedido para continuar.', { agotados });
  }

  const modIds = [...new Set(lineas.flatMap((l) => l.modificadores || []))];
  const mods = await q(
    `SELECT md.id, md.nombre, md.precio_extra_centavos, md.disponible, g.id AS grupo_id, g.producto_id
       FROM modificadores md JOIN grupos_modificador g ON g.id = md.grupo_id
      WHERE md.id = ANY($1::int[])`,
    [modIds],
  );
  const modPorId = new Map(mods.rows.map((m) => [m.id, m]));
  const grupos = await q(
    'SELECT id, producto_id, nombre, min_sel, max_sel FROM grupos_modificador WHERE producto_id = ANY($1::int[])',
    [ids],
  );

  const calculadas = lineas.map((l) => {
    const prod = porId.get(l.producto_id);
    const elegidos = [...new Set(l.modificadores || [])].map((id) => modPorId.get(id));
    if (elegidos.some((m) => !m || m.producto_id !== prod.id || !m.disponible)) {
      throw new ErrorNegocio(409, `Una opción de "${prod.nombre}" ya no está disponible`);
    }
    for (const g of grupos.rows.filter((g) => g.producto_id === prod.id)) {
      const n = elegidos.filter((m) => m.grupo_id === g.id).length;
      if (n < g.min_sel || n > g.max_sel) throw new ErrorNegocio(400, `Revisa "${g.nombre}" en ${prod.nombre}`);
    }
    const unitario = prod.precio_centavos + elegidos.reduce((s, m) => s + m.precio_extra_centavos, 0);
    return { l, prod, elegidos, unitario };
  });
  const total = calculadas.reduce((s, c) => s + c.unitario * c.l.cantidad, 0);

  const o = await q(
    `INSERT INTO ordenes (sesion_id, mesa_id, total_centavos, idempotency_key)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [sesionId, mesa?.id ?? null, total, idempotency_key],
  );
  const ordenId = o.rows[0].id;
  for (const c of calculadas) {
    const li = await q(
      `INSERT INTO orden_lineas (orden_id, producto_id, nombre, cantidad, precio_unitario_centavos, nota)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [ordenId, c.prod.id, c.prod.nombre, c.l.cantidad, c.unitario, (c.l.nota || '').trim()],
    );
    for (const m of c.elegidos) {
      await q(
        `INSERT INTO orden_linea_modificadores (linea_id, modificador_id, nombre, precio_extra_centavos)
         VALUES ($1, $2, $3, $4)`,
        [li.rows[0].id, m.id, m.nombre, m.precio_extra_centavos],
      );
    }
  }
  await q(
    `INSERT INTO auditoria (entidad, entidad_id, accion, despues) VALUES ('orden', $1, 'crear', $2)`,
    [ordenId, JSON.stringify({ estado: 'recibido', total_centavos: total, mesa: mesa?.numero ?? null })],
  );

  const orden = await obtenerOrden(q, ordenId);
  publicar('cocina', 'orden_nueva', orden);
  return { orden, repetida: false };
}

async function recalcularTotal(q, ordenId) {
  await q(
    `UPDATE ordenes SET total_centavos = COALESCE((
        SELECT SUM(precio_unitario_centavos * cantidad) FROM orden_lineas
         WHERE orden_id = $1 AND estado = 'activa'), 0),
        actualizada_en = now()
      WHERE id = $1`,
    [ordenId],
  );
}

export async function cambiarEstado(ordenId, nuevo, usuario, motivo) {
  const orden = await db().tx(async (q) => {
    const r = await q('SELECT estado FROM ordenes WHERE id = $1 FOR UPDATE', [ordenId]);
    const actual = r.rows[0]?.estado;
    if (!actual) throw new ErrorNegocio(404, 'Orden no encontrada');
    const roles = TRANSICIONES[actual]?.[nuevo];
    if (!roles) throw new ErrorNegocio(409, `No se puede pasar de "${actual}" a "${nuevo}"`);
    if (!roles.includes(usuario.rol)) throw new ErrorNegocio(403, 'Tu rol no puede hacer este cambio');
    if (nuevo === 'cancelado' && !motivo) throw new ErrorNegocio(400, 'Indica el motivo de la cancelación');

    await q('UPDATE ordenes SET estado = $2, actualizada_en = now() WHERE id = $1', [ordenId, nuevo]);
    await q(
      `INSERT INTO auditoria (usuario_id, entidad, entidad_id, accion, antes, despues, motivo)
       VALUES ($1, 'orden', $2, 'estado', $3, $4, $5)`,
      [usuario.sub, ordenId, JSON.stringify({ estado: actual }), JSON.stringify({ estado: nuevo }), motivo || null],
    );
    return obtenerOrden(q, ordenId);
  });
  publicar('cocina', 'orden_actualizada', orden);
  publicar(`orden:${ordenId}`, 'orden_actualizada', orden);
  return orden;
}

export async function cambiarEstadoLinea(ordenId, lineaId, nuevo, usuario, motivo) {
  if (!['rechazada', 'cancelada'].includes(nuevo)) throw new ErrorNegocio(400, 'Estado de línea inválido');
  if (!motivo) throw new ErrorNegocio(400, 'Indica el motivo');
  const orden = await db().tx(async (q) => {
    const r = await q(
      `SELECT l.estado FROM orden_lineas l JOIN ordenes o ON o.id = l.orden_id
        WHERE l.id = $1 AND l.orden_id = $2 AND o.estado = ANY($3::text[]) FOR UPDATE`,
      [lineaId, ordenId, ESTADOS_ACTIVOS],
    );
    if (r.rows[0]?.estado !== 'activa') throw new ErrorNegocio(409, 'La línea no se puede modificar');
    await q('UPDATE orden_lineas SET estado = $2 WHERE id = $1', [lineaId, nuevo]);
    await recalcularTotal(q, ordenId);
    await q(
      `INSERT INTO auditoria (usuario_id, entidad, entidad_id, accion, antes, despues, motivo)
       VALUES ($1, 'orden_linea', $2, 'estado', $3, $4, $5)`,
      [usuario.sub, String(lineaId), JSON.stringify({ estado: 'activa' }), JSON.stringify({ estado: nuevo }), motivo],
    );
    return obtenerOrden(q, ordenId);
  });
  publicar('cocina', 'orden_actualizada', orden);
  publicar(`orden:${ordenId}`, 'orden_actualizada', orden);
  return orden;
}
