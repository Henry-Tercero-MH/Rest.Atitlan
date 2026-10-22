// Piezas del lenguaje «carta impresa»: contenedor, volver, antetítulo, título y línea fina.
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { AnchoMax, Espacio, Fuentes } from '@/constants/theme';
import { usePref } from '@/lib/preferencias';

export function Contenedor({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[s.contenedor, style]}>{children}</View>;
}

export function Volver({ texto, a }: { texto: string; a: string }) {
  const { c } = usePref();
  return (
    <Pressable accessibilityRole="link" hitSlop={8} style={s.volver}
      onPress={() => (router.canGoBack() ? router.back() : router.replace(a as never))}>
      <ChevronLeft size={18} color={c.texto} strokeWidth={1.75} />
      <Text style={{ fontFamily: Fuentes.medio, fontSize: 15, color: c.texto }}>{texto}</Text>
    </Pressable>
  );
}

export function Antetitulo({ children, color }: { children: string; color?: string }) {
  const { c } = usePref();
  return <Text style={[s.antetitulo, { color: color ?? c.precio }]}>{children.toUpperCase()}</Text>;
}

export function TituloCarta({ children, tam = 34 }: { children: ReactNode; tam?: number }) {
  const { c } = usePref();
  return (
    <Text accessibilityRole="header" style={{ fontFamily: Fuentes.tituloFuerte, fontSize: tam, lineHeight: tam * 1.12, letterSpacing: -0.5, color: c.texto }}>
      {children}
    </Text>
  );
}

/** Línea fina; `fuerte` para abrir una lista (como el filete de una carta). */
export function Linea({ fuerte, style }: { fuerte?: boolean; style?: ViewStyle }) {
  const { c } = usePref();
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: fuerte ? c.texto : c.borde, opacity: fuerte ? 0.6 : 1 }, style]} />;
}

const s = StyleSheet.create({
  contenedor: { width: '100%', maxWidth: AnchoMax, alignSelf: 'center', paddingHorizontal: Espacio.l },
  volver: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 44, alignSelf: 'flex-start' },
  antetitulo: { fontFamily: Fuentes.fuerte, fontSize: 12, letterSpacing: 2 },
});
