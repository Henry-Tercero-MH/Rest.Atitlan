// Portada del DEMO: accesos a cada módulo. En producción el cliente entra directo por /m/<token> desde el QR.
import { router, type Href } from 'expo-router';
import { ChefHat, ChevronRight, LayoutGrid, Palette, QrCode, RotateCcw, Users, type LucideIcon } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { FotoBanner, Logo, Tejido } from '@/components/decor';
import { Aviso, Boton, Pantalla, Texto, Titulo } from '@/components/ui';
import { Colores, Espacio, Fuentes, Radio, Tinte } from '@/constants/theme';
import { reiniciarDemo } from '@/demo/servidor-local';
import { MODO_DEMO } from '@/lib/api';

const MESA_DEMO = 'demo-m4-t5n1';

function Acceso({ href, titulo, detalle, color, Icono }: { href: Href; titulo: string; detalle: string; color: string; Icono: LucideIcon }) {
  return (
    <Pressable accessibilityRole="link" onPress={() => router.push(href)}
      style={({ pressed }) => [s.acceso, pressed && { backgroundColor: Colores.superficieAlt }]}>
        <View style={[s.icono, { backgroundColor: color }]}><Icono size={22} color={Tinte.blanco} strokeWidth={2} /></View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={s.accesoTitulo}>{titulo}</Text>
          <Texto secundario style={{ fontSize: 14, lineHeight: 20 }}>{detalle}</Texto>
        </View>
        <ChevronRight size={22} color={Tinte.piedra} />
    </Pressable>
  );
}

export default function Portada() {
  const origen = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : 'https://menu.example';
  return (
    <Pantalla>
      <View style={s.hero}>
        <FotoBanner alto={230} />
        <View style={s.heroTexto}>
          <Logo tam={52} />
          <Text style={s.heroMarca}>Atitlán Rest. & Café</Text>
          <Text style={s.heroSub}>Menú digital con pedidos por QR · Demo</Text>
        </View>
      </View>

      <Aviso tipo="alerta">Demo con platillos y precios de ejemplo. No es el catálogo real ni la versión aprobada (Fase B pendiente).</Aviso>
      {MODO_DEMO ? (
        <>
          <Aviso tipo="info">
            Modo demo sin servidor: los pedidos se guardan en este navegador. Abre la cocina en otra pestaña para verlos llegar en tiempo real.
          </Aviso>
          <Boton titulo="Reiniciar demo (borrar pedidos)" variante="secundario" Icono={RotateCcw} onPress={reiniciarDemo} />
        </>
      ) : null}

      <Titulo nivel={2}>Cliente (celular)</Titulo>
      <Acceso href={`/m/${MESA_DEMO}`} Icono={QrCode} titulo="Escanear QR de la Mesa M4" detalle="Menú, platillo, carrito, envío y seguimiento" color={Tinte.anil} />
      <Acceso href="/m/general" Icono={Users} titulo="QR general (sin mesa)" detalle="Pedido con asignación de mesa pendiente" color={Tinte.cochinilla} />

      <Tejido alto={10} opacidad={0.8} />
      <Titulo nivel={2}>Personal</Titulo>
      <Acceso href="/cocina" Icono={ChefHat} titulo="Pantalla de cocina" detalle="Órdenes en tiempo real, estados y agotados" color={Tinte.nocheLago} />
      <Acceso href="/personal" Icono={LayoutGrid} titulo="Mesas y catálogo" detalle="Abrir y cerrar mesa, consumo, disponibilidad y QR" color={Tinte.aguacateOscuro} />

      <Tejido alto={10} opacidad={0.8} />
      <Titulo nivel={2}>Identidad</Titulo>
      <Acceso href="/paleta" Icono={Palette} titulo="Paleta, tipografía e íconos" detalle="Tintes naturales de los textiles tz'utujil" color="#9A5512" />

      <View style={s.qrCaja}>
        <QRCode value={`${origen}/m/${MESA_DEMO}`} size={132} color={Tinte.anil} backgroundColor={Tinte.blanco} />
        <View style={{ flex: 1, gap: Espacio.xs }}>
          <Text style={s.accesoTitulo}>Prueba desde tu celular</Text>
          <Texto secundario style={{ fontSize: 14, lineHeight: 20 }}>Escanea este QR (Mesa M4). El celular debe alcanzar esta dirección y la del API.</Texto>
        </View>
      </View>
    </Pantalla>
  );
}

const s = StyleSheet.create({
  hero: { height: 230, borderRadius: Radio.l, overflow: 'hidden', marginTop: Espacio.l },
  heroTexto: { position: 'absolute', left: Espacio.l, right: Espacio.l, bottom: Espacio.l, gap: 4 },
  heroMarca: { color: Tinte.algodon, fontSize: 30, fontFamily: Fuentes.tituloFuerte },
  heroSub: { color: Tinte.algodon, fontSize: 15, fontFamily: Fuentes.medio },
  acceso: {
    flexDirection: 'row', alignItems: 'center', gap: Espacio.m, backgroundColor: Colores.superficie, borderRadius: Radio.l,
    borderWidth: 1, borderColor: Colores.borde, padding: Espacio.l, minHeight: 72,
  },
  icono: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  accesoTitulo: { fontSize: 17, fontFamily: Fuentes.titulo, color: Colores.texto },
  qrCaja: {
    flexDirection: 'row', gap: Espacio.l, alignItems: 'center', backgroundColor: Colores.superficie, padding: Espacio.l,
    borderRadius: Radio.l, borderWidth: 1, borderColor: Colores.borde,
  },
});
