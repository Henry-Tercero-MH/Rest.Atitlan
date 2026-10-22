// Carrito, mesa y envío con idempotencia.
import { router, useLocalSearchParams } from 'expo-router';
import { ChefHat, ChevronLeft, Minus, Plus, RotateCw, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Aviso, Boton, BotonIcono, Pantalla, Tarjeta, Texto, Titulo } from '@/components/ui';
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
  const volver = () => (router.canGoBack() ? router.back() : router.replace(`/m/${token}`));

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

  if (carrito.lineas.length === 0) {
    return (
      <Pantalla>
        <View style={{ height: Espacio.xl }} />
        <Titulo>{t('pedidoVacio')}</Titulo>
        {envio.tipo === 'rechazada' ? <Aviso tipo="error">{envio.mensaje}</Aviso> : null}
        <Texto secundario>{t('agregaDesdeMenu')}</Texto>
        <Boton titulo={t('verMenu')} onPress={() => router.replace(`/m/${token}`)} />
      </Pantalla>
    );
  }

  return (
    <Pantalla
      pie={
        <Boton
          grande
          Icono={envio.tipo === 'no_confirmada' ? RotateCw : ChefHat}
          cargando={envio.tipo === 'enviando'}
          titulo={envio.tipo === 'no_confirmada' ? t('reintentarEnvio') : t('enviarCocina', { total: quetzales(carrito.totalEstimado) })}
          onPress={enviar}
        />
      }>
      <Pressable accessibilityRole="button" onPress={volver} hitSlop={10} style={s.volver}>
        <ChevronLeft size={20} color={c.enlace} />
        <Text style={{ fontSize: 16, color: c.enlace, fontFamily: Fuentes.fuerte }}>{t('seguirAgregando')}</Text>
      </Pressable>
      <Titulo>{t('tuPedido')}</Titulo>

      {envio.tipo === 'no_confirmada' ? <Aviso tipo="alerta">{t('noConfirmado', { msg: envio.mensaje })}</Aviso> : null}
      {envio.tipo === 'rechazada' ? <Aviso tipo="error">{envio.mensaje}</Aviso> : null}

      <Tarjeta>
        {carrito.lineas.map((l, i) => (
          <View key={l.uid} style={[s.linea, i > 0 && { borderTopWidth: 1, borderTopColor: c.borde }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[s.nombre, { color: c.texto }]}>{l.nombre}</Text>
              {l.opciones.map((o) => <Texto key={o.id} secundario style={{ fontSize: 14 }}>• {tr(o.nombre, o.nombre_en)}</Texto>)}
              {l.nota ? <Texto secundario style={{ fontSize: 14, fontStyle: 'italic' }}>“{l.nota}”</Texto> : null}
              <View style={s.pasos}>
                <BotonIcono Icono={l.cantidad === 1 ? Trash2 : Minus} etiqueta={`${t('quitarUno')} · ${l.nombre}`}
                  color={l.cantidad === 1 ? Tinte.cochinilla : undefined} onPress={() => carrito.cambiarCantidad(l.uid, l.cantidad - 1)} />
                <Text style={{ fontSize: 17, fontFamily: Fuentes.fuerte, minWidth: 24, textAlign: 'center', color: c.texto }}>{l.cantidad}</Text>
                <BotonIcono Icono={Plus} etiqueta={`${t('agregarUno')} · ${l.nombre}`} onPress={() => carrito.cambiarCantidad(l.uid, Math.min(50, l.cantidad + 1))} />
              </View>
            </View>
            <Text style={[s.monto, { color: c.texto }]}>{quetzales(precioLinea(l))}</Text>
          </View>
        ))}
      </Tarjeta>

      <Tarjeta>
        <View style={s.fila}>
          <Texto>{t('totalEstimado')}</Texto>
          <Text style={[s.total, { color: c.precio }]}>{quetzales(carrito.totalEstimado)}</Text>
        </View>
        <Texto secundario style={{ fontSize: 14, lineHeight: 20 }}>{t('notaTotal')}</Texto>
      </Tarjeta>

      <Aviso tipo="info">{token === 'general' ? t('pedidoSinMesa') : t('pedidoMesa')}</Aviso>
    </Pantalla>
  );
}

const s = StyleSheet.create({
  volver: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingTop: Espacio.l, minHeight: 44 },
  linea: { flexDirection: 'row', gap: Espacio.m, paddingVertical: Espacio.m },
  nombre: { fontSize: 17, fontFamily: Fuentes.titulo },
  monto: { fontSize: 16, fontFamily: Fuentes.fuerte },
  pasos: { flexDirection: 'row', alignItems: 'center', gap: Espacio.s, marginTop: Espacio.s },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { fontSize: 24, fontFamily: Fuentes.fuerte },
});
