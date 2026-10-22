import { useCallback, useEffect, useState } from 'react';

import { api, suscribir, type Producto, type Seccion } from '@/lib/api';

let cache: Seccion[] | null = null;

export function useMenu() {
  const [secciones, setSecciones] = useState<Seccion[] | null>(cache);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const r = await api<{ secciones: Seccion[] }>('/menu');
      cache = r.secciones;
      setSecciones(r.secciones);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    // Primera carga con el evento «inicio»; si cocina marca un platillo agotado, el menú se actualiza solo.
    return suscribir('/menu/eventos', () => cargar(), { respaldoMs: 60000 });
  }, [cargar]);

  return { secciones, error, recargar: cargar };
}

export function buscarProducto(secciones: Seccion[] | null, id: number): Producto | undefined {
  return secciones?.flatMap((s) => s.productos).find((p) => p.id === id);
}
