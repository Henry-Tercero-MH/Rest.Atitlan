import {
  CakeSlice, CircleAlert, Coffee, CookingPot, CupSoda, Egg, Fish, Flame, Info, Leaf, Salad, Star, TriangleAlert,
  CircleCheck, Utensils, type LucideIcon,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Tejido } from '@/components/decor';
import { AnchoMax, Espacio, Estados, Fuentes, Radio, Tinte, type EstadoOrden } from '@/constants/theme';
import { urlImagen } from '@/lib/api';
import { FOTOS_INCLUIDAS } from '@/lib/fotos';
import { usePref } from '@/lib/preferencias';

export function Pantalla({ children, fondo, scroll = true, pie }: {
  children: ReactNode;
  fondo?: string;
  scroll?: boolean;
  pie?: ReactNode;
}) {
  const { c } = usePref();
  const contenido = <View style={s.contenido}>{children}</View>;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: fondo ?? c.fondo }} edges={['top', 'bottom']}>
      {scroll ? <ScrollView contentContainerStyle={{ paddingBottom: pie ? 110 : Espacio.xl }}>{contenido}</ScrollView> : contenido}
      {pie ? <Pie>{pie}</Pie> : null}
    </SafeAreaView>
  );
}

export function Pie({ children }: { children: ReactNode }) {
  const { c } = usePref();
  return (
    <View style={[s.pie, { backgroundColor: c.barraFondo, borderTopColor: c.borde }]}>
      <View style={s.pieInterior}>{children}</View>
    </View>
  );
}

type Variante = 'primario' | 'secundario' | 'fantasma' | 'peligro';

export function Boton({ titulo, onPress, variante = 'primario', deshabilitado, cargando, style, grande, Icono }: {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  deshabilitado?: boolean;
  cargando?: boolean;
  style?: ViewStyle;
  grande?: boolean;
  Icono?: LucideIcon;
}) {
  const { c } = usePref();
  const colores: Record<Variante, { bg: string; bgP: string; fg: string; borde: string }> = {
    primario: { bg: c.primario, bgP: c.primarioPresionado, fg: c.sobrePrimario, borde: c.primario },
    secundario: { bg: c.superficie, bgP: c.superficieAlt, fg: c.texto, borde: c.borde },
    fantasma: { bg: 'transparent', bgP: c.superficieAlt, fg: c.enlace, borde: 'transparent' },
    peligro: { bg: Tinte.cochinillaSuave, bgP: '#EFCFCA', fg: Tinte.cochinillaOscura, borde: Tinte.cochinilla },
  };
  const k = colores[variante];
  const inactivo = deshabilitado || cargando;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactivo, busy: !!cargando }}
      disabled={inactivo}
      onPress={onPress}
      style={({ pressed }) => [
        s.boton,
        grande && { minHeight: 56 },
        { backgroundColor: pressed ? k.bgP : k.bg, borderColor: k.borde, opacity: inactivo ? 0.55 : 1 },
        style,
      ]}>
      {cargando ? <ActivityIndicator color={k.fg} /> : (
        <>
          {Icono ? <Icono size={grande ? 22 : 20} color={k.fg} strokeWidth={2} /> : null}
          <Text style={[s.botonTexto, { color: k.fg }, grande && { fontSize: 17 }]}>{titulo}</Text>
        </>
      )}
    </Pressable>
  );
}

export function BotonIcono({ Icono, etiqueta, onPress, color, fondo, tam = 44 }: {
  Icono: LucideIcon; etiqueta: string; onPress: () => void; color?: string; fondo?: string; tam?: number;
}) {
  const { c } = usePref();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [{
        width: tam, height: tam, borderRadius: tam / 2, alignItems: 'center', justifyContent: 'center',
        backgroundColor: fondo ?? c.superficie, borderWidth: 1, borderColor: c.borde, opacity: pressed ? 0.75 : 1,
      }]}>
      <Icono size={20} color={color ?? c.texto} strokeWidth={2} />
    </Pressable>
  );
}

export function Chip({ texto, activo, onPress, onLayout }: { texto: string; activo?: boolean; onPress: () => void; onLayout?: (x: number) => void }) {
  const { c } = usePref();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: !!activo }}
      onPress={onPress}
      onLayout={onLayout ? (e) => onLayout(e.nativeEvent.layout.x) : undefined}
      style={[s.chip, { backgroundColor: activo ? c.chipActivoFondo : c.superficie, borderColor: activo ? c.chipActivoFondo : c.borde }]}>
      <Text style={[s.chipTexto, { color: activo ? c.chipActivoTexto : c.texto }]}>{texto}</Text>
    </Pressable>
  );
}

export function EstadoBadge({ estado, grande }: { estado: EstadoOrden; grande?: boolean }) {
  const { idioma } = usePref();
  const e = Estados[estado];
  return (
    <View style={[s.badge, { backgroundColor: e.fondo }, grande && { paddingVertical: 8, paddingHorizontal: 14 }]}>
      <e.Icono size={grande ? 18 : 15} color={e.texto} strokeWidth={2.2} />
      <Text style={[s.badgeTexto, { color: e.texto }, grande && { fontSize: 16 }]}>{idioma === 'en' ? e.etiquetaEn : e.etiqueta}</Text>
    </View>
  );
}

export function Tarjeta({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { c } = usePref();
  return <View style={[s.tarjeta, { backgroundColor: c.superficie, borderColor: c.borde, shadowColor: c.sombra }, style]}>{children}</View>;
}

export function Titulo({ children, nivel = 1, color, style }: { children: ReactNode; nivel?: 1 | 2 | 3; color?: string; style?: TextStyle }) {
  const { c } = usePref();
  const tam = { 1: 28, 2: 22, 3: 18 }[nivel];
  return (
    <Text accessibilityRole="header" style={[{ fontSize: tam, lineHeight: tam * 1.2, fontFamily: nivel === 1 ? Fuentes.tituloFuerte : Fuentes.titulo, color: color ?? c.texto }, style]}>
      {children}
    </Text>
  );
}

export function Texto({ children, secundario, style, lineas }: { children: ReactNode; secundario?: boolean; style?: TextStyle; lineas?: number }) {
  const { c } = usePref();
  return (
    <Text numberOfLines={lineas} style={[{ fontSize: 16, lineHeight: 23, fontFamily: Fuentes.cuerpo, color: secundario ? c.textoSecundario : c.texto }, style]}>
      {children}
    </Text>
  );
}

export function Aviso({ tipo = 'info', children }: { tipo?: 'info' | 'error' | 'exito' | 'alerta'; children: ReactNode }) {
  const k: Record<string, [string, string, LucideIcon]> = {
    info: [Tinte.anilSuave, Tinte.anil, Info],
    error: [Tinte.cochinillaSuave, Tinte.cochinillaOscura, CircleAlert],
    exito: [Tinte.aguacateSuave, Tinte.aguacateOscuro, CircleCheck],
    alerta: [Tinte.achioteSuave, '#7A4511', TriangleAlert],
  };
  const [fondo, color, Icono] = k[tipo];
  return (
    <View accessibilityRole="alert" style={[s.aviso, { backgroundColor: fondo, borderLeftColor: color }]}>
      <Icono size={20} color={color} strokeWidth={2} />
      <Text style={{ color, flex: 1, fontSize: 15, lineHeight: 21, fontFamily: Fuentes.medio }}>{children}</Text>
    </View>
  );
}

/**
 * Etiquetas discretas, como en una carta impresa: ícono fino + texto pequeño, sin fondos de color.
 * Siempre con texto (no depender del ícono ni del color).
 */
export function Etiquetas({ vegetariano, picante, recomendado }: { vegetariano?: boolean; picante?: boolean; recomendado?: boolean }) {
  const { t, c, modo } = usePref();
  const oscuro = modo === 'oscuro';
  const items: [boolean | undefined, LucideIcon, string, string, string][] = [
    [recomendado, Star, t('deLaCasa'), c.precio, c.precio],
    [vegetariano, Leaf, t('vegetariano'), oscuro ? '#9CC28C' : Tinte.aguacateOscuro, c.textoSecundario],
    [picante, Flame, t('picante'), oscuro ? '#E9A25A' : '#9A5512', c.textoSecundario],
  ];
  const activos = items.filter(([on]) => on);
  if (!activos.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 4 }}>
      {activos.map(([, Icono, texto, colorIcono, colorTexto]) => (
        <View key={texto} style={s.etiqueta}>
          <Icono size={13} color={colorIcono} strokeWidth={1.75} fill={Icono === Star ? colorIcono : 'none'} />
          <Text style={{ color: colorTexto, fontSize: 13, fontFamily: Fuentes.medio, letterSpacing: 0.2 }}>{texto}</Text>
        </View>
      ))}
    </View>
  );
}

/** Ícono lineal de cada sección del menú (según su nombre en español). */
export function IconoSeccion({ nombre, size, color, strokeWidth = 2 }: { nombre?: string; size: number; color: string; strokeWidth?: number }) {
  const n = (nombre ?? '').toLowerCase();
  const p = { size, color, strokeWidth };
  if (n.includes('desayuno')) return <Egg {...p} />;
  if (n.includes('típico') || n.includes('tipico')) return <CookingPot {...p} />;
  if (n.includes('lago')) return <Fish {...p} />;
  if (n.includes('vegetar')) return <Salad {...p} />;
  if (n.includes('bebida')) return <CupSoda {...p} />;
  if (n.includes('café') || n.includes('cafe')) return <Coffee {...p} />;
  if (n.includes('postre')) return <CakeSlice {...p} />;
  return <Utensils {...p} />;
}

const FONDOS_FOTO = [Tinte.anilSuave, Tinte.achioteSuave, Tinte.aguacateSuave, Tinte.cochinillaSuave];
const TINTAS_FOTO = [Tinte.anil, '#9A5512', Tinte.aguacateOscuro, Tinte.cochinilla];

/**
 * Foto del platillo (Supabase o Unsplash, en WebP). Debajo siempre va la ilustración de la sección
 * (ícono + franja textil): si la foto tarda, falla o la red la bloquea, el cliente ve la ilustración y no un hueco.
 */
export function FotoPlatillo({ path, nombre, seccion, alto = 96, ancho = 96, radio = 6 }: {
  path: string | null; nombre: string; seccion?: string; alto?: number; ancho?: number | '100%'; radio?: number;
}) {
  // Primero la foto incluida en la app (carga sin red); si no está, se pide por URL.
  const url = urlImagen(path);
  const fuente = (path ? FOTOS_INCLUIDAS[path] : undefined) ?? (url ? { uri: url } : null);
  const [fallo, setFallo] = useState(false);
  const i = nombre.length % FONDOS_FOTO.length;
  return (
    <View style={{ width: ancho, height: alto, borderRadius: radio, backgroundColor: FONDOS_FOTO[i], overflow: 'hidden', justifyContent: 'space-between' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <IconoSeccion nombre={seccion} size={Math.min(alto * 0.42, 64)} color={TINTAS_FOTO[i]} strokeWidth={1.5} />
      </View>
      <Tejido alto={10} opacidad={0.8} />
      {fuente && !fallo ? (
        // Image de React Native: en web es un <img> normal (expo-image dejaba vacías las fotos remotas).
        <Image source={fuente} onError={() => setFallo(true)} resizeMode="cover" accessibilityLabel={nombre}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
      ) : null}
    </View>
  );
}

export function Campo(props: React.ComponentProps<typeof TextInput>) {
  const { c } = usePref();
  return (
    <TextInput
      placeholderTextColor={Tinte.piedra}
      {...props}
      style={[s.campo, { borderColor: c.borde, color: c.texto, backgroundColor: c.superficie }, props.style]}
    />
  );
}

export function Cargando({ texto = 'Cargando…', oscuro }: { texto?: string; oscuro?: boolean }) {
  const { c } = usePref();
  return (
    <View style={{ padding: Espacio.xxl, alignItems: 'center', gap: Espacio.m }}>
      <ActivityIndicator color={oscuro ? Tinte.achiote : c.primario} />
      <Text style={{ color: oscuro ? '#B9C3D0' : c.textoSecundario, fontFamily: Fuentes.cuerpo }}>{texto}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  contenido: { width: '100%', maxWidth: AnchoMax, alignSelf: 'center', paddingHorizontal: Espacio.l, gap: Espacio.l },
  pie: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: Espacio.l, paddingTop: Espacio.m, paddingBottom: Espacio.l, borderTopWidth: 1 },
  pieInterior: { width: '100%', maxWidth: AnchoMax, alignSelf: 'center' },
  boton: { minHeight: 48, borderRadius: Radio.m, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Espacio.l, flexDirection: 'row', gap: Espacio.s },
  botonTexto: { fontSize: 16, fontFamily: Fuentes.fuerte },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: Radio.pill, borderWidth: 1, justifyContent: 'center' },
  chipTexto: { fontSize: 15, fontFamily: Fuentes.medio },
  badge: { alignSelf: 'flex-start', borderRadius: Radio.pill, paddingVertical: 5, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeTexto: { fontSize: 14, fontFamily: Fuentes.fuerte },
  tarjeta: {
    borderRadius: Radio.l, padding: Espacio.l, borderWidth: 1, gap: Espacio.s,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  aviso: { flexDirection: 'row', gap: Espacio.s, padding: Espacio.m, borderRadius: Radio.s, borderLeftWidth: 4, alignItems: 'flex-start' },
  etiqueta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  campo: { minHeight: 48, borderWidth: 1.5, borderRadius: Radio.m, paddingHorizontal: Espacio.m, fontSize: 16, fontFamily: Fuentes.cuerpo },
});
