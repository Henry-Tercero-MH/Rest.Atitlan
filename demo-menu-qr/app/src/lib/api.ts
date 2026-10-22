import { Platform } from 'react-native';

import type { EstadoOrden } from '@/constants/theme';
import { apiDemo, ErrorDemo, suscribirDemo } from '@/demo/servidor-local';

const URL_LOCAL = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || URL_LOCAL).replace(/\/$/, '');

/**
 * Interruptor de modo demo (sin servidor): el API se simula en el navegador.
 * - EXPO_PUBLIC_MODO=demo → siempre demo · EXPO_PUBLIC_MODO=api → siempre API real.
 * - Sin configurar: demo si no hay EXPO_PUBLIC_API_URL y la web no corre en la red local (p. ej. Vercel).
 */
const MODO = process.env.EXPO_PUBLIC_MODO;
const enRedLocal =
  Platform.OS !== 'web' ||
  typeof window === 'undefined' ||
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(window.location.hostname);
export const MODO_DEMO = MODO === 'demo' || (MODO !== 'api' && !process.env.EXPO_PUBLIC_API_URL && !enRedLocal);

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const BUCKET = process.env.EXPO_PUBLIC_SUPABASE_BUCKET || 'platillos';

// Las fotos viven en Supabase Storage (bucket público de solo lectura); la BD guarda solo la ruta.
export function urlImagen(path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  // Sin Supabase configurado (demo), las sirve el propio API en /fotos con la misma ruta relativa.
  return SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}` : `${API_URL}/fotos/${path}`;
}

export type Opcion = { id: number; nombre: string; nombre_en?: string | null; precio_extra_centavos: number };
export type Grupo = { id: number; nombre: string; nombre_en?: string | null; min_sel: number; max_sel: number; opciones: Opcion[] };
export type Producto = {
  id: number;
  seccion_id: number;
  nombre: string;
  nombre_en?: string | null;
  descripcion: string;
  descripcion_en?: string | null;
  precio_centavos: number;
  imagen_path: string | null;
  vegetariano?: boolean;
  picante?: boolean;
  recomendado?: boolean;
  sabor_local?: boolean;
  grupos: Grupo[];
};
export type Seccion = { id: number; nombre: string; nombre_en?: string | null; productos: Producto[] };

export type LineaOrden = {
  id: number;
  producto_id: number;
  nombre: string;
  cantidad: number;
  precio_unitario_centavos: number;
  nota: string;
  estado: 'activa' | 'rechazada' | 'cancelada';
  modificadores: { nombre: string; precio_extra_centavos: number }[];
};
export type Orden = {
  id: string;
  numero_visible: string;
  estado: EstadoOrden;
  total_centavos: number;
  creada_en: string;
  actualizada_en: string;
  mesa: string | null;
  lineas: LineaOrden[];
};

export class ErrorApi extends Error {
  constructor(
    public status: number,
    message: string,
    public datos: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export async function api<T>(ruta: string, opciones: { method?: string; body?: unknown; token?: string | null } = {}): Promise<T> {
  if (MODO_DEMO) {
    try {
      return (await apiDemo(ruta, opciones.method || 'GET', opciones.body as Record<string, unknown>, opciones.token)) as T;
    } catch (e) {
      if (e instanceof ErrorDemo) throw new ErrorApi(e.status, e.message, e.datos);
      throw e;
    }
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${ruta}`, {
      method: opciones.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(opciones.token ? { Authorization: `Bearer ${opciones.token}` } : {}),
      },
      body: opciones.body ? JSON.stringify(opciones.body) : undefined,
    });
  } catch {
    throw new ErrorApi(0, 'Sin conexión con el restaurante');
  }
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new ErrorApi(res.status, datos.error || 'Ocurrió un problema', datos);
  return datos as T;
}

export function quetzales(centavos: number): string {
  return `Q ${(centavos / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function horaGt(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guatemala' });
}

export function nuevaClave(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Tiempo real: SSE en navegador; en nativo (sin EventSource) o si se cae la conexión,
 * sondeo periódico de respaldo. Emite un evento «inicio» al suscribirse para la primera carga.
 * Devuelve la función para cancelar.
 */
export function suscribir(
  ruta: string,
  alEvento: (tipo: string, datos: unknown) => void,
  opciones: { token?: string | null; respaldoMs?: number; alConectar?: (ok: boolean) => void } = {},
): () => void {
  const inicio = setTimeout(() => alEvento('inicio', null), 0);
  const respaldo = setInterval(() => alEvento('sondeo', null), opciones.respaldoMs ?? 15000);
  if (MODO_DEMO) {
    // Canal equivalente al del servidor: /menu/eventos → menu, /ordenes/:id/eventos → orden:id, etc.
    const m = ruta.match(/^\/(?:ordenes\/([^/]+)|(menu|cocina|personal))\/eventos$/);
    const canal = m?.[1] ? `orden:${m[1]}` : (m?.[2] ?? ruta);
    const fin = suscribirDemo(canal, alEvento);
    setTimeout(() => opciones.alConectar?.(true), 0);
    return () => {
      clearTimeout(inicio);
      clearInterval(respaldo);
      fin();
    };
  }
  const ES = (globalThis as { EventSource?: typeof EventSource }).EventSource;
  if (!ES) {
    opciones.alConectar?.(true);
    return () => {
      clearTimeout(inicio);
      clearInterval(respaldo);
    };
  }
  const url = `${API_URL}/api${ruta}${opciones.token ? `?token=${encodeURIComponent(opciones.token)}` : ''}`;
  const fuente = new ES(url);
  const tipos = ['orden_nueva', 'orden_actualizada', 'producto_actualizado', 'menu_actualizado', 'asistencia'];
  for (const t of tipos) fuente.addEventListener(t, (e) => alEvento(t, JSON.parse((e as MessageEvent).data)));
  fuente.addEventListener('hola', () => opciones.alConectar?.(true));
  fuente.onerror = () => opciones.alConectar?.(false);
  return () => {
    clearTimeout(inicio);
    clearInterval(respaldo);
    fuente.close();
  };
}
