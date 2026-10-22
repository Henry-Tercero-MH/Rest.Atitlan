// Seguimiento: el estado como titular, línea de tiempo vertical y detalle tipo cuenta.
import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheck } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Antetitulo, Contenedor, Linea, TituloCarta, Volver } from '@/components/carta';
import { Aviso, Boton, Cargando, Pie } from '@/components/ui';
import { Espacio, Estados, Fuentes, Tinte, type EstadoOrden } from '@/constants/theme';
import { api, horaGt, quetzales, suscribir, type Orden } from '@/lib/api';
import { usePref } from '@/lib/preferencias';
import type { Clave } from '@/lib/textos';

const PASOS: EstadoOrden[] = ['recibido', 'confirmado', 'en_preparacion', 'listo', 'entregado'];

export default function Seguimiento() {
  const { token, id, nueva, ajuste } = useLocalSearchParams<{ token: string; id: string; nueva?: string; ajuste?: string }>();
  const { c, t, idioma } = usePref();
  const [orden, setOrden] = useState<Orden | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    api<{ orden: Orden }>(`/ordenes/${id}`).then((r) => setOrden(r.orden)).catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    const fin = suscribir(`/ordenes/${id}/eventos`, (tipo, datos) => {
      if (tipo === 'orden_actualizada') setOrden(datos as Orden);
      else cargar();
    }, { respaldoMs: 10000 });
    return fin;
  }, [id, cargar]);

  if (!orden) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.fondo }}>
        <Contenedor style={{ paddingTop: Espacio.xl }}>{error ? <Aviso tipo="error">{error}</Aviso> : <Cargando />}</Contenedor>
      </SafeAreaView>
    );
  }

  const indice = PASOS.indexOf(orden.estado);
  const estado = Estados[orden.estado];
  const etiqueta = (e: EstadoOrden) => (idioma === 'en' ? Estados[e].etiquetaEn : Estados[e].etiqueta);
  const rechazadas = orden.lineas.filter((l) => l.estado !== 'activa');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.fondo }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Contenedor style={{ paddingTop: Espacio.s }}>
          <Volver texto={t('menu')} a={`/m/${token}`} />

          {nueva ? (
            <View style={s.confirmado}>
              <CircleCheck size={16} color={Tinte.aguacateOscuro} strokeWidth={2} />
              <Text style={{ fontFamily: Fuentes.medio, fontSize: 14, color: c.textoSecundario }}>{t('confirmadoPor')}</Text>
            </View>
          ) : null}

          <View style={{ marginTop: Espacio.l, gap: 6 }}>
            <Antetitulo>{`${t('pedido')} ${orden.numero_visible}`}</Antetitulo>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <estado.Icono size={28} color={orden.estado === 'cancelado' ? Tinte.cochinilla : c.texto} strokeWidth={1.75} />
              <TituloCarta>{etiqueta(orden.estado)}</TituloCarta>
            </View>
            <Text style={[s.intro, { color: c.textoSecundario }]}>{t(`desc_${orden.estado}` as Clave)}</Text>
            <Text style={[s.meta, { color: c.texto }]}>
              {orden.mesa ? t('mesa', { numero: orden.mesa }) : t('mesaPorAsignar')}  ·  {horaGt(orden.creada_en)}
            </Text>
          </View>

          {ajuste ? <View style={{ marginTop: Espacio.l }}><Aviso tipo="info">{t('totalConfirmado', { total: quetzales(orden.total_centavos) })}</Aviso></View> : null}
          {rechazadas.length ? (
            <View style={{ marginTop: Espacio.l }}><Aviso tipo="alerta">{t('noPreparado', { lista: rechazadas.map((l) => l.nombre).join(', ') })}</Aviso></View>
          ) : null}

          {orden.estado !== 'cancelado' ? (
            <View style={{ marginTop: Espacio.xl }}>
              {PASOS.map((p, i) => {
                const hecho = i <= indice;
                const actual = i === indice;
                return (
                  <View key={p} style={s.paso}>
                    <View style={s.carril}>
                      <View style={[s.punto, {
                        borderColor: hecho ? c.precio : c.borde,
                        backgroundColor: actual ? c.precio : hecho ? c.fondo : c.fondo,
                      }]}>
                        {hecho && !actual ? <View style={[s.puntoLleno, { backgroundColor: c.precio }]} /> : null}
                      </View>
                      {i < PASOS.length - 1 ? <View style={[s.tramo, { backgroundColor: i < indice ? c.precio : c.borde }]} /> : null}
                    </View>
                    <Text style={{
                      fontFamily: actual ? Fuentes.fuerte : Fuentes.cuerpo, fontSize: 16, paddingTop: 1,
                      color: hecho ? c.texto : c.textoSecundario,
                    }}>
                      {etiqueta(p)}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}

          <View style={{ marginTop: Espacio.xl }}>
            <Antetitulo color={c.textoSecundario}>{t('detalle')}</Antetitulo>
            <Linea fuerte style={{ marginTop: Espacio.m }} />
            {orden.lineas.map((l, i) => {
              const fuera = l.estado !== 'activa';
              return (
                <View key={l.id} style={[s.linea, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.borde }]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[s.nombre, { color: c.texto }, fuera && s.tachado]}>{l.cantidad} × {l.nombre}</Text>
                    {l.modificadores.length ? (
                      <Text style={[s.secundario, { color: c.textoSecundario }]}>{l.modificadores.map((m) => m.nombre).join(' · ')}</Text>
                    ) : null}
                  </View>
                  <Text style={[s.monto, { color: c.texto }, fuera && s.tachado]}>{quetzales(l.precio_unitario_centavos * l.cantidad)}</Text>
                </View>
              );
            })}
            <Linea fuerte />
            <View style={s.total}>
              <Text style={{ fontFamily: Fuentes.titulo, fontSize: 22, color: c.texto }}>{t('total')}</Text>
              <Text style={{ fontFamily: Fuentes.fuerte, fontSize: 24, color: c.precio, fontVariant: ['tabular-nums'] }}>{quetzales(orden.total_centavos)}</Text>
            </View>
          </View>
        </Contenedor>
      </ScrollView>

      <Pie>
        <Boton titulo={t('volverMenu')} variante="secundario" style={{ borderRadius: 10 }} onPress={() => router.replace(`/m/${token}`)} />
      </Pie>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  confirmado: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Espacio.s },
  intro: { fontFamily: Fuentes.cuerpo, fontSize: 16, lineHeight: 23 },
  meta: { fontFamily: Fuentes.medio, fontSize: 15, marginTop: 4 },
  paso: { flexDirection: 'row', gap: Espacio.m, minHeight: 44 },
  carril: { width: 18, alignItems: 'center' },
  punto: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  puntoLleno: { width: 8, height: 8, borderRadius: 4 },
  tramo: { width: 2, flex: 1, marginVertical: 2 },
  linea: { flexDirection: 'row', gap: Espacio.m, paddingVertical: 14, alignItems: 'flex-start' },
  nombre: { fontFamily: Fuentes.titulo, fontSize: 17, lineHeight: 22 },
  monto: { fontFamily: Fuentes.fuerte, fontSize: 15, fontVariant: ['tabular-nums'] },
  secundario: { fontFamily: Fuentes.cuerpo, fontSize: 14, lineHeight: 20 },
  total: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: Espacio.l },
  tachado: { textDecorationLine: 'line-through', opacity: 0.55 },
});
