import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { db, UNIQUE_VIOLATION } from './db/index.js';
import { requireRol, signToken, verifyPin } from './auth.js';
import { publicar, suscribirSSE } from './events.js';
import {
  ErrorNegocio, ESTADOS_ACTIVOS, cambiarEstado, cambiarEstadoLinea, crearOrden, obtenerOrden,
} from './ordenes.js';

const r = Router();
const q = (sql, params) => db().query(sql, params);
const staff = requireRol('admin', 'gerente', 'cocina', 'mesero', 'caja');
const cocina = requireRol('admin', 'gerente', 'cocina', 'mesero');
const admin = requireRol('admin', 'gerente');
const UUID = /^[0-9a-f-]{36}$/i;

// Envuelve rutas async para mandar los errores al manejador central.
const h = (fn) => (req, res, next) => fn(req, res, next).catch(next);

async function auditar(usuarioId, entidad, entidadId, accion, antes, despues, motivo = null) {
  await q(
    `INSERT INTO auditoria (usuario_id, entidad, entidad_id, accion, antes, despues, motivo)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [usuarioId, entidad, String(entidadId), accion, JSON.stringify(antes), JSON.stringify(despues), motivo],
  );
}

// ======================= Público (cliente por QR) =======================

r.get('/health', (_req, res) => res.json({ ok: true, db: db().kind }));

r.get('/menu', h(async (_req, res) => {
  const secciones = await q('SELECT id, nombre, nombre_en FROM secciones WHERE activa ORDER BY orden');
  const productos = await q(
    `SELECT id, seccion_id, nombre, nombre_en, descripcion, descripcion_en, precio_centavos, imagen_path,
            vegetariano, picante, recomendado, sabor_local
       FROM productos WHERE activo AND disponible ORDER BY orden, id`,
  );
  const grupos = await q(
    `SELECT g.id, g.producto_id, g.nombre, g.nombre_en, g.min_sel, g.max_sel,
            json_agg(json_build_object('id', m.id, 'nombre', m.nombre, 'nombre_en', m.nombre_en,
                                       'precio_extra_centavos', m.precio_extra_centavos)
                     ORDER BY m.id) AS opciones
       FROM grupos_modificador g JOIN modificadores m ON m.grupo_id = g.id AND m.disponible
      GROUP BY g.id ORDER BY g.id`,
  );
  res.json({
    secciones: secciones.rows.map((s) => ({
      ...s,
      productos: productos.rows
        .filter((p) => p.seccion_id === s.id)
        .map((p) => ({ ...p, grupos: grupos.rows.filter((g) => g.producto_id === p.id) })),
    })),
  });
}));

r.get('/menu/eventos', (req, res) => suscribirSSE(req, res, 'menu'));

r.get('/mesas/qr/:token', h(async (req, res) => {
  if (req.params.token === 'general') return res.json({ general: true, mesa: null });
  const m = await q('SELECT numero, area, estado, activa FROM mesas WHERE qr_token = $1', [req.params.token]);
  const mesa = m.rows[0];
  if (!mesa || !mesa.activa || mesa.estado === 'fuera_de_servicio') {
    throw new ErrorNegocio(404, 'Este código QR no es válido. Pide ayuda al personal.');
  }
  res.json({ general: false, mesa: { numero: mesa.numero, area: mesa.area } });
}));

// Órdenes de la visita actual de esa mesa (pantalla "Mis órdenes").
r.get('/mesas/qr/:token/ordenes', h(async (req, res) => {
  const o = await q(
    `SELECT o.id FROM ordenes o
       JOIN sesiones_mesa s ON s.id = o.sesion_id AND s.estado <> 'cerrada'
       JOIN mesas m ON m.id = s.mesa_id
      WHERE m.qr_token = $1 ORDER BY o.creada_en`,
    [req.params.token],
  );
  const ordenes = await Promise.all(o.rows.map((x) => obtenerOrden(q, x.id)));
  const total = ordenes.filter((x) => x.estado !== 'cancelado').reduce((s, x) => s + x.total_centavos, 0);
  res.json({ ordenes, total_centavos: total });
}));

r.post('/ordenes', h(async (req, res) => {
  const { orden, repetida } = await crearOrden(req.body);
  res.status(repetida ? 200 : 201).json({ orden, repetida });
}));

r.get('/ordenes/:id', h(async (req, res) => {
  if (!UUID.test(req.params.id)) throw new ErrorNegocio(404, 'Orden no encontrada');
  const orden = await obtenerOrden(q, req.params.id);
  if (!orden) throw new ErrorNegocio(404, 'Orden no encontrada');
  res.json({ orden });
}));

r.get('/ordenes/:id/eventos', (req, res) => {
  if (!UUID.test(req.params.id)) return res.status(404).end();
  suscribirSSE(req, res, `orden:${req.params.id}`);
});

r.post('/asistencia', h(async (req, res) => {
  const { qr_token, tipo } = req.body || {};
  if (!['mesero', 'cuenta', 'asignar_mesa'].includes(tipo)) throw new ErrorNegocio(400, 'Solicitud inválida');
  let mesa = null;
  if (qr_token && qr_token !== 'general') {
    const m = await q('SELECT numero FROM mesas WHERE qr_token = $1 AND activa', [qr_token]);
    if (!m.rows[0]) throw new ErrorNegocio(404, 'Mesa no encontrada');
    mesa = m.rows[0].numero;
  }
  publicar('personal', 'asistencia', { tipo, mesa, en: new Date().toISOString() });
  res.status(202).json({ ok: true });
}));

// ======================= Personal =======================

r.post('/auth/login', h(async (req, res) => {
  const { usuario, pin } = req.body || {};
  const u = await q('SELECT id, nombre, rol, pin_hash FROM usuarios WHERE usuario = $1 AND activo', [String(usuario || '')]);
  if (!u.rows[0] || !(await verifyPin(String(pin || ''), u.rows[0].pin_hash))) {
    throw new ErrorNegocio(401, 'Usuario o PIN incorrecto');
  }
  const { pin_hash: _, ...datos } = u.rows[0];
  res.json({ token: signToken(datos), usuario: datos });
}));

r.get('/cocina/ordenes', cocina, h(async (_req, res) => {
  const o = await q('SELECT id FROM ordenes WHERE estado = ANY($1::text[]) ORDER BY creada_en', [ESTADOS_ACTIVOS]);
  const agotados = await q('SELECT id FROM productos WHERE NOT disponible');
  res.json({
    ordenes: await Promise.all(o.rows.map((x) => obtenerOrden(q, x.id))),
    agotados: agotados.rows.map((x) => x.id),
  });
}));

r.get('/cocina/eventos', cocina, (req, res) => suscribirSSE(req, res, 'cocina'));
r.get('/personal/eventos', staff, (req, res) => suscribirSSE(req, res, 'personal'));

r.patch('/ordenes/:id/estado', cocina, h(async (req, res) => {
  if (!UUID.test(req.params.id)) throw new ErrorNegocio(404, 'Orden no encontrada');
  res.json({ orden: await cambiarEstado(req.params.id, req.body?.estado, req.usuario, req.body?.motivo) });
}));

r.patch('/ordenes/:id/lineas/:lineaId', cocina, h(async (req, res) => {
  if (!UUID.test(req.params.id)) throw new ErrorNegocio(404, 'Orden no encontrada');
  const orden = await cambiarEstadoLinea(
    req.params.id, Number(req.params.lineaId), req.body?.estado, req.usuario, req.body?.motivo,
  );
  res.json({ orden });
}));

// Disponibilidad: cocina puede marcar agotado; precio solo admin/gerente.
r.get('/admin/productos', cocina, h(async (_req, res) => {
  const p = await q(
    `SELECT p.id, p.nombre, p.precio_centavos, p.disponible, s.nombre AS seccion
       FROM productos p JOIN secciones s ON s.id = p.seccion_id
      WHERE p.activo ORDER BY s.orden, p.orden`,
  );
  res.json({ productos: p.rows });
}));

r.patch('/admin/productos/:id', cocina, h(async (req, res) => {
  const id = Number(req.params.id);
  const { disponible, precio_centavos } = req.body || {};
  const antes = (await q('SELECT disponible, precio_centavos FROM productos WHERE id = $1', [id])).rows[0];
  if (!antes) throw new ErrorNegocio(404, 'Platillo no encontrado');
  const despues = { ...antes };
  if (typeof disponible === 'boolean') despues.disponible = disponible;
  if (precio_centavos !== undefined) {
    if (!['admin', 'gerente'].includes(req.usuario.rol)) throw new ErrorNegocio(403, 'Solo administración cambia precios');
    if (!Number.isInteger(precio_centavos) || precio_centavos < 0) throw new ErrorNegocio(400, 'Precio inválido');
    despues.precio_centavos = precio_centavos;
  }
  await q('UPDATE productos SET disponible = $2, precio_centavos = $3 WHERE id = $1', [
    id, despues.disponible, despues.precio_centavos,
  ]);
  await auditar(req.usuario.sub, 'producto', id, 'actualizar', antes, despues);
  publicar('menu', 'menu_actualizado', { producto_id: id, ...despues });
  publicar('cocina', 'producto_actualizado', { producto_id: id, ...despues });
  res.json({ producto: { id, ...despues } });
}));

r.get('/admin/mesas', staff, h(async (_req, res) => {
  const m = await q(
    `SELECT m.id, m.numero, m.capacidad, m.area, m.estado, m.qr_token, m.activa,
            s.id AS sesion_id, s.abierta_en,
            COALESCE((SELECT SUM(o.total_centavos) FROM ordenes o
                       WHERE o.sesion_id = s.id AND o.estado <> 'cancelado'), 0)::int AS consumo_centavos
       FROM mesas m LEFT JOIN sesiones_mesa s ON s.mesa_id = m.id AND s.estado <> 'cerrada'
      ORDER BY m.id`,
  );
  res.json({ mesas: m.rows });
}));

r.post('/admin/mesas', admin, h(async (req, res) => {
  const { numero, capacidad = 4, area = 'Salón' } = req.body || {};
  if (!numero || typeof numero !== 'string') throw new ErrorNegocio(400, 'Indica el número de mesa');
  const token = randomBytes(9).toString('base64url');
  try {
    const m = await q(
      'INSERT INTO mesas (numero, capacidad, area, qr_token) VALUES ($1, $2, $3, $4) RETURNING *',
      [numero.trim(), Number(capacidad) || 4, String(area), token],
    );
    await auditar(req.usuario.sub, 'mesa', m.rows[0].id, 'crear', null, m.rows[0]);
    res.status(201).json({ mesa: m.rows[0] });
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) throw new ErrorNegocio(409, 'Ya existe una mesa con ese número');
    throw err;
  }
}));

r.post('/admin/mesas/:id/abrir', staff, h(async (req, res) => {
  const id = Number(req.params.id);
  try {
    await db().tx(async (tq) => {
      await tq('INSERT INTO sesiones_mesa (mesa_id, abierta_por) VALUES ($1, $2)', [id, req.usuario.sub]);
      await tq(`UPDATE mesas SET estado = 'ocupada' WHERE id = $1`, [id]);
    });
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) throw new ErrorNegocio(409, 'La mesa ya tiene una sesión abierta');
    throw err;
  }
  await auditar(req.usuario.sub, 'mesa', id, 'abrir_sesion', null, { estado: 'ocupada' });
  res.json({ ok: true });
}));

// Etapa 1: el personal cierra la sesión después de cobrar por fuera del sistema.
r.post('/admin/mesas/:id/cerrar', staff, h(async (req, res) => {
  const id = Number(req.params.id);
  const s = await q(
    `UPDATE sesiones_mesa SET estado = 'cerrada', cerrada_en = now(), cerrada_por = $2
      WHERE mesa_id = $1 AND estado <> 'cerrada' RETURNING id`,
    [id, req.usuario.sub],
  );
  if (!s.rows[0]) throw new ErrorNegocio(409, 'La mesa no tiene sesión abierta');
  await q(`UPDATE mesas SET estado = 'disponible' WHERE id = $1`, [id]);
  await auditar(req.usuario.sub, 'mesa', id, 'cerrar_sesion', { estado: 'ocupada' }, { estado: 'disponible' });
  res.json({ ok: true });
}));

r.get('/admin/mesas/:id/consumo', staff, h(async (req, res) => {
  const o = await q(
    `SELECT o.id FROM ordenes o JOIN sesiones_mesa s ON s.id = o.sesion_id AND s.estado <> 'cerrada'
      WHERE s.mesa_id = $1 ORDER BY o.creada_en`,
    [Number(req.params.id)],
  );
  const ordenes = await Promise.all(o.rows.map((x) => obtenerOrden(q, x.id)));
  const total = ordenes.filter((x) => x.estado !== 'cancelado').reduce((s, x) => s + x.total_centavos, 0);
  res.json({ ordenes, total_centavos: total });
}));

export default r;
