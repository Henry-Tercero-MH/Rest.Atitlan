/**
 * MODO DEMO SIN SERVIDOR.
 * Simula el API dentro del navegador para poder mostrar el demo (p. ej. en Vercel) sin backend.
 * Replica las reglas principales del backend: precios recalculados, idempotencia, transiciones de
 * estado por rol y agotados. El estado se guarda en localStorage y se comparte entre pestañas
 * con BroadcastChannel, así el cliente y la cocina se ven en tiempo real en el mismo navegador.
 * NO sustituye al backend: en producción se usa el API real (EXPO_PUBLIC_API_URL).
 */
import type { EstadoOrden } from '@/constants/theme';
import type { LineaOrden, Orden, Producto, Seccion } from '@/lib/api';
import MENU from './menu.json';

type Rol = 'admin' | 'gerente' | 'cocina' | 'mesero' | 'caja';
type MesaDemo = { id: number; numero: string; capacidad: number; area: string; estado: string; qr_token: string; sesion_id: string | null; abierta_en: string | null };
type OrdenDemo = Orden & { mesa_id: number | null; sesion_id: string | null };
type Estado = {
  version: 1;
  productos: Record<number, { disponible: boolean; precio_centavos: number }>;
  mesas: MesaDemo[];
  ordenes: OrdenDemo[];
  secuencia: number;
  idempotencia: Record<string, string>;
};

export class ErrorDemo extends Error {
  constructor(public status: number, message: string, public datos: Record<string, unknown> = {}) {
    super(message);
  }
}

const secciones = (MENU as { secciones: Seccion[] }).secciones;
const productosBase = new Map<number, Producto>(secciones.flatMap((s) => s.productos).map((p) => [p.id, p]));

const MESAS: [string, number, string, string][] = [
  ['M1', 2, 'Salón', 'demo-m1-a7k2'], ['M2', 4, 'Salón', 'demo-m2-p9x4'], ['M3', 4, 'Salón', 'demo-m3-r2w8'],
  ['M4', 6, 'Terraza', 'demo-m4-t5n1'], ['M5', 6, 'Terraza', 'demo-m5-h3c6'], ['M6', 8, 'Terraza (vista al lago)', 'demo-m6-z8q3'],
];
const USUARIOS: Record<string, { id: number; nombre: string; rol: Rol; pin: string }> = {
  admin: { id: 1, nombre: '[EJEMPLO] Administración', rol: 'admin', pin: '1234' },
  cocina: { id: 2, nombre: '[EJEMPLO] Cocina', rol: 'cocina', pin: '1111' },
  mesero: { id: 3, nombre: '[EJEMPLO] Mesero', rol: 'mesero', pin: '2222' },
};
const TRANSICIONES: Partial<Record<EstadoOrden, Partial<Record<EstadoOrden, Rol[]>>>> = {
  recibido: { confirmado: ['cocina', 'admin', 'gerente'], cancelado: ['cocina', 'admin', 'gerente'] },
  confirmado: { en_preparacion: ['cocina', 'admin', 'gerente'], cancelado: ['cocina', 'admin', 'gerente'] },
  en_preparacion: { listo: ['cocina', 'admin', 'gerente'], cancelado: ['admin', 'gerente'] },
  listo: { entregado: ['cocina', 'mesero', 'admin', 'gerente'] },
};
const ACTIVOS: EstadoOrden[] = ['recibido', 'confirmado', 'en_preparacion', 'listo'];

// ---------- Persistencia y eventos entre pestañas ----------
const LLAVE = 'menu-qr:demo-local';
const canalBC: BroadcastChannel | null = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('menu-qr-demo') : null;
const oyentes = new Set<(canal: string, tipo: string, datos: unknown) => void>();
canalBC?.addEventListener('message', (e) => {
  const { canal, tipo, datos } = e.data as { canal: string; tipo: string; datos: unknown };
  oyentes.forEach((f) => f(canal, tipo, datos));
});

function inicial(): Estado {
  return {
    version: 1,
    productos: {},
    mesas: MESAS.map(([numero, capacidad, area, qr_token], i) => ({
      id: i + 1, numero, capacidad, area, estado: 'disponible', qr_token, sesion_id: null, abierta_en: null,
    })),
    ordenes: [],
    secuencia: 0,
    idempotencia: {},
  };
}

let memoria: Estado | null = null;
function leer(): Estado {
  try {
    const v = globalThis.localStorage?.getItem(LLAVE);
    if (v) return JSON.parse(v) as Estado;
  } catch {}
  return memoria ?? (memoria = inicial());
}
function guardar(e: Estado) {
  memoria = e;
  try {
    globalThis.localStorage?.setItem(LLAVE, JSON.stringify(e));
  } catch {}
}
function publicar(canal: string, tipo: string, datos: unknown) {
  oyentes.forEach((f) => f(canal, tipo, datos)); // esta pestaña
  canalBC?.postMessage({ canal, tipo, datos }); // otras pestañas
}

export function suscribirDemo(canal: string, alEvento: (tipo: string, datos: unknown) => void) {
  const f = (c: string, tipo: string, datos: unknown) => c === canal && alEvento(tipo, datos);
  oyentes.add(f);
  return () => oyentes.delete(f);
}

/** Borra pedidos y cambios del demo (vuelve al estado inicial). */
export function reiniciarDemo() {
  guardar(inicial());
  publicar('cocina', 'reinicio', null);
  publicar('menu', 'menu_actualizado', null);
}

// ---------- Utilidades ----------
const numeroVisible = (n: number) => `#${String(n).padStart(4, '0')}`;
const uuid = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const ahora = () => new Date().toISOString();
const productoActual = (e: Estado, p: Producto) => ({ ...p, ...(e.productos[p.id] ?? {}) });
const disponible = (e: Estado, id: number) => e.productos[id]?.disponible ?? true;
const publica = ({ mesa_id: _m, sesion_id: _s, ...o }: OrdenDemo): Orden => o;

function usuarioDe(token?: string | null): { id: number; rol: Rol } {
  const [marca, rol, id] = (token ?? '').split('.');
  if (marca !== 'demo' || !rol) throw new ErrorDemo(401, 'Inicia sesión');
  return { id: Number(id), rol: rol as Rol };
}
function exigirRol(token: string | null | undefined, ...roles: Rol[]) {
  const u = usuarioDe(token);
  if (!roles.includes(u.rol)) throw new ErrorDemo(403, 'No tienes permiso para esta acción');
  return u;
}
function recalcular(o: OrdenDemo) {
  o.total_centavos = o.lineas.filter((l) => l.estado === 'activa').reduce((s, l) => s + l.precio_unitario_centavos * l.cantidad, 0);
  o.actualizada_en = ahora();
}

// ---------- Rutas simuladas (mismo contrato que backend/src/routes.js) ----------
type Cuerpo = Record<string, unknown> | undefined;

export async function apiDemo(ruta: string, metodo: string, cuerpo: Cuerpo, token?: string | null): Promise<unknown> {
  await new Promise((r) => setTimeout(r, 120)); // simula red
  const e = leer();
  const [camino] = ruta.split('?');
  let m: RegExpMatchArray | null;

  if (metodo === 'GET' && camino === '/menu') {
    return {
      secciones: secciones.map((s) => ({
        ...s,
        productos: s.productos.filter((p) => disponible(e, p.id)).map((p) => productoActual(e, p)),
      })),
    };
  }

  if (metodo === 'GET' && (m = camino.match(/^\/mesas\/qr\/([^/]+)$/))) {
    if (m[1] === 'general') return { general: true, mesa: null };
    const mesa = e.mesas.find((x) => x.qr_token === m![1]);
    if (!mesa) throw new ErrorDemo(404, 'Este código QR no es válido. Pide ayuda al personal.');
    return { general: false, mesa: { numero: mesa.numero, area: mesa.area } };
  }

  if (metodo === 'GET' && (m = camino.match(/^\/mesas\/qr\/([^/]+)\/ordenes$/))) {
    const mesa = e.mesas.find((x) => x.qr_token === m![1]);
    const ordenes = mesa?.sesion_id ? e.ordenes.filter((o) => o.sesion_id === mesa.sesion_id).map(publica) : [];
    return { ordenes, total_centavos: ordenes.filter((o) => o.estado !== 'cancelado').reduce((s, o) => s + o.total_centavos, 0) };
  }

  if (metodo === 'POST' && camino === '/ordenes') {
    const { qr_token, idempotency_key, lineas } = (cuerpo ?? {}) as {
      qr_token?: string; idempotency_key?: string;
      lineas?: { producto_id: number; cantidad: number; modificadores?: number[]; nota?: string }[];
    };
    if (!qr_token || !idempotency_key || !Array.isArray(lineas) || !lineas.length) throw new ErrorDemo(400, 'Pedido inválido');
    // Idempotencia: un reintento con la misma clave devuelve la misma orden.
    const previa = e.idempotencia[idempotency_key];
    if (previa) return { orden: publica(e.ordenes.find((o) => o.id === previa)!), repetida: true };

    let mesa: MesaDemo | undefined;
    if (qr_token !== 'general') {
      mesa = e.mesas.find((x) => x.qr_token === qr_token);
      if (!mesa) throw new ErrorDemo(404, 'Este código QR no es válido. Pide ayuda al personal.');
      if (!mesa.sesion_id) {
        mesa.sesion_id = uuid();
        mesa.abierta_en = ahora();
      }
      mesa.estado = 'ocupada';
    }
    const agotados = [...new Set(lineas.map((l) => l.producto_id))].filter((id) => !productosBase.has(id) || !disponible(e, id));
    if (agotados.length) throw new ErrorDemo(409, 'Algunos platillos se agotaron. Quítalos del pedido para continuar.', { agotados });

    // Precios SIEMPRE recalculados aquí, nunca los del cliente.
    const nuevas: LineaOrden[] = lineas.map((l, i) => {
      const p = productoActual(e, productosBase.get(l.producto_id)!);
      const elegidas = p.grupos.flatMap((g) => g.opciones).filter((o) => (l.modificadores ?? []).includes(o.id));
      for (const g of p.grupos) {
        const n = elegidas.filter((o) => g.opciones.some((x) => x.id === o.id)).length;
        if (n < g.min_sel || n > g.max_sel) throw new ErrorDemo(400, `Revisa "${g.nombre}" en ${p.nombre}`);
      }
      return {
        id: e.secuencia * 100 + i + 1,
        producto_id: p.id,
        nombre: p.nombre,
        cantidad: Math.max(1, Math.min(50, Math.trunc(l.cantidad))),
        precio_unitario_centavos: p.precio_centavos + elegidas.reduce((s, o) => s + o.precio_extra_centavos, 0),
        nota: (l.nota ?? '').slice(0, 140),
        estado: 'activa',
        modificadores: elegidas.map((o) => ({ nombre: o.nombre, precio_extra_centavos: o.precio_extra_centavos })),
      };
    });
    e.secuencia += 1;
    const orden: OrdenDemo = {
      id: uuid(), numero_visible: numeroVisible(e.secuencia), estado: 'recibido', total_centavos: 0,
      creada_en: ahora(), actualizada_en: ahora(), mesa: mesa?.numero ?? null, lineas: nuevas,
      mesa_id: mesa?.id ?? null, sesion_id: mesa?.sesion_id ?? null,
    };
    recalcular(orden);
    e.ordenes.push(orden);
    e.idempotencia[idempotency_key] = orden.id;
    guardar(e);
    publicar('cocina', 'orden_nueva', publica(orden));
    return { orden: publica(orden), repetida: false };
  }

  if (metodo === 'GET' && (m = camino.match(/^\/ordenes\/([^/]+)$/))) {
    const o = e.ordenes.find((x) => x.id === m![1]);
    if (!o) throw new ErrorDemo(404, 'Orden no encontrada');
    return { orden: publica(o) };
  }

  if (metodo === 'POST' && camino === '/asistencia') {
    const { qr_token, tipo } = (cuerpo ?? {}) as { qr_token?: string; tipo?: string };
    const mesa = e.mesas.find((x) => x.qr_token === qr_token);
    publicar('personal', 'asistencia', { tipo, mesa: mesa?.numero ?? null, en: ahora() });
    return { ok: true };
  }

  if (metodo === 'POST' && camino === '/auth/login') {
    const { usuario, pin } = (cuerpo ?? {}) as { usuario?: string; pin?: string };
    const u = USUARIOS[String(usuario ?? '')];
    if (!u || u.pin !== pin) throw new ErrorDemo(401, 'Usuario o PIN incorrecto');
    return { token: `demo.${u.rol}.${u.id}`, usuario: { id: u.id, nombre: u.nombre, rol: u.rol } };
  }

  if (metodo === 'GET' && camino === '/cocina/ordenes') {
    exigirRol(token, 'admin', 'gerente', 'cocina', 'mesero');
    return {
      ordenes: e.ordenes.filter((o) => ACTIVOS.includes(o.estado)).map(publica),
      agotados: [...productosBase.keys()].filter((id) => !disponible(e, id)),
    };
  }

  if (metodo === 'PATCH' && (m = camino.match(/^\/ordenes\/([^/]+)\/estado$/))) {
    const u = exigirRol(token, 'admin', 'gerente', 'cocina', 'mesero');
    const { estado, motivo } = (cuerpo ?? {}) as { estado?: EstadoOrden; motivo?: string };
    const o = e.ordenes.find((x) => x.id === m![1]);
    if (!o) throw new ErrorDemo(404, 'Orden no encontrada');
    const roles = estado ? TRANSICIONES[o.estado]?.[estado] : undefined;
    if (!roles) throw new ErrorDemo(409, `No se puede pasar de "${o.estado}" a "${estado}"`);
    if (!roles.includes(u.rol)) throw new ErrorDemo(403, 'Tu rol no puede hacer este cambio');
    if (estado === 'cancelado' && !motivo) throw new ErrorDemo(400, 'Indica el motivo de la cancelación');
    o.estado = estado!;
    o.actualizada_en = ahora();
    guardar(e);
    publicar('cocina', 'orden_actualizada', publica(o));
    publicar(`orden:${o.id}`, 'orden_actualizada', publica(o));
    return { orden: publica(o) };
  }

  if (metodo === 'PATCH' && (m = camino.match(/^\/ordenes\/([^/]+)\/lineas\/(\d+)$/))) {
    exigirRol(token, 'admin', 'gerente', 'cocina', 'mesero');
    const { estado, motivo } = (cuerpo ?? {}) as { estado?: 'rechazada' | 'cancelada'; motivo?: string };
    const o = e.ordenes.find((x) => x.id === m![1]);
    const l = o?.lineas.find((x) => x.id === Number(m![2]));
    if (!o || !l || l.estado !== 'activa' || !ACTIVOS.includes(o.estado)) throw new ErrorDemo(409, 'La línea no se puede modificar');
    if (!motivo || !estado) throw new ErrorDemo(400, 'Indica el motivo');
    l.estado = estado;
    recalcular(o);
    guardar(e);
    publicar('cocina', 'orden_actualizada', publica(o));
    publicar(`orden:${o.id}`, 'orden_actualizada', publica(o));
    return { orden: publica(o) };
  }

  if (metodo === 'GET' && camino === '/admin/productos') {
    exigirRol(token, 'admin', 'gerente', 'cocina', 'mesero');
    return {
      productos: secciones.flatMap((s) => s.productos.map((p) => {
        const a = productoActual(e, p);
        return { id: p.id, nombre: p.nombre, precio_centavos: a.precio_centavos, disponible: disponible(e, p.id), seccion: s.nombre };
      })),
    };
  }

  if (metodo === 'PATCH' && (m = camino.match(/^\/admin\/productos\/(\d+)$/))) {
    const u = exigirRol(token, 'admin', 'gerente', 'cocina', 'mesero');
    const id = Number(m[1]);
    const p = productosBase.get(id);
    if (!p) throw new ErrorDemo(404, 'Platillo no encontrado');
    const { disponible: disp, precio_centavos } = (cuerpo ?? {}) as { disponible?: boolean; precio_centavos?: number };
    const actual = { disponible: disponible(e, id), precio_centavos: productoActual(e, p).precio_centavos };
    if (typeof disp === 'boolean') actual.disponible = disp;
    if (precio_centavos !== undefined) {
      if (!['admin', 'gerente'].includes(u.rol)) throw new ErrorDemo(403, 'Solo administración cambia precios');
      actual.precio_centavos = precio_centavos;
    }
    e.productos[id] = actual;
    guardar(e);
    publicar('menu', 'menu_actualizado', { producto_id: id, ...actual });
    publicar('cocina', 'producto_actualizado', { producto_id: id, ...actual });
    return { producto: { id, ...actual } };
  }

  if (metodo === 'GET' && camino === '/admin/mesas') {
    exigirRol(token, 'admin', 'gerente', 'cocina', 'mesero', 'caja');
    return {
      mesas: e.mesas.map((x) => ({
        ...x,
        consumo_centavos: x.sesion_id
          ? e.ordenes.filter((o) => o.sesion_id === x.sesion_id && o.estado !== 'cancelado').reduce((s, o) => s + o.total_centavos, 0)
          : 0,
      })),
    };
  }

  if (metodo === 'POST' && (m = camino.match(/^\/admin\/mesas\/(\d+)\/(abrir|cerrar)$/))) {
    exigirRol(token, 'admin', 'gerente', 'cocina', 'mesero', 'caja');
    const mesa = e.mesas.find((x) => x.id === Number(m![1]));
    if (!mesa) throw new ErrorDemo(404, 'Mesa no encontrada');
    if (m[2] === 'abrir') {
      if (mesa.sesion_id) throw new ErrorDemo(409, 'La mesa ya tiene una sesión abierta');
      mesa.sesion_id = uuid();
      mesa.abierta_en = ahora();
      mesa.estado = 'ocupada';
    } else {
      if (!mesa.sesion_id) throw new ErrorDemo(409, 'La mesa no tiene sesión abierta');
      mesa.sesion_id = null;
      mesa.abierta_en = null;
      mesa.estado = 'disponible';
    }
    guardar(e);
    return { ok: true };
  }

  throw new ErrorDemo(404, `Ruta no disponible en modo demo: ${metodo} ${camino}`);
}
