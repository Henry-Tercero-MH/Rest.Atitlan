// Confirmación y seguimiento en tiempo real.
import { router, useLocalSearchParams } from 'expo-router';
import { Check, UtensilsCrossed } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Tejido } from '@/components/decor';
import { Aviso, Boton, Cargando, EstadoBadge, Pantalla, Tarjeta, Texto, Titulo } from '@/components/ui';
import { Espacio, Estados, Fuentes, Tinte, type EstadoOrden } from '@/constants/theme';
import { api, horaGt, quetzales, suscribir, type Orden } from '@/lib/api';
import { usePref } from '@/lib/preferencias';

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

  if (!orden) return <Pantalla>{error ? <Aviso tipo="error">{error}</Aviso> : <Cargando />}</Pantalla>;

  const indice = PASOS.indexOf(orden.estado);
  const lineasRechazadas = orden.lineas.filter((l) => l.estado !== 'activa');

  return (
    <Pantalla pie={<Boton titulo={t('volverMenu')} variante="secundario" Icono={UtensilsCrossed} onPress={() => router.replace(`/m/${token}`)} />}>
      <View style={{ height: Espacio.l }} />
      {nueva ? (
        <View style={s.confirmada}>
          <View style={s.check}><Check size={34} color={Tinte.blanco} strokeWidth={3} /></View>
          <Titulo>{t('pedidoRecibido')}</Titulo>
          <Texto secundario>{t('restauranteConfirmo')}</Texto>
        </View>
      ) : null}

      {orden.estado === 'listo' ? <Aviso tipo="exito">{t('pedidoListo')}</Aviso> : null}
      {orden.estado === 'cancelado' ? <Aviso tipo="error">{t('pedidoCancelado')}</Aviso> : null}
      {ajuste ? <Aviso tipo="info">{t('totalConfirmado', { total: quetzales(orden.total_centavos) })}</Aviso> : null}
      {lineasRechazadas.length ? <Aviso tipo="alerta">{t('noPreparado', { lista: lineasRechazadas.map((l) => l.nombre).join(', ') })}</Aviso> : null}

      <Tarjeta>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Texto secundario>{t('numeroOrden')}</Texto>
            <Text style={[s.numero, { color: c.precio }]}>{orden.numero_visible}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={{ fontFamily: Fuentes.fuerte, color: c.texto, fontSize: 16 }}>{orden.mesa ? t('mesa', { numero: orden.mesa }) : t('mesaPorAsignar')}</Text>
            <Texto secundario>{horaGt(orden.creada_en)}</Texto>
          </View>
        </View>
        <EstadoBadge estado={orden.estado} grande />
      </Tarjeta>

      {orden.estado !== 'cancelado' ? (
        <Tarjeta>
          {PASOS.map((p, i) => {
            const hecho = i <= indice;
            const e = Estados[p];
            return (
              <View key={p} style={s.paso}>
                <View style={[s.punto, { borderColor: hecho ? e.texto : c.borde, backgroundColor: hecho ? e.fondo : 'transparent' }]}>
                  <e.Icono size={16} color={hecho ? e.texto : c.textoSecundario} strokeWidth={2.2} />
                </View>
                <Text style={[s.pasoTexto, { color: hecho ? c.texto : c.textoSecundario, fontFamily: hecho ? Fuentes.fuerte : Fuentes.cuerpo }]}>
                  {idioma === 'en' ? e.etiquetaEn : e.etiqueta}{i === indice ? `  ·  ${t('ahora')}` : ''}
                </Text>
              </View>
            );
          })}
        </Tarjeta>
      ) : null}

      <Tejido alto={10} opacidad={0.7} />
      <Tarjeta>
        <Titulo nivel={3}>{t('detalle')}</Titulo>
        {orden.lineas.map((l) => (
          <View key={l.id} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Espacio.s }}>
            <Text style={[{ flex: 1, color: c.texto, fontSize: 15, fontFamily: Fuentes.cuerpo }, l.estado !== 'activa' && s.tachado]}>
              {l.cantidad}× {l.nombre}
              {l.modificadores.length ? ` (${l.modificadores.map((m) => m.nombre).join(', ')})` : ''}
            </Text>
            <Text style={[{ fontFamily: Fuentes.fuerte, color: c.texto }, l.estado !== 'activa' && s.tachado]}>
              {quetzales(l.precio_unitario_centavos * l.cantidad)}
            </Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: c.borde, paddingTop: Espacio.s }}>
          <Text style={{ fontFamily: Fuentes.fuerte, fontSize: 16, color: c.texto }}>{t('total')}</Text>
          <Text style={{ fontFamily: Fuentes.fuerte, fontSize: 18, color: c.precio }}>{quetzales(orden.total_centavos)}</Text>
        </View>
      </Tarjeta>
    </Pantalla>
  );
}

const s = StyleSheet.create({
  confirmada: { alignItems: 'center', gap: Espacio.s },
  check: { width: 68, height: 68, borderRadius: 34, backgroundColor: Tinte.aguacate, alignItems: 'center', justifyContent: 'center' },
  numero: { fontSize: 36, fontFamily: Fuentes.tituloFuerte, letterSpacing: 1 },
  paso: { flexDirection: 'row', alignItems: 'center', gap: Espacio.m, minHeight: 40 },
  punto: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  pasoTexto: { fontSize: 16 },
  tachado: { textDecorationLine: 'line-through', opacity: 0.6 },
});
