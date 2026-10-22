// Mi visita: órdenes de la mesa como lista tipo cuenta, consumo acumulado y acciones.
import { router, useLocalSearchParams } from 'expo-router';
import { BellRing, ChevronRight, ReceiptText } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Antetitulo, Contenedor, Linea, TituloCarta, Volver } from '@/components/carta';
import { Aviso, Boton, Cargando } from '@/components/ui';
import { Espacio, Estados, Fuentes } from '@/constants/theme';
import { api, horaGt, quetzales, type Orden } from '@/lib/api';
import { usePref } from '@/lib/preferencias';

type Visita = { ordenes: Orden[]; total_centavos: number };

export default function MiVisita() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { c, t, idioma } = usePref();
  const [datos, setDatos] = useState<Visita | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    let vivo = true;
    api<Visita>(`/mesas/qr/${token}/ordenes`)
      .catch(() => ({ ordenes: [], total_centavos: 0 }))
      .then((r) => vivo && setDatos(r));
    return () => {
      vivo = false;
    };
  }, [token]);

  const pedir = async (tipo: 'mesero' | 'cuenta') => {
    try {
      await api('/asistencia', { method: 'POST', body: { qr_token: token, tipo } });
      setAviso({ tipo: 'exito', texto: tipo === 'mesero' ? t('meseroEnCamino') : t('cuentaPedida') });
    } catch (e) {
      setAviso({ tipo: 'error', texto: (e as Error).message });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.fondo }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: Espacio.xxl }}>
        <Contenedor style={{ paddingTop: Espacio.s }}>
          <Volver texto={t('menu')} a={`/m/${token}`} />
          <View style={{ marginTop: Espacio.l, gap: 6 }}>
            <Antetitulo>{t('misOrdenes')}</Antetitulo>
            <TituloCarta>{t('miVisita')}</TituloCarta>
          </View>

          <View style={{ flexDirection: 'row', gap: Espacio.s, marginTop: Espacio.xl }}>
            <Boton titulo={t('llamarMesero')} Icono={BellRing} variante="secundario" style={{ flex: 1, borderRadius: 10 }} onPress={() => pedir('mesero')} />
            <Boton titulo={t('pedirCuenta')} Icono={ReceiptText} variante="secundario" style={{ flex: 1, borderRadius: 10 }} onPress={() => pedir('cuenta')} />
          </View>
          {aviso ? <View style={{ marginTop: Espacio.m }}><Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso></View> : null}

          {!datos ? <Cargando /> : datos.ordenes.length === 0 ? (
            <Text style={[s.secundario, { color: c.textoSecundario, marginTop: Espacio.xl }]}>{t('sinOrdenes')}</Text>
          ) : (
            <View style={{ marginTop: Espacio.xl }}>
              <Linea fuerte />
              {datos.ordenes.map((o, i) => {
                const e = Estados[o.estado];
                return (
                  <Pressable key={o.id} accessibilityRole="link" accessibilityLabel={`${o.numero_visible}, ${t('verDetalle')}`}
                    onPress={() => router.push({ pathname: '/m/[token]/orden/[id]', params: { token, id: o.id } })}
                    style={({ pressed }) => [s.fila, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.borde }, pressed && { backgroundColor: c.superficieAlt }]}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: Espacio.s }}>
                        <Text style={{ fontFamily: Fuentes.tituloFuerte, fontSize: 20, color: c.texto }}>{o.numero_visible}</Text>
                        <Text style={[s.secundario, { color: c.textoSecundario }]}>{horaGt(o.creada_en)}</Text>
                      </View>
                      <Text style={[s.secundario, { color: c.textoSecundario }]} numberOfLines={2}>
                        {o.lineas.map((l) => `${l.cantidad} × ${l.nombre}`).join(' · ')}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <e.Icono size={14} color={c.texto} strokeWidth={1.75} />
                        <Text style={{ fontFamily: Fuentes.medio, fontSize: 14, color: c.texto }}>{idioma === 'en' ? e.etiquetaEn : e.etiqueta}</Text>
                      </View>
                    </View>
                    <Text style={{ fontFamily: Fuentes.fuerte, fontSize: 16, color: c.texto, fontVariant: ['tabular-nums'] }}>{quetzales(o.total_centavos)}</Text>
                    <ChevronRight size={18} color={c.textoSecundario} strokeWidth={1.75} />
                  </Pressable>
                );
              })}
              <Linea fuerte />
              <View style={s.total}>
                <Text style={{ fontFamily: Fuentes.titulo, fontSize: 22, color: c.texto }}>{t('consumoAcumulado')}</Text>
                <Text style={{ fontFamily: Fuentes.fuerte, fontSize: 24, color: c.precio, fontVariant: ['tabular-nums'] }}>{quetzales(datos.total_centavos)}</Text>
              </View>
              <Text style={[s.secundario, { color: c.textoSecundario }]}>{t('cobroCaja')}</Text>
            </View>
          )}
        </Contenedor>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: Espacio.m, paddingVertical: 16 },
  secundario: { fontFamily: Fuentes.cuerpo, fontSize: 14, lineHeight: 20 },
  total: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: Espacio.l, paddingBottom: Espacio.s },
});
