// Detalle del platillo: foto a sangre, título editorial y opciones como lista (sin cajas).
import { router, useLocalSearchParams } from 'expo-router';
import { Check, Minus, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Aviso, Boton, Campo, Cargando, Etiquetas, FotoPlatillo, Pie } from '@/components/ui';
import { AnchoMax, Espacio, Fuentes, Tinte } from '@/constants/theme';
import { quetzales, type Grupo, type Opcion } from '@/lib/api';
import { useCarrito } from '@/lib/carrito';
import { buscarProducto, useMenu } from '@/lib/menu';
import { usePref } from '@/lib/preferencias';

export default function Platillo() {
  const { token, id } = useLocalSearchParams<{ token: string; id: string }>();
  const { secciones } = useMenu();
  const carrito = useCarrito();
  const { c, t, tr } = usePref();
  const producto = buscarProducto(secciones, Number(id));
  const seccion = secciones?.find((s) => s.id === producto?.seccion_id);
  const [cantidad, setCantidad] = useState(1);
  const [elegidas, setElegidas] = useState<Record<number, Opcion[]>>({});
  const [nota, setNota] = useState('');

  const volver = () => (router.canGoBack() ? router.back() : router.replace(`/m/${token}`));

  if (!secciones) return <SafeAreaView style={{ flex: 1, backgroundColor: c.fondo }}><Cargando texto={t('cargandoMenu')} /></SafeAreaView>;
  if (!producto) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.fondo }}>
        <View style={[s.contenedor, { gap: Espacio.l, paddingTop: Espacio.xl }]}>
          <Aviso tipo="error">{t('noDisponible')}</Aviso>
          <Boton titulo={t('volverMenu')} variante="secundario" onPress={volver} />
        </View>
      </SafeAreaView>
    );
  }

  const alternar = (g: Grupo, o: Opcion) =>
    setElegidas((prev) => {
      const actuales = prev[g.id] || [];
      if (actuales.some((x) => x.id === o.id)) return { ...prev, [g.id]: actuales.filter((x) => x.id !== o.id) };
      if (g.max_sel === 1) return { ...prev, [g.id]: [o] };
      if (actuales.length >= g.max_sel) return prev;
      return { ...prev, [g.id]: [...actuales, o] };
    });

  const opciones = Object.values(elegidas).flat();
  const faltantes = producto.grupos.filter((g) => (elegidas[g.id]?.length || 0) < g.min_sel);
  const unitario = producto.precio_centavos + opciones.reduce((s, o) => s + o.precio_extra_centavos, 0);

  const agregar = () => {
    carrito.agregar(producto, opciones, cantidad, nota.trim());
    volver();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.fondo }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View>
          <FotoPlatillo path={producto.imagen_path} nombre={producto.nombre} seccion={seccion?.nombre} ancho="100%" alto={300} radio={0} />
          <SafeAreaView edges={['top']} style={s.cerrarZona}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('cerrar')} onPress={volver} style={s.cerrar}>
              <X size={20} color={Tinte.cafe} strokeWidth={2} />
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={[s.contenedor, { paddingTop: Espacio.xl, gap: 10 }]}>
          {seccion ? <Text style={[s.eyebrow, { color: c.precio }]}>{tr(seccion.nombre, seccion.nombre_en).toUpperCase()}</Text> : null}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: Espacio.m }}>
            <Text accessibilityRole="header" style={[s.titulo, { color: c.texto }]}>{tr(producto.nombre, producto.nombre_en)}</Text>
            <Text style={[s.precio, { color: c.precio }]}>{quetzales(producto.precio_centavos)}</Text>
          </View>
          <Text style={[s.descripcion, { color: c.textoSecundario }]}>{tr(producto.descripcion, producto.descripcion_en)}</Text>
          <Etiquetas vegetariano={producto.vegetariano} picante={producto.picante} recomendado={producto.recomendado} />
        </View>

        {producto.grupos.map((g) => (
          <View key={g.id} style={[s.contenedor, { paddingTop: 36 }]}>
            <View style={s.grupoCabecera}>
              <Text style={[s.grupoTitulo, { color: c.texto }]}>{tr(g.nombre, g.nombre_en)}</Text>
              <Text style={{ color: g.min_sel ? c.precio : c.textoSecundario, fontFamily: Fuentes.medio, fontSize: 13, letterSpacing: 0.3 }}>
                {g.min_sel ? t('obligatorio') : t('opcionalHasta', { n: g.max_sel })}
              </Text>
            </View>
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.texto, opacity: 0.5, marginTop: 10 }} />
            {g.opciones.map((o, i) => {
              const activa = (elegidas[g.id] || []).some((x) => x.id === o.id);
              const radio = g.max_sel === 1;
              return (
                <Pressable
                  key={o.id}
                  accessibilityRole={radio ? 'radio' : 'checkbox'}
                  accessibilityState={{ checked: activa }}
                  onPress={() => alternar(g, o)}
                  style={({ pressed }) => [
                    s.opcion,
                    { borderBottomColor: c.borde, borderBottomWidth: i === g.opciones.length - 1 ? 0 : StyleSheet.hairlineWidth },
                    pressed && { backgroundColor: c.superficieAlt },
                  ]}>
                  <Text style={{ flex: 1, fontSize: 16, color: c.texto, fontFamily: activa ? Fuentes.medio : Fuentes.cuerpo }}>{tr(o.nombre, o.nombre_en)}</Text>
                  {o.precio_extra_centavos ? (
                    <Text style={{ fontFamily: Fuentes.medio, color: c.textoSecundario, fontVariant: ['tabular-nums'] }}>+{quetzales(o.precio_extra_centavos)}</Text>
                  ) : null}
                  <View style={[
                    s.marca, radio && { borderRadius: 11 },
                    { borderColor: activa ? c.primario : c.textoSecundario, backgroundColor: activa ? c.primario : 'transparent' },
                  ]}>
                    {activa ? <Check size={14} color={c.sobrePrimario} strokeWidth={3} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}

        <View style={[s.contenedor, { paddingTop: 36, gap: 10 }]}>
          <Text style={[s.grupoTitulo, { color: c.texto }]}>{t('notasCocina')}</Text>
          <Campo value={nota} onChangeText={setNota} placeholder={t('notaEjemplo')} maxLength={140} multiline
            style={{ minHeight: 76, paddingTop: 12, borderWidth: StyleSheet.hairlineWidth * 2, borderRadius: 8 }} />
        </View>
      </ScrollView>

      <Pie>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Espacio.m }}>
          <View style={[s.cantidad, { borderColor: c.borde }]}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('quitarUno')} onPress={() => setCantidad((n) => Math.max(1, n - 1))} style={s.paso}>
              <Minus size={18} color={c.texto} strokeWidth={2} />
            </Pressable>
            <Text style={{ fontSize: 17, fontFamily: Fuentes.fuerte, minWidth: 22, textAlign: 'center', color: c.texto }}
              accessibilityLabel={`${t('cantidad')} ${cantidad}`}>{cantidad}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('agregarUno')} onPress={() => setCantidad((n) => Math.min(50, n + 1))} style={s.paso}>
              <Plus size={18} color={c.texto} strokeWidth={2} />
            </Pressable>
          </View>
          <Boton
            grande
            style={{ flex: 1, borderRadius: 10 }}
            titulo={faltantes.length ? t('elige', { grupo: tr(faltantes[0].nombre, faltantes[0].nombre_en) }) : `${t('agregar')} · ${quetzales(unitario * cantidad)}`}
            deshabilitado={faltantes.length > 0}
            onPress={agregar}
          />
        </View>
      </Pie>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  contenedor: { width: '100%', maxWidth: AnchoMax, alignSelf: 'center', paddingHorizontal: Espacio.l },
  cerrarZona: { position: 'absolute', top: 0, right: 0, left: 0, alignItems: 'flex-end', padding: Espacio.l },
  cerrar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(247,241,229,0.92)', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: Fuentes.fuerte, fontSize: 12, letterSpacing: 2 },
  titulo: { flex: 1, fontFamily: Fuentes.tituloFuerte, fontSize: 30, lineHeight: 35, letterSpacing: -0.4 },
  precio: { fontFamily: Fuentes.fuerte, fontSize: 19, fontVariant: ['tabular-nums'] },
  descripcion: { fontFamily: Fuentes.cuerpo, fontSize: 16, lineHeight: 24 },
  grupoCabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  grupoTitulo: { fontFamily: Fuentes.titulo, fontSize: 20, lineHeight: 25 },
  opcion: { flexDirection: 'row', alignItems: 'center', gap: Espacio.m, minHeight: 54 },
  marca: { width: 22, height: 22, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cantidad: { flexDirection: 'row', alignItems: 'center', height: 56, borderWidth: 1, borderRadius: 10 },
  paso: { width: 44, height: 54, alignItems: 'center', justifyContent: 'center' },
});
