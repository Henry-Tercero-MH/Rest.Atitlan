// Panel mínimo del personal (Etapa 1): mesas, consumo de la visita, disponibilidad y avisos de asistencia.
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ban, Brush, CalendarClock, Circle, CircleDot, LockOpen, LogOut, QrCode, Lock, type LucideIcon } from 'lucide-react-native';

import { Logo } from '@/components/decor';

import { LoginPersonal } from '@/components/login-personal';
import { Aviso, Boton, Cargando, Chip, Pantalla, Tarjeta, Texto, Titulo } from '@/components/ui';
import { Colores, Espacio, Fuentes, Paleta, Radio } from '@/constants/theme';
import { api, quetzales, suscribir } from '@/lib/api';
import { usePersonal } from '@/lib/personal';

type Mesa = {
  id: number; numero: string; capacidad: number; area: string; estado: string; qr_token: string;
  sesion_id: string | null; consumo_centavos: number;
};
type Producto = { id: number; nombre: string; precio_centavos: number; disponible: boolean; seccion: string };
type Asistencia = { tipo: string; mesa: string | null; en: string };

const ESTADO_MESA: Record<string, { texto: string; color: string; Icono: LucideIcon }> = {
  disponible: { texto: 'Disponible', color: '#46633D', Icono: Circle },
  ocupada: { texto: 'Ocupada', color: Paleta.rojo, Icono: CircleDot },
  reservada: { texto: 'Reservada', color: Paleta.lago, Icono: CalendarClock },
  pendiente_limpieza: { texto: 'Limpieza', color: '#7A4511', Icono: Brush },
  fuera_de_servicio: { texto: 'Fuera de servicio', color: '#6A5D50', Icono: Ban },
};

export default function Personal() {
  const { sesion, cargando, salir } = usePersonal();
  const [vista, setVista] = useState<'mesas' | 'catalogo'>('mesas');
  const [mesas, setMesas] = useState<Mesa[] | null>(null);
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [qrAbierto, setQrAbierto] = useState<number | null>(null);
  const [avisos, setAvisos] = useState<Asistencia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const token = sesion?.token;

  const cargar = useCallback(async () => {
    if (!token) return;
    try {
      const [m, p] = await Promise.all([
        api<{ mesas: Mesa[] }>('/admin/mesas', { token }),
        api<{ productos: Producto[] }>('/admin/productos', { token }),
      ]);
      setMesas(m.mesas);
      setProductos(p.productos);
    } catch (e) {
      if ((e as { status?: number }).status === 401) salir();
      setError((e as Error).message);
    }
  }, [token, salir]);

  useEffect(() => {
    if (!token) return;
    return suscribir('/personal/eventos', (tipo, datos) => {
      if (tipo === 'asistencia') setAvisos((a) => [datos as Asistencia, ...a].slice(0, 10));
      else cargar();
    }, { token, respaldoMs: 20000 });
  }, [token, cargar]);

  const accionMesa = async (m: Mesa, accion: 'abrir' | 'cerrar') => {
    setError(null);
    try {
      await api(`/admin/mesas/${m.id}/${accion}`, { method: 'POST', token });
      cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const disponibilidad = async (p: Producto, disponible: boolean) => {
    setProductos((ps) => ps && ps.map((x) => (x.id === p.id ? { ...x, disponible } : x)));
    try {
      await api(`/admin/productos/${p.id}`, { method: 'PATCH', token, body: { disponible } });
    } catch (e) {
      setError((e as Error).message);
      cargar();
    }
  };

  if (cargando) return <Pantalla><Cargando /></Pantalla>;
  if (!sesion) return <LoginPersonal titulo="Mesas y catálogo" sugerido={{ usuario: 'mesero', pin: '2222' }} />;

  const origen = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : 'https://menu.example';

  return (
    <Pantalla>
      <View style={s.barra}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Espacio.s }}>
          <Logo tam={36} />
          <Text style={{ color: Paleta.lago, fontFamily: Fuentes.tituloFuerte, fontSize: 18 }}>Atitlán Rest. & Café</Text>
        </View>
        <Pressable onPress={salir} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}>
          <LogOut size={16} color={Colores.textoSecundario} />
          <Text style={{ color: Colores.textoSecundario }}>{sesion.usuario.nombre} ({sesion.usuario.rol}) · Salir</Text>
        </Pressable>
      </View>

      {avisos.map((a, i) => (
        <Aviso key={i} tipo="alerta">
          {a.mesa ? `Mesa ${a.mesa}` : 'Cliente sin mesa'}: {a.tipo === 'cuenta' ? 'pide la cuenta' : a.tipo === 'mesero' ? 'llama al mesero' : 'pide asignación de mesa'}
        </Aviso>
      ))}
      {error ? <Aviso tipo="error">{error}</Aviso> : null}

      <View style={{ flexDirection: 'row', gap: Espacio.s }}>
        <Chip texto="Mesas" activo={vista === 'mesas'} onPress={() => setVista('mesas')} />
        <Chip texto="Disponibilidad" activo={vista === 'catalogo'} onPress={() => setVista('catalogo')} />
      </View>

      {vista === 'mesas' ? (
        !mesas ? <Cargando /> : mesas.map((m) => {
          const e = ESTADO_MESA[m.estado] ?? ESTADO_MESA.fuera_de_servicio;
          return (
            <Tarjeta key={m.id}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Titulo nivel={2}>Mesa {m.numero}</Titulo>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <e.Icono size={16} color={e.color} strokeWidth={2.4} />
                  <Text style={{ color: e.color, fontWeight: '800' }}>{e.texto}</Text>
                </View>
              </View>
              <Texto secundario>{m.area} · {m.capacidad} personas</Texto>
              {m.sesion_id ? <Text style={{ fontSize: 16, fontWeight: '800' }}>Consumo de la visita: {quetzales(m.consumo_centavos)}</Text> : null}
              <View style={{ flexDirection: 'row', gap: Espacio.s, flexWrap: 'wrap' }}>
                {m.sesion_id ? (
                  <Boton titulo="Cerrar mesa (ya cobrada)" Icono={Lock} variante="peligro" onPress={() => accionMesa(m, 'cerrar')} />
                ) : (
                  <Boton titulo="Abrir mesa" Icono={LockOpen} onPress={() => accionMesa(m, 'abrir')} />
                )}
                <Boton titulo={qrAbierto === m.id ? 'Ocultar QR' : 'Ver QR'} Icono={QrCode} variante="secundario" onPress={() => setQrAbierto(qrAbierto === m.id ? null : m.id)} />
              </View>
              {qrAbierto === m.id ? (
                <View style={s.qr}>
                  <QRCode value={`${origen}/m/${m.qr_token}`} size={160} color={Paleta.lago} logoBackgroundColor={Paleta.blanco} />
                  <Text style={{ fontFamily: Fuentes.tituloFuerte, fontSize: 18, marginTop: Espacio.s, color: Paleta.lago }}>Atitlán Rest. & Café · Mesa {m.numero}</Text>
                  <Texto secundario style={{ fontSize: 12 }}>{`${origen}/m/${m.qr_token}`}</Texto>
                </View>
              ) : null}
            </Tarjeta>
          );
        })
      ) : !productos ? <Cargando /> : (
        <Tarjeta>
          <Texto secundario>Al apagar un platillo se oculta del menú del cliente al instante.</Texto>
          {productos.map((p, i) => (
            <View key={p.id}>
              {i === 0 || productos[i - 1].seccion !== p.seccion ? <Text style={s.seccion}>{p.seccion}</Text> : null}
              <View style={s.prod}>
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 15, fontWeight: '600', color: Colores.texto }, !p.disponible && { color: Colores.textoSecundario }]}>{p.nombre}</Text>
                  <Texto secundario style={{ fontSize: 13 }}>{quetzales(p.precio_centavos)} · {p.disponible ? 'Disponible' : 'AGOTADO'}</Texto>
                </View>
                <Switch
                  accessibilityLabel={`Disponible ${p.nombre}`}
                  value={p.disponible}
                  onValueChange={(v) => disponibilidad(p, v)}
                  trackColor={{ true: Paleta.verde, false: Paleta.concreto }}
                  thumbColor={Paleta.blanco}
                />
              </View>
            </View>
          ))}
        </Tarjeta>
      )}
    </Pantalla>
  );
}

const s = StyleSheet.create({
  barra: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Espacio.l, flexWrap: 'wrap', gap: Espacio.s },
  qr: { alignItems: 'center', padding: Espacio.l, backgroundColor: Paleta.blanco, borderRadius: Radio.m, borderWidth: 1, borderColor: Colores.borde },
  seccion: { fontSize: 13, fontWeight: '800', color: Paleta.rojoOscuro, marginTop: Espacio.m, letterSpacing: 1, textTransform: 'uppercase' },
  prod: { flexDirection: 'row', alignItems: 'center', gap: Espacio.m, minHeight: 52, borderBottomWidth: 1, borderBottomColor: Colores.borde },
});
