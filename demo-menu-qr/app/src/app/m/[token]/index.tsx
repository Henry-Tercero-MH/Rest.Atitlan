// Menú del cliente, con lenguaje de carta impresa: banner a sangre, pestañas tipográficas,
// secciones numeradas, filas con líneas finas y precio alineado a la derecha.
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowUpRight, BellRing, Moon, ReceiptText, Sun } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking, Pressable, ScrollView, StyleSheet, Text, View,
  type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FotoBanner, Tejido } from '@/components/decor';
import { Aviso, Boton, Cargando, Etiquetas, FotoPlatillo, Titulo } from '@/components/ui';
import { Negocio } from '@/constants/negocio';
import { AnchoMax, Espacio, Fuentes, Tinte } from '@/constants/theme';
import { api, quetzales, type Producto, type Seccion } from '@/lib/api';
import { useCarrito } from '@/lib/carrito';
import { useMenu } from '@/lib/menu';
import { usePref } from '@/lib/preferencias';
import { introSecciones } from '@/lib/textos';

type InfoMesa = { general: boolean; mesa: { numero: string; area: string } | null };

export default function Menu() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { secciones, error, recargar } = useMenu();
  const carrito = useCarrito();
  const { c, t, tr, idioma, setIdioma, modo, alternarModo } = usePref();
  const [mesa, setMesa] = useState<InfoMesa | null>(null);
  const [errorMesa, setErrorMesa] = useState<string | null>(null);
  const [activa, setActiva] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const scroll = useRef<ScrollViewInstance>(null);
  const pestanas = useRef<ScrollViewInstance>(null);
  const posSeccion = useRef<Record<number, number>>({});
  const posPestana = useRef<Record<number, number>>({});
  const altoBarra = useRef(52);

  useEffect(() => {
    api<InfoMesa>(`/mesas/qr/${token}`).then(setMesa).catch((e) => setErrorMesa(e.message));
  }, [token]);

  const locales = useMemo(() => secciones?.flatMap((s) => s.productos.filter((p) => p.sabor_local)) ?? [], [secciones]);
  const nombreSeccion = useMemo(() => new Map(secciones?.map((s) => [s.id, s.nombre]) ?? []), [secciones]);
  const seccionActiva = activa ?? secciones?.[0]?.id ?? null;

  const irA = (id: number) => {
    setActiva(id);
    scroll.current?.scrollTo({ y: Math.max(0, (posSeccion.current[id] ?? 0) - altoBarra.current + 1), animated: true });
  };

  const alDesplazar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!secciones) return;
    const y = e.nativeEvent.contentOffset.y + altoBarra.current + 32;
    let actual = secciones[0]?.id ?? null;
    for (const s of secciones) if ((posSeccion.current[s.id] ?? Infinity) <= y) actual = s.id;
    if (actual !== null && actual !== activa) {
      setActiva(actual);
      pestanas.current?.scrollTo({ x: Math.max(0, (posPestana.current[actual] ?? 0) - Espacio.l), animated: true });
    }
  };

  const llamarMesero = async () => {
    try {
      await api('/asistencia', { method: 'POST', body: { qr_token: token, tipo: mesa?.general ? 'asignar_mesa' : 'mesero' } });
      setToast(t('meseroEnCamino'));
    } catch (e) {
      setToast((e as Error).message);
    }
    setTimeout(() => setToast(null), 3500);
  };

  if (errorMesa) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.fondo }}>
        <View style={[s.contenedor, { gap: Espacio.l, paddingTop: Espacio.xxl }]}>
          <Titulo>{t('qrInvalido')}</Titulo>
          <Aviso tipo="error">{errorMesa}</Aviso>
          <Boton titulo={t('usarGeneral')} variante="secundario" onPress={() => router.replace('/m/general')} />
        </View>
      </SafeAreaView>
    );
  }

  const hayCarrito = carrito.cantidadTotal > 0;
  const textoMesa = mesa === null ? t('identificando') : mesa.general ? t('sinMesa') : `${t('mesa', { numero: mesa.mesa!.numero })} — ${mesa.mesa!.area}`;
  const fabFondo = modo === 'claro' ? Tinte.cafe : Tinte.algodon;
  const fabTexto = modo === 'claro' ? Tinte.algodon : Tinte.cafe;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.fondo }} edges={['top', 'bottom']}>
      <ScrollView
        ref={scroll}
        stickyHeaderIndices={[1]}
        onScroll={alDesplazar}
        scrollEventThrottle={32}
        contentContainerStyle={{ paddingBottom: hayCarrito ? 168 : 96 }}>
        {/* 0 · Cabecera: marca + banner a sangre + firma textil */}
        <View>
          <View style={[s.contenedor, s.barraMarca]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.marca, { color: c.texto }]}>Atitlán</Text>
              <Text style={[s.marcaSub, { color: c.textoSecundario }]}>REST. & CAFÉ</Text>
            </View>
            <View style={s.idiomas} accessibilityRole="radiogroup">
              {(['es', 'en'] as const).map((i, n) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {n > 0 ? <Text style={{ color: c.borde, fontSize: 14 }}>/</Text> : null}
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: idioma === i }}
                    accessibilityLabel={i === 'es' ? 'Español' : 'English'}
                    onPress={() => setIdioma(i)}
                    style={s.idioma}>
                    <Text style={{
                      fontFamily: idioma === i ? Fuentes.fuerte : Fuentes.cuerpo, fontSize: 14, letterSpacing: 1,
                      color: idioma === i ? c.texto : c.textoSecundario,
                    }}>{i.toUpperCase()}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={modo === 'claro' ? t('modoOscuro') : t('modoClaro')}
              onPress={alternarModo} style={s.iconoBarra} hitSlop={4}>
              {modo === 'claro' ? <Moon size={19} color={c.texto} strokeWidth={1.75} /> : <Sun size={19} color={c.texto} strokeWidth={1.75} />}
            </Pressable>
          </View>

          <View style={s.hero}>
            <FotoBanner alto={320} />
            <View style={s.heroTexto}>
              <View style={{ width: '100%', maxWidth: AnchoMax, alignSelf: 'center', paddingHorizontal: Espacio.l, gap: 8 }}>
                <Text style={s.eyebrowClaro}>{t('eyebrowLugar').toUpperCase()}</Text>
                <Text style={s.bienvenida}>{t('bienvenida')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <View style={{ width: 24, height: 1, backgroundColor: Tinte.achiote }} />
                  <Text style={s.mesaTexto}>{textoMesa}</Text>
                </View>
              </View>
            </View>
          </View>
          <Tejido alto={8} />

          {mesa?.general ? (
            <View style={[s.contenedor, { paddingTop: Espacio.l }]}><Aviso tipo="alerta">{t('avisoGeneral')}</Aviso></View>
          ) : null}
        </View>

        {/* 1 · Pestañas tipográficas fijas */}
        <View
          style={{ backgroundColor: c.barraFondo, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.borde }}
          onLayout={(e) => (altoBarra.current = e.nativeEvent.layout.height)}>
          <ScrollView ref={pestanas} horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist"
            contentContainerStyle={{ paddingHorizontal: Espacio.l, gap: Espacio.xl }}>
            {secciones?.map((sec) => {
              const on = sec.id === seccionActiva;
              return (
                <Pressable key={sec.id} accessibilityRole="tab" accessibilityState={{ selected: on }}
                  onPress={() => irA(sec.id)} onLayout={(e) => (posPestana.current[sec.id] = e.nativeEvent.layout.x)}
                  style={s.pestana}>
                  <Text style={{ fontFamily: on ? Fuentes.fuerte : Fuentes.medio, fontSize: 15, color: on ? c.texto : c.textoSecundario }}>
                    {tr(sec.nombre, sec.nombre_en)}
                  </Text>
                  <View style={[s.subrayado, { backgroundColor: on ? c.precio : 'transparent' }]} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 2 · Destacado: sabores locales */}
        {error && !secciones ? (
          <View style={[s.contenedor, { gap: Espacio.l, paddingTop: Espacio.xl }]}>
            <Aviso tipo="error">{t('errorMenu')} {error}</Aviso>
            <Boton titulo={t('reintentar')} variante="secundario" onPress={recargar} />
          </View>
        ) : !secciones ? (
          <Cargando texto={t('cargandoMenu')} />
        ) : locales.length ? (
          <View style={{ paddingTop: 44 }}>
            <View style={[s.contenedor, { gap: 6 }]}>
              <Text style={[s.eyebrow, { color: c.precio }]}>{t('deLaCasa').toUpperCase()}</Text>
              <Text style={[s.tituloSeccion, { color: c.texto }]}>{t('saboresLocales')}</Text>
              <Text style={[s.intro, { color: c.textoSecundario }]}>{t('saboresLocalesSub')}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast" snapToInterval={176 + Espacio.l}
              contentContainerStyle={{ paddingHorizontal: Espacio.l, gap: Espacio.l, paddingTop: Espacio.l }}>
              {locales.map((p) => <Destacado key={p.id} p={p} token={token} seccion={nombreSeccion.get(p.seccion_id)} />)}
            </ScrollView>
          </View>
        ) : null}

        {/* 3 · Carta */}
        {secciones?.map((sec, i) => (
          <SeccionCarta key={sec.id} sec={sec} numero={i + 1} token={token} onY={(y) => (posSeccion.current[sec.id] = y)} />
        ))}

        <PieLocal />
      </ScrollView>

      {toast ? (
        <View style={[s.toast, { bottom: hayCarrito ? 150 : 84, backgroundColor: fabFondo }]} accessibilityLiveRegion="polite">
          <Text style={{ color: fabTexto, fontFamily: Fuentes.medio, fontSize: 15 }}>{toast}</Text>
        </View>
      ) : null}

      <View style={[s.flotantes, { bottom: hayCarrito ? 92 : 20 }]} pointerEvents="box-none">
        {!mesa?.general ? (
          // Navegación con router.push: en web, <Link asChild> pierde o rompe los estilos del Pressable.
          <Pressable accessibilityRole="link" accessibilityLabel={t('misOrdenes')} onPress={() => router.push(`/m/${token}/visita`)}
            style={({ pressed }) => [s.fabIcono, { backgroundColor: pressed ? c.superficieAlt : c.superficie, borderColor: c.borde }]}>
            <ReceiptText size={19} color={c.texto} strokeWidth={1.75} />
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" accessibilityLabel={t('llamarMesero')} onPress={llamarMesero}
          style={({ pressed }) => [s.fab, { backgroundColor: fabFondo, opacity: pressed ? 0.85 : 1 }]}>
          <BellRing size={17} color={fabTexto} strokeWidth={2} />
          <Text style={[s.fabTexto, { color: fabTexto }]}>{t('mesero')}</Text>
        </Pressable>
      </View>

      {hayCarrito ? (
        <View style={s.barraCarrito}>
          <Pressable accessibilityRole="button" onPress={() => router.push(`/m/${token}/carrito`)}
            style={({ pressed }) => [s.carrito, { backgroundColor: pressed ? c.primarioPresionado : c.primario }]}>
            <View style={[s.contador, { borderColor: c.sobrePrimario }]}>
              <Text style={{ color: c.sobrePrimario, fontFamily: Fuentes.fuerte, fontSize: 13 }}>{carrito.cantidadTotal}</Text>
            </View>
            <Text style={{ flex: 1, color: c.sobrePrimario, fontFamily: Fuentes.fuerte, fontSize: 16 }}>{t('verPedidoCorto')}</Text>
            <Text style={{ color: c.sobrePrimario, fontFamily: Fuentes.fuerte, fontSize: 16, fontVariant: ['tabular-nums'] }}>
              {quetzales(carrito.totalEstimado)}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function SeccionCarta({ sec, numero, token, onY }: { sec: Seccion; numero: number; token: string; onY: (y: number) => void }) {
  const { c, t, tr, idioma } = usePref();
  const intro = introSecciones[sec.nombre]?.[idioma];
  return (
    <View onLayout={(e) => onY(e.nativeEvent.layout.y)} style={[s.contenedor, { paddingTop: 52 }]}>
      <Text style={[s.eyebrow, { color: c.precio }]}>{String(numero).padStart(2, '0')}</Text>
      <Text accessibilityRole="header" style={[s.tituloSeccion, { color: c.texto, marginTop: 4 }]}>{tr(sec.nombre, sec.nombre_en)}</Text>
      {intro ? <Text style={[s.intro, { color: c.textoSecundario, marginTop: 6 }]}>{intro}</Text> : null}
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.texto, opacity: 0.6, marginTop: Espacio.l }} />
      {sec.productos.length === 0 ? <Text style={[s.intro, { color: c.textoSecundario, paddingVertical: Espacio.l }]}>{t('sinPlatillos')}</Text> : null}
      {sec.productos.map((p, i) => (
        <FilaPlatillo key={p.id} p={p} token={token} seccion={sec.nombre} ultima={i === sec.productos.length - 1} />
      ))}
    </View>
  );
}

function FilaPlatillo({ p, token, seccion, ultima }: { p: Producto; token: string; seccion: string; ultima: boolean }) {
  const { c, tr } = usePref();
  const nombre = tr(p.nombre, p.nombre_en);
  return (
    <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${nombre}, ${quetzales(p.precio_centavos)}`}
        onPress={() => router.push(`/m/${token}/platillo/${p.id}`)}
        style={({ pressed }) => [
          s.fila,
          { borderBottomColor: c.borde, borderBottomWidth: ultima ? 0 : StyleSheet.hairlineWidth },
          pressed && { backgroundColor: c.superficieAlt },
        ]}>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={s.nombrePrecio}>
            <Text style={[s.nombre, { color: c.texto }]}>{nombre}</Text>
            <Text style={[s.precio, { color: c.precio }]}>{quetzales(p.precio_centavos)}</Text>
          </View>
          <Text numberOfLines={2} style={[s.descripcion, { color: c.textoSecundario }]}>{tr(p.descripcion, p.descripcion_en)}</Text>
          <Etiquetas vegetariano={p.vegetariano} picante={p.picante} recomendado={p.recomendado} />
        </View>
        <FotoPlatillo path={p.imagen_path} nombre={p.nombre} seccion={seccion} ancho={84} alto={84} />
      </Pressable>
  );
}

function Destacado({ p, token, seccion }: { p: Producto; token: string; seccion?: string }) {
  const { c, tr } = usePref();
  return (
    <Pressable accessibilityRole="link" onPress={() => router.push(`/m/${token}/platillo/${p.id}`)}
        style={({ pressed }) => [{ width: 176, gap: 10, opacity: pressed ? 0.8 : 1 }]}>
        <FotoPlatillo path={p.imagen_path} nombre={p.nombre} seccion={seccion} ancho={176} alto={220} />
        <View style={{ gap: 2 }}>
          <Text style={[s.nombre, { color: c.texto, fontSize: 17, lineHeight: 22 }]} numberOfLines={2}>{tr(p.nombre, p.nombre_en)}</Text>
          <Text style={[s.precio, { color: c.textoSecundario, fontSize: 15 }]}>{quetzales(p.precio_centavos)}</Text>
        </View>
      </Pressable>
  );
}

function DatoPie({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={s.pieEtiqueta}>{etiqueta.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function PieLocal() {
  const { t, idioma, modo } = usePref();
  const abrir = (url: string) => Linking.openURL(url).catch(() => {});
  const fondo = modo === 'claro' ? Tinte.anil : Tinte.nocheLagoMedio;
  return (
    <View style={{ marginTop: 64, backgroundColor: fondo }}>
      <Tejido alto={8} />
      <View style={[s.contenedor, { paddingVertical: 44, gap: 28 }]}>
        <View>
          <Text style={[s.marca, { color: Tinte.algodon, fontSize: 30, lineHeight: 34 }]}>Atitlán</Text>
          <Text style={[s.marcaSub, { color: 'rgba(247,241,229,0.7)' }]}>REST. & CAFÉ</Text>
        </View>

        <DatoPie etiqueta={t('horario')}><Text style={s.pieTexto}>{Negocio.horario[idioma]}</Text></DatoPie>
        <DatoPie etiqueta={t('ubicacion')}>
          <Text style={s.pieTexto}>{Negocio.direccion}</Text>
          <Pressable accessibilityRole="link" onPress={() => abrir(Negocio.mapsUrl)} style={s.pieEnlace}>
            <Text style={s.pieEnlaceTexto}>{t('comoLlegar')}</Text>
            <ArrowUpRight size={16} color={Tinte.algodon} strokeWidth={1.75} />
          </Pressable>
        </DatoPie>
        <DatoPie etiqueta={t('wifi')}>
          <Text style={s.pieTexto}>{t('wifiRed', { red: Negocio.wifi.red })}</Text>
          <Text style={s.pieTexto}>{t('wifiClave', { clave: Negocio.wifi.clave })}</Text>
        </DatoPie>
        <DatoPie etiqueta={t('formasPago')}><Text style={s.pieTexto}>{t('pagos')}</Text></DatoPie>

        <Pressable accessibilityRole="link" onPress={() => abrir(`https://wa.me/${Negocio.whatsapp}`)}
          style={({ pressed }) => [s.pieBoton, pressed && { backgroundColor: 'rgba(247,241,229,0.12)' }]}>
          <FontAwesome name="whatsapp" size={20} color={Tinte.algodon} />
          <Text style={{ color: Tinte.algodon, fontFamily: Fuentes.fuerte, fontSize: 15 }}>{t('escribenos')}</Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Espacio.l, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(247,241,229,0.3)', paddingTop: Espacio.l }}>
          <Text style={[s.pieTexto, { flex: 1, fontSize: 13, opacity: 0.8 }]}>{Negocio.lugar}</Text>
          {([['instagram', Negocio.instagram, 'Instagram'], ['facebook', Negocio.facebook, 'Facebook']] as const).map(([icono, url, nombre]) => (
            <Pressable key={icono} accessibilityRole="link" accessibilityLabel={nombre} onPress={() => abrir(url)} style={s.iconoBarra}>
              <FontAwesome name={icono} size={19} color={Tinte.algodon} />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  contenedor: { width: '100%', maxWidth: AnchoMax, alignSelf: 'center', paddingHorizontal: Espacio.l },
  barraMarca: { flexDirection: 'row', alignItems: 'center', paddingVertical: Espacio.m, gap: Espacio.s },
  marca: { fontFamily: Fuentes.tituloFuerte, fontSize: 24, lineHeight: 26, letterSpacing: -0.3 },
  marcaSub: { fontFamily: Fuentes.medio, fontSize: 10.5, letterSpacing: 2.5, marginTop: 2 },
  idiomas: { flexDirection: 'row', alignItems: 'center' },
  idioma: { minWidth: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  iconoBarra: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  hero: { height: 320, overflow: 'hidden' },
  heroTexto: { position: 'absolute', left: 0, right: 0, bottom: 28 },
  eyebrowClaro: { color: 'rgba(247,241,229,0.85)', fontFamily: Fuentes.medio, fontSize: 11, letterSpacing: 2 },
  bienvenida: { color: Tinte.algodon, fontFamily: Fuentes.tituloFuerte, fontSize: 34, lineHeight: 38, letterSpacing: -0.5, maxWidth: 340 },
  mesaTexto: { color: Tinte.algodon, fontFamily: Fuentes.medio, fontSize: 15 },
  pestana: { minHeight: 52, justifyContent: 'center' },
  subrayado: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 2.5, borderRadius: 2 },
  eyebrow: { fontFamily: Fuentes.fuerte, fontSize: 12, letterSpacing: 2 },
  tituloSeccion: { fontFamily: Fuentes.titulo, fontSize: 30, lineHeight: 35, letterSpacing: -0.4 },
  intro: { fontFamily: Fuentes.cuerpo, fontSize: 15, lineHeight: 22, maxWidth: 520 },
  fila: { flexDirection: 'row', gap: Espacio.l, paddingVertical: 18, alignItems: 'flex-start' },
  nombrePrecio: { flexDirection: 'row', alignItems: 'baseline', gap: Espacio.m },
  nombre: { flex: 1, fontFamily: Fuentes.titulo, fontSize: 19, lineHeight: 24 },
  precio: { fontFamily: Fuentes.fuerte, fontSize: 16, fontVariant: ['tabular-nums'] },
  descripcion: { fontFamily: Fuentes.cuerpo, fontSize: 15, lineHeight: 21 },
  pieEtiqueta: { color: 'rgba(247,241,229,0.65)', fontFamily: Fuentes.fuerte, fontSize: 11, letterSpacing: 2 },
  pieTexto: { color: Tinte.algodon, fontFamily: Fuentes.cuerpo, fontSize: 16, lineHeight: 23 },
  pieEnlace: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, alignSelf: 'flex-start' },
  pieEnlaceTexto: { color: Tinte.algodon, fontFamily: Fuentes.fuerte, fontSize: 15, textDecorationLine: 'underline' },
  pieBoton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Espacio.s, minHeight: 50, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(247,241,229,0.5)',
  },
  flotantes: { position: 'absolute', right: Espacio.l, flexDirection: 'row', alignItems: 'center', gap: Espacio.s },
  fab: {
    flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 18, borderRadius: 24,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  fabTexto: { fontFamily: Fuentes.fuerte, fontSize: 15 },
  fabIcono: {
    width: 48, height: 48, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  barraCarrito: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: Espacio.l, paddingBottom: Espacio.l },
  carrito: {
    width: '100%', maxWidth: AnchoMax - 32, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: Espacio.m,
    height: 58, borderRadius: 10, paddingHorizontal: Espacio.l,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  contador: { minWidth: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  toast: { position: 'absolute', left: Espacio.l, right: Espacio.l, maxWidth: AnchoMax - 32, alignSelf: 'center', borderRadius: 10, padding: Espacio.m },
});
