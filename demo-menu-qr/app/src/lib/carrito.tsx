import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { nuevaClave, type Opcion, type Producto } from '@/lib/api';

export type LineaCarrito = {
  uid: string;
  producto_id: number;
  nombre: string;
  precio_base_centavos: number;
  opciones: Opcion[];
  cantidad: number;
  nota: string;
};

type Estado = {
  lineas: LineaCarrito[];
  // Clave de idempotencia del intento de envío actual: se reutiliza en reintentos
  // y se descarta cuando el carrito cambia o el servidor confirma.
  clave: string | null;
};

type Ctx = {
  token: string;
  lineas: LineaCarrito[];
  cantidadTotal: number;
  totalEstimado: number;
  agregar: (p: Producto, opciones: Opcion[], cantidad: number, nota: string) => void;
  cambiarCantidad: (uid: string, cantidad: number) => void;
  quitarProductos: (ids: number[]) => void;
  claveEnvio: () => string;
  vaciar: () => void;
};

const CarritoCtx = createContext<Ctx | null>(null);
const VACIO: Estado = { lineas: [], clave: null };

export function precioLinea(l: LineaCarrito) {
  return (l.precio_base_centavos + l.opciones.reduce((s, o) => s + o.precio_extra_centavos, 0)) * l.cantidad;
}

export function CarritoProvider({ token, children }: { token: string; children: ReactNode }) {
  const llave = `carrito:${token}`;
  const [estado, setEstado] = useState<Estado>(VACIO);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(llave)
      .then((v) => setEstado(v ? (JSON.parse(v) as Estado) : VACIO))
      .catch(() => setEstado(VACIO))
      .finally(() => setCargado(true));
  }, [llave]);

  useEffect(() => {
    if (cargado) AsyncStorage.setItem(llave, JSON.stringify(estado)).catch(() => {});
  }, [estado, cargado, llave]);

  const valor = useMemo<Ctx>(() => {
    const mutar = (fn: (l: LineaCarrito[]) => LineaCarrito[]) => setEstado((e) => ({ lineas: fn(e.lineas), clave: null }));
    return {
      token,
      lineas: estado.lineas,
      cantidadTotal: estado.lineas.reduce((s, l) => s + l.cantidad, 0),
      totalEstimado: estado.lineas.reduce((s, l) => s + precioLinea(l), 0),
      agregar: (p, opciones, cantidad, nota) =>
        mutar((ls) => [
          ...ls,
          { uid: nuevaClave(), producto_id: p.id, nombre: p.nombre, precio_base_centavos: p.precio_centavos, opciones, cantidad, nota },
        ]),
      cambiarCantidad: (uid, cantidad) =>
        mutar((ls) => (cantidad <= 0 ? ls.filter((l) => l.uid !== uid) : ls.map((l) => (l.uid === uid ? { ...l, cantidad } : l)))),
      quitarProductos: (ids) => mutar((ls) => ls.filter((l) => !ids.includes(l.producto_id))),
      claveEnvio: () => {
        if (estado.clave) return estado.clave;
        const clave = nuevaClave();
        setEstado((e) => ({ ...e, clave }));
        return clave;
      },
      vaciar: () => setEstado(VACIO),
    };
  }, [estado, token]);

  return <CarritoCtx.Provider value={valor}>{children}</CarritoCtx.Provider>;
}

export function useCarrito() {
  const c = useContext(CarritoCtx);
  if (!c) throw new Error('useCarrito fuera de CarritoProvider');
  return c;
}
