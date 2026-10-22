// Carrito: lista tipo cuenta (líneas finas), total destacado y envío con idempotencia.
import { router, useLocalSearchParams } from 'expo-router';
import { MapPin, Minus, Plus, RotateCw, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Antetitulo, Contenedor, Linea, TituloCarta, Volver } from '@/components/carta';
import { Aviso, Boton, Pie } from '@/components/ui';
import { Espacio, Fuentes, Tinte } from '@/constants/theme';
import { api, ErrorApi, quetzales, type Orden } from '@/lib/api';
import { precioLinea, useCarrito } from '@/lib/carrito';
import { usePref } from '@/lib/preferencias';

type EstadoEnvio = { tipo: 'listo' } | { tipo: 'enviando' } | { tipo: 'no_confirmada'; mensaje: string } | { tipo: 'rechazada'; mensaje: string };

export default function Carrito() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const carrito = useCarrito();
  const { c, t, tr } = usePref();
  const [envio, setEnvio] = useState<EstadoEnvio>({ tipo: 'listo' });

  const enviar = async () => {
    setEnvio({ tipo: 'enviando' });
    const clave = carrito.claveEnvio(); // misma clave en cada reintento del mismo carrito
    try {
      const { orden } = await api<{ orden: Orden }>('/ordenes', {
        method: 'POST',
        body: {
          qr_token: token,
          idempotency_key: clave,
          lineas: carrito.lineas.map((l) => ({
            producto_id: l.producto_id,
            cantidad: l.cantidad,
            modificadores: l.opciones.map((o) => o.id),
            nota: l.nota,
          })),
        },
      });
      const difiere = orden.total_centavos !== carrito.totalEstimado;
      carrito.vaciar();
      router.replace({ pathname: '/m/[token]/orden/[id]', params: { token, id: orden.id, nueva: '1', ...(difiere ? { ajuste: '1' } : {}) } });
    } catch (e) {
      const err = e as ErrorApi;
      if (err.status === 0 || err.status >= 500) {
        // Nunca decir "enviado" sin confirmación del servidor.
        setEnvio({ tipo: 'no_confirmada', mensaje: err.status === 0 ? t('sinConexion') : err.message });
      } else {
        const agotados = (err.datos?.agotados as number[] | undefined) ?? [];
        if (agotados.length) carrito.quitarProductos(agotados);
        setEnvio({ tipo: 'rechazada', mensaje: agotados.length ? t('agotadosQuitados', { msg: err.message }) : err.message });
      }
    }
  };

  const vacio = carrito.lineas.length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.fondo }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
        <Contenedor style={{ paddingTop: Espacio.s }}>
          <Volver texto={t('seguirAgregando')} a={`/m/${token}`} />
          <View style={{ marginTop: Espacio.l, gap: 6 }}>
            <Antetitulo>{t('pedido')}</Antetitulo>
            <TituloCarta>{vacio ? t('pedidoVacio') : t('tuPedido')}</TituloCarta>
          </View>

          {envio.tipo === 'no_confirmada' ? <View style={{ marginTop: Espacio.l }}><Aviso tipo="alerta">{t('noConfirmado', { msg: envio.mensaje })}</Aviso></View> : null}
          {envio.tipo === 'rechazada' ? <View style={{ marginTop: Espacio.l }}><Aviso tipo="error">{envio.mensaje}</Aviso></View> : null}

          {vacio ? (
            <View style={{ marginTop: Espacio.l, gap: Espacio.l }}>
              <Text style={[s.secundario, { color: c.textoSecundario }]}>{t('agregaDesdeMenu')}</Text>
              <Boton titulo={t('verMenu')} onPress={() => router.replace(`/m/${token}`)} style={{ borderRadius: 10 }} />
            </View>
          ) : (
            <>
              <Linea fuerte style={{ marginTop: Espacio.xl }} />
              {carrito.lineas.map((l, i) => (
                <View key={l.uid} style={[s.linea, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.borde }]}>
                  <View style={s.nombrePrecio}>
                    <Text style={[s.nombre, { color: c.texto }]}>{l.nombre}</Text>
                    <Text style={[s.monto, { color: c.texto }]}>{quetzales(precioLinea(l))}</Text>
                  </View>
                  {l.opciones.length ? (
                    <Text style={[s.secundario, { color: c.textoSecundario }]}>{l.opciones.map((o) => tr(o.nombre, o.nombre_en)).join(' · ')}</Text>
                  ) : null}
                  {l.nota ? <Text style={[s.secundario, { color: c.textoSecundario, fontStyle: 'italic' }]}>“{l.nota}”</Text> : null}
                  <View style={[s.pasos, { borderColor: c.borde }]}>
                    <Pressable accessibilityRole="button" accessibilityLabel={`${t('quitarUno')} · ${l.nombre}`} hitSlop={4}
                      onPress={() => carrito.cambiarCantidad(l.uid, l.cantidad - 1)} style={s.paso}>
                      {l.cantidad === 1 ? <Trash2 size={16} color={Tinte.cochinilla} strokeWidth={1.75} /> : <Minus size={16} color={c.texto} strokeWidth={2} />}
                    </Pressable>
                    <Text style={{ fontFamily: Fuentes.fuerte, fontSize: 15, minWidth: 20, textAlign: 'center', color: c.texto }}>{l.cantidad}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel={`${t('agregarUno')} · ${l.nombre}`} hitSlop={4}
                      onPress={() => carrito.cambiarCantidad(l.uid, Math.min(50, l.cantidad + 1))} style={s.paso}>
                      <Plus size={16} color={c.texto} strokeWidth={2} />
                    </Pressable>
                  </View>
                </View>
              ))}
              <Linea fuerte />
              <View style={s.total}>
                <Text style={{ fontFamily: Fuentes.titulo, fontSize: 22, color: c.texto }}>{t('totalEstimado')}</Text>
                <Text style={{ fontFamily: Fuentes.fuerte, fontSize: 24, color: c.precio, fontVariant: ['tabular-nums'] }}>{quetzales(carrito.totalEstimado)}</Text>
              </View>
              <Text style={[s.secundario, { color: c.textoSecundario, fontSize: 14 }]}>{t('notaTotal')}</Text>
              <View style={s.mesa}>
                <MapPin size={16} color={c.acento} strokeWidth={1.75} />
                <Text style={[s.secundario, { color: c.texto, flex: 1 }]}>{token === 'general' ? t('pedidoSinMesa') : t('pedidoMesa')}</Text>
              </View>
            </>
          )}
        </Contenedor>
      </ScrollView>

      {!vacio ? (
        <Pie>
          <Boton
            grande
            style={{ borderRadius: 10 }}
            Icono={envio.tipo === 'no_confirmada' ? RotateCw : undefined}
            cargando={envio.tipo === 'enviando'}
            titulo={envio.tipo === 'no_confirmada' ? t('reintentarEnvio') : t('enviarCocina', { total: quetzales(carrito.totalEstimado) })}
            onPress={enviar}
          />
        </Pie>
      ) : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  linea: { paddingVertical: 18, gap: 6 },
  nombrePrecio: { flexDirection: 'row', alignItems: 'baseline', gap: Espacio.m },
  nombre: { flex: 1, fontFamily: Fuentes.titulo, fontSize: 19, lineHeight: 24 },
  monto: { fontFamily: Fuentes.fuerte, fontSize: 16, fontVariant: ['tabular-nums'] },
  secundario: { fontFamily: Fuentes.cuerpo, fontSize: 15, lineHeight: 21 },
  pasos: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8, marginTop: 6 },
  paso: { width: 44, height: 40, alignItems: 'center', justifyContent: 'center' },
  total: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: Espacio.l, paddingBottom: Espacio.s },
  mesa: { flexDirection: 'row', alignItems: 'flex-start', gap: Espacio.s, marginTop: Espacio.xl },
});
