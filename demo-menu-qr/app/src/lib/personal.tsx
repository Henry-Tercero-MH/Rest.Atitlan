import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { api } from '@/lib/api';

export type Usuario = { id: number; nombre: string; rol: string };
type Sesion = { token: string; usuario: Usuario };
type Ctx = {
  sesion: Sesion | null;
  cargando: boolean;
  entrar: (usuario: string, pin: string) => Promise<void>;
  salir: () => void;
};

const PersonalCtx = createContext<Ctx | null>(null);
const LLAVE = 'personal:sesion';

export function PersonalProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(LLAVE)
      .then((v) => v && setSesion(JSON.parse(v)))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const entrar = async (usuario: string, pin: string) => {
    const s = await api<Sesion>('/auth/login', { method: 'POST', body: { usuario, pin } });
    setSesion(s);
    AsyncStorage.setItem(LLAVE, JSON.stringify(s)).catch(() => {});
  };
  const salir = () => {
    setSesion(null);
    AsyncStorage.removeItem(LLAVE).catch(() => {});
  };

  return <PersonalCtx.Provider value={{ sesion, cargando, entrar, salir }}>{children}</PersonalCtx.Provider>;
}

export function usePersonal() {
  const c = useContext(PersonalCtx);
  if (!c) throw new Error('usePersonal fuera de PersonalProvider');
  return c;
}
