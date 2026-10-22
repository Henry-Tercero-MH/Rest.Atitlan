// Órdenes de esta visita, total acumulado y llamar al mesero / pedir la cuenta.
import { router, useLocalSearchParams } from 'expo-router';
import { BellRing, ChevronLeft, ReceiptText } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Aviso, Boton, Cargando, EstadoBadge, Pantalla, Tarjeta, Texto, Titulo } from '@/components/ui';
import { Espacio, Fuentes } from '@/constants/theme';
import { api, horaGt, quetzales, type Orden } from '@/lib/api';
import { usePref } from '@/lib/preferencias';

type Visita = { ordenes: Orden[]; total_centavos: number };

export default function MiVisita() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { c, t } = usePref();
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
    <Pantalla>
      <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace(`/m/${token}`))} hitSlop={10}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingTop: Espacio.l, minHeight: 44 }}>
        <ChevronLeft size={20} color={c.enlace} />
        <Text style={{ fontSize: 16, color: c.enlace, fontFamily: Fuentes.fuerte }}>{t('menu')}</Text>
      </Pressable>
      <Titulo>{t('miVisita')}</Titulo>

      <View style={{ flexDirection: 'row', gap: Espacio.s }}>
        <Boton titulo={t('llamarMesero')} Icono={BellRing} variante="secundario" style={{ flex: 1 }} onPress={() => pedir('mesero')} />
        <Boton titulo={t('pedirCuenta')} Icono={ReceiptText} variante="secundario" style={{ flex: 1 }} onPress={() => pedir('cuenta')} />
      </View>
      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

      {!datos ? <Cargando /> : datos.ordenes.length === 0 ? (
        <Texto secundario>{t('sinOrdenes')}</Texto>
      ) : (
        <>
          {datos.ordenes.map((o) => (
            <Pressable key={o.id} accessibilityRole="link"
              onPress={() => router.push({ pathname: '/m/[token]/orden/[id]', params: { token, id: o.id } })}>
                <Tarjeta>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 20, fontFamily: Fuentes.tituloFuerte, color: c.precio }}>{o.numero_visible}</Text>
                    <Texto secundario>{horaGt(o.creada_en)}</Texto>
                  </View>
                  <EstadoBadge estado={o.estado} />
                  <Texto secundario>{o.lineas.map((l) => `${l.cantidad}× ${l.nombre}`).join(' · ')}</Texto>
                  <Text style={{ fontFamily: Fuentes.fuerte, color: c.texto, fontSize: 16 }}>{quetzales(o.total_centavos)}</Text>
                </Tarjeta>
            </Pressable>
          ))}
          <Tarjeta style={{ backgroundColor: c.superficieAlt }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontFamily: Fuentes.fuerte, color: c.texto }}>{t('consumoAcumulado')}</Text>
              <Text style={{ fontSize: 22, fontFamily: Fuentes.fuerte, color: c.precio }}>{quetzales(datos.total_centavos)}</Text>
            </View>
            <Texto secundario style={{ fontSize: 14 }}>{t('cobroCaja')}</Texto>
          </Tarjeta>
        </>
      )}
    </Pantalla>
  );
}
