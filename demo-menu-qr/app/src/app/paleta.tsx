// Guía visual: paleta de tintes naturales, tipografía, íconos y estados.
import { router } from 'expo-router';
import {
  BellRing, ChevronLeft, Clock, Coffee, Fish, Flame, Leaf, MapPin, Sailboat, Star, Wheat, Wifi, type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Logo, Paisaje, Tejido } from '@/components/decor';
import { Etiquetas, EstadoBadge, Pantalla, Tarjeta, Texto, Titulo } from '@/components/ui';
import { Colores, Espacio, Fuentes, Radio, Tinte, type EstadoOrden } from '@/constants/theme';

const MUESTRAS: { nombre: string; hex: string; origen: string; uso: string; contraste: string; claro?: boolean }[] = [
  { nombre: 'Azul añil', hex: Tinte.anil, origen: 'Índigo de los cortes tejidos', uso: 'Principal: encabezados, botones', contraste: '10:1 sobre crema' },
  { nombre: 'Rojo cochinilla', hex: Tinte.cochinilla, origen: 'Tinte de cochinilla', uso: 'Precios, «Recomendado», acentos', contraste: '5.7:1 sobre crema' },
  { nombre: 'Naranja achiote', hex: Tinte.achiote, origen: 'Semilla de achiote', uso: 'Íconos y detalles (no texto)', contraste: 'Texto café encima: 5:1', claro: true },
  { nombre: 'Verde aguacate', hex: Tinte.aguacate, origen: 'Montañas y hoja de aguacate', uso: 'Vegetariano (texto blanco)', contraste: 'Blanco encima: 4.7:1' },
  { nombre: 'Crema algodón', hex: Tinte.algodon, origen: 'Algodón natural sin teñir', uso: 'Fondo', contraste: '—', claro: true },
  { nombre: 'Café oscuro', hex: Tinte.cafe, origen: 'Madera y tierra', uso: 'Texto', contraste: '13:1 sobre crema' },
  { nombre: 'Azul noche del lago', hex: Tinte.nocheLago, origen: 'El lago de noche', uso: 'Fondo del modo oscuro', contraste: 'Texto crema: 15:1' },
];

const ICONOS: [LucideIcon, string][] = [
  [Leaf, 'Vegetariano'], [Flame, 'Picante'], [Star, 'Recomendado'], [BellRing, 'Llamar al mesero'],
  [Fish, 'Del lago'], [Coffee, 'Café de San Juan'], [Wheat, 'Maíz / tamales'], [Sailboat, 'Lancha'],
  [Clock, 'Horario'], [MapPin, 'Ubicación'], [Wifi, 'Wi-Fi'],
];

const ESTADOS: EstadoOrden[] = ['recibido', 'confirmado', 'en_preparacion', 'listo', 'entregado', 'cancelado'];

export default function GuiaVisual() {
  return (
    <Pantalla>
      <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={10}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingTop: Espacio.l, minHeight: 44 }}>
        <ChevronLeft size={20} color={Colores.enlace} />
        <Text style={{ fontSize: 16, color: Colores.enlace, fontFamily: Fuentes.fuerte }}>Inicio</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Espacio.m }}>
        <Logo tam={52} />
        <Titulo>Guía visual</Titulo>
      </View>
      <Texto secundario>
        Inspirada en la cultura tz&apos;utujil de San Juan La Laguna: textiles tejidos a mano con tintes naturales, murales del pueblo, el lago y los volcanes San Pedro, Tolimán y Atitlán.
      </Texto>

      <View style={{ borderRadius: Radio.l, overflow: 'hidden' }}><Paisaje alto={170} /></View>

      <Titulo nivel={2}>Paleta</Titulo>
      <View style={s.grilla}>
        {MUESTRAS.map((m) => (
          <View key={m.hex} style={s.celda}>
            <View style={[s.muestra, { backgroundColor: m.hex }]}>
              <Text style={{ color: m.claro ? Tinte.cafe : Tinte.blanco, fontFamily: Fuentes.fuerte, fontSize: 13 }}>{m.hex}</Text>
            </View>
            <Text style={{ fontFamily: Fuentes.fuerte, color: Colores.texto, fontSize: 15 }}>{m.nombre}</Text>
            <Texto secundario style={{ fontSize: 13, lineHeight: 18 }}>{m.origen}</Texto>
            <Text style={{ fontSize: 13, color: Colores.texto, fontFamily: Fuentes.cuerpo }}>{m.uso}</Text>
            <Text style={{ fontSize: 12, color: Colores.textoSecundario, fontFamily: Fuentes.medio }}>Contraste: {m.contraste}</Text>
          </View>
        ))}
      </View>

      <Tejido alto={12} />
      <Titulo nivel={2}>Tipografía</Titulo>
      <Tarjeta>
        <Text style={{ fontFamily: Fuentes.tituloFuerte, fontSize: 30, color: Colores.texto }}>Fraunces</Text>
        <Texto secundario>Títulos: serif con carácter artesanal.</Texto>
        <Text style={{ fontFamily: Fuentes.fuerte, fontSize: 22, color: Colores.texto, marginTop: Espacio.s }}>Inter</Text>
        <Texto secundario>Cuerpo y precios, mínimo 16 px: Pepián de pollo · Q 95.00</Texto>
      </Tarjeta>

      <Titulo nivel={2}>Íconos (lucide)</Titulo>
      <Tarjeta style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Espacio.m }}>
        {ICONOS.map(([Icono, nombre]) => (
          <View key={nombre} style={s.iconoCelda}>
            <Icono size={26} color={Tinte.anil} strokeWidth={1.75} />
            <Text style={{ fontSize: 12, color: Colores.textoSecundario, fontFamily: Fuentes.cuerpo, textAlign: 'center' }}>{nombre}</Text>
          </View>
        ))}
      </Tarjeta>

      <Titulo nivel={2}>Etiquetas y estados</Titulo>
      <Tarjeta>
        <Etiquetas recomendado vegetariano picante />
        <Texto secundario style={{ fontSize: 14 }}>Cada etiqueta y estado combina ícono, texto y color.</Texto>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Espacio.s }}>
          {ESTADOS.map((e) => <EstadoBadge key={e} estado={e} />)}
        </View>
      </Tarjeta>
    </Pantalla>
  );
}

const s = StyleSheet.create({
  grilla: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -Espacio.xs },
  celda: { width: '50%', padding: Espacio.xs, gap: 2, marginBottom: Espacio.m },
  muestra: { height: 76, borderRadius: Radio.m, justifyContent: 'flex-end', padding: Espacio.s, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  iconoCelda: { width: 76, alignItems: 'center', gap: 4 },
});
