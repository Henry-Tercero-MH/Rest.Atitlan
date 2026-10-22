// Preferencias del cliente: idioma (ES/EN) y modo claro/oscuro, guardadas en el dispositivo.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { Temas, type ColoresTema, type Modo } from '@/constants/theme';
import { textos, type Idioma, type Clave } from '@/lib/textos';

type Ctx = {
  idioma: Idioma;
  setIdioma: (i: Idioma) => void;
  t: (clave: Clave, vars?: Record<string, string | number>) => string;
  /** Elige el texto del catálogo según el idioma, con respaldo al español. */
  tr: (es: string, en?: string | null) => string;
  modo: Modo;
  alternarModo: () => void;
  c: ColoresTema;
};

const PrefCtx = createContext<Ctx | null>(null);
const LLAVE = 'preferencias';

export function PreferenciasProvider({ children }: { children: ReactNode }) {
  const sistema = useColorScheme();
  const [idioma, setIdiomaEstado] = useState<Idioma>('es');
  const [modoElegido, setModoElegido] = useState<Modo | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(LLAVE)
      .then((v) => {
        if (!v) return;
        const p = JSON.parse(v) as { idioma?: Idioma; modo?: Modo };
        if (p.idioma) setIdiomaEstado(p.idioma);
        if (p.modo) setModoElegido(p.modo);
      })
      .catch(() => {});
  }, []);

  const guardar = useCallback((p: { idioma: Idioma; modo: Modo | null }) => {
    AsyncStorage.setItem(LLAVE, JSON.stringify(p)).catch(() => {});
  }, []);

  const modo: Modo = modoElegido ?? (sistema === 'dark' ? 'oscuro' : 'claro');

  const valor = useMemo<Ctx>(() => ({
    idioma,
    setIdioma: (i) => {
      setIdiomaEstado(i);
      guardar({ idioma: i, modo: modoElegido });
    },
    t: (clave, vars) => {
      let s: string = textos[idioma][clave] ?? textos.es[clave];
      for (const [k, v] of Object.entries(vars ?? {})) s = s.replace(`{${k}}`, String(v));
      return s;
    },
    tr: (es, en) => (idioma === 'en' && en ? en : es),
    modo,
    alternarModo: () => {
      const nuevo: Modo = modo === 'claro' ? 'oscuro' : 'claro';
      setModoElegido(nuevo);
      guardar({ idioma, modo: nuevo });
    },
    c: Temas[modo],
  }), [idioma, modo, modoElegido, guardar]);

  return <PrefCtx.Provider value={valor}>{children}</PrefCtx.Provider>;
}

const POR_DEFECTO: Ctx = {
  idioma: 'es',
  setIdioma: () => {},
  t: (clave) => textos.es[clave],
  tr: (es) => es,
  modo: 'claro',
  alternarModo: () => {},
  c: Temas.claro,
};

/** Fuera del flujo del cliente (personal) se usa siempre claro y en español. */
export function usePref() {
  return useContext(PrefCtx) ?? POR_DEFECTO;
}
