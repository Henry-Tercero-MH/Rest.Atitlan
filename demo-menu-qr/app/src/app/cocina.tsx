// Pantalla de cocina (KDS): órdenes activas en tiempo real, más antigua primero.
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoginPersonal } from '@/components/login-personal';
import { Cargando, EstadoBadge } from '@/components/ui';
import { BellRing, Check, ChefHat, CheckCheck, CircleAlert, TriangleAlert, Wifi, WifiOff, type LucideIcon } from 'lucide-react-native';
import { Colores, Espacio, Paleta, Radio, type EstadoOrden } from '@/constants/theme';
import { api, horaGt, suscribir, type Orden } from '@/lib/api';
import { usePersonal } from '@/lib/personal';

const SIGUIENTE: Partial<Record<EstadoOrden, { estado: EstadoOrden; texto: string; color: string; Icono: LucideIcon }>> = {
  recibido: { estado: 'confirmado', texto: 'Confirmar', color: Paleta.lago, Icono: Check },
  confirmado: { estado: 'en_preparacion', texto: 'Preparar', color: Paleta.ambar, Icono: ChefHat },
  en_preparacion: { estado: 'listo', texto: 'Listo', color: Paleta.verde, Icono: BellRing },
  listo: { estado: 'entregado', texto: 'Entregado', color: Paleta.concreto, Icono: CheckCheck },
};
const UMBRAL_MIN = 15; // minutos antes de marcar la orden como demorada (configurable en producción)

function minutos(iso: string, ahora: number) {
  // El reloj de pantalla se actualiza cada 30 s: una orden recién llegada podría dar negativo.
  return Math.max(0, Math.floor((ahora - new Date(iso).getTime()) / 60000));
}

function campana() {
  if (Platform.OS !== 'web') return;
  try {
    const Ctx = (window as unknown as { AudioContext: typeof AudioContext }).AudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    osc.frequency.value = 880;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {}
}

export default function Cocina() {
  const { sesion, cargando, salir } = usePersonal();
  const [ordenes, setOrdenes] = useState<Orden[] | null>(null);
  const [agotados, setAgotados] = useState<number[]>([]);
  const [conectado, setConectado] = useState(true);
  const [ahora, setAhora] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<{ orden: Orden; lineaId?: number } | null>(null);
  const { width } = useWindowDimensions();
  const token = sesion?.token;

  const cargar = useCallback(async () => {
    if (!token) return;
    try {
      const r = await api<{ ordenes: Orden[]; agotados: number[] }>('/cocina/ordenes', { token });
      setOrdenes(r.ordenes);
      setAgotados(r.agotados);
      setConectado(true);
    } catch (e) {
      const err = e as { status?: number; message: string };
      if (err.status === 401) salir();
      setConectado(false);
    }
  }, [token, salir]);

  useEffect(() => {
    if (!token) return;
    const t = setInterval(() => setAhora(Date.now()), 30000);
    const fin = suscribir('/cocina/eventos', (tipo, datos) => {
      if (tipo === 'orden_nueva') {
        campana();
        setOrdenes((prev) => (prev ? [...prev.filter((o) => o.id !== (datos as Orden).id), datos as Orden] : prev));
      } else if (tipo === 'orden_actualizada') {
        const o = datos as Orden;
        setOrdenes((prev) => prev && (o.estado === 'entregado' || o.estado === 'cancelado' ? prev.filter((x) => x.id !== o.id) : prev.map((x) => (x.id === o.id ? o : x))));
      } else {
        cargar();
      }
    }, { token, alConectar: setConectado, respaldoMs: 15000 });
    return () => {
      clearInterval(t);
      fin();
    };
  }, [token, cargar]);

  const avanzar = async (o: Orden, estado: EstadoOrden, motivo?: string) => {
    setError(null);
    try {
      const r = await api<{ orden: Orden }>(`/ordenes/${o.id}/estado`, { method: 'PATCH', token, body: { estado, motivo } });
      setOrdenes((prev) => prev && (estado === 'entregado' || estado === 'cancelado' ? prev.filter((x) => x.id !== o.id) : prev.map((x) => (x.id === o.id ? r.orden : x))));
    } catch (e) {
      setError((e as Error).message);
      cargar();
    }
  };

  const rechazarLinea = async (o: Orden, lineaId: number, motivo: string) => {
    setError(null);
    try {
      const r = await api<{ orden: Orden }>(`/ordenes/${o.id}/lineas/${lineaId}`, { method: 'PATCH', token, body: { estado: 'rechazada', motivo } });
      setOrdenes((prev) => prev && prev.map((x) => (x.id === o.id ? r.orden : x)));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (cargando) return <View style={{ flex: 1, backgroundColor: Colores.kdsFondo }}><Cargando oscuro /></View>;
  if (!sesion) return <LoginPersonal titulo="Pantalla de cocina" sugerido={{ usuario: 'cocina', pin: '1111' }} />;

  const columnas = width >= 1100 ? 4 : width >= 800 ? 3 : width >= 560 ? 2 : 1;
  const anchoTarjeta = `${100 / columnas}%` as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colores.kdsFondo }}>
      <View style={s.barra}>
        <ChefHat size={24} color={Paleta.ambar} />
        <Text style={s.marca}>COCINA</Text>
        <Text style={s.contador}>{ordenes?.length ?? 0} {ordenes?.length === 1 ? 'activa' : 'activas'}</Text>
        <View style={[s.conexion, { backgroundColor: conectado ? Paleta.verde : Paleta.rojo }]}>
          {conectado ? <Wifi size={16} color={Paleta.blanco} /> : <WifiOff size={16} color={Paleta.blanco} />}
          <Text style={{ color: Paleta.blanco, fontWeight: '800' }}>{conectado ? 'En línea' : 'Sin conexión — reintentando'}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Pressable onPress={salir} hitSlop={10}><Text style={{ color: Colores.kdsTextoSec }}>{sesion.usuario.nombre} · Salir</Text></Pressable>
      </View>
      {!conectado ? (
        <Text style={s.contingencia}>Sin conexión: usa las comandas en papel hasta que vuelva la señal. Las órdenes no se pierden.</Text>
      ) : null}
      {error ? <Text style={[s.contingencia, { backgroundColor: Paleta.rojoOscuro }]}>{error}</Text> : null}

      {!ordenes ? <Cargando oscuro texto="Cargando órdenes…" /> : ordenes.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colores.kdsTextoSec, fontSize: 20 }}>Sin órdenes pendientes</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.grilla}>
          {ordenes.map((o) => {
            const min = minutos(o.creada_en, ahora);
            const demorada = min >= UMBRAL_MIN && o.estado !== 'listo';
            const sig = SIGUIENTE[o.estado];
            return (
              <View key={o.id} style={{ width: anchoTarjeta, padding: Espacio.s }}>
                <View style={[s.tarjeta, demorada && { borderColor: Paleta.rojo, borderWidth: 3 }, o.estado === 'listo' && { borderColor: Paleta.verde, borderWidth: 3 }]}>
                  <View style={s.cabecera}>
                    <Text style={s.numero}>{o.numero_visible}</Text>
                    <Text style={[s.mesa, !o.mesa && { color: Paleta.ambar }]}>{o.mesa ? `Mesa ${o.mesa}` : 'SIN MESA · asignar'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <EstadoBadge estado={o.estado} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      {demorada ? <TriangleAlert size={16} color={Paleta.ambar} /> : null}
                      <Text style={[s.tiempo, demorada && { color: Paleta.ambar }]}>{horaGt(o.creada_en)} · {min} min</Text>
                    </View>
                  </View>
                  <View style={s.lineas}>
                    {o.lineas.map((l) => {
                      const agotado = agotados.includes(l.producto_id) && l.estado === 'activa';
                      return (
                        <View key={l.id} style={{ gap: 2 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Espacio.s }}>
                            <Text style={[s.linea, l.estado !== 'activa' && s.tachado]}>
                              <Text style={{ color: Paleta.ambar }}>{l.cantidad}×</Text> {l.nombre.replace('[EJEMPLO] ', '')}
                            </Text>
                            {l.estado === 'activa' && o.lineas.filter((x) => x.estado === 'activa').length > 1 ? (
                              <Pressable onPress={() => setCancelando({ orden: o, lineaId: l.id })} hitSlop={8}>
                                <Text style={{ color: Colores.kdsTextoSec, fontSize: 13, textDecorationLine: 'underline' }}>rechazar</Text>
                              </Pressable>
                            ) : null}
                          </View>
                          {l.modificadores.map((m, i) => <Text key={i} style={s.mod}>→ {m.nombre}</Text>)}
                          {l.nota ? <Text style={s.nota}>NOTA: {l.nota}</Text> : null}
                          {agotado ? <View style={s.agotado}><CircleAlert size={14} color={Paleta.blanco} /><Text style={{ color: Paleta.blanco, fontWeight: '800' }}>Marcado AGOTADO</Text></View> : null}
                          {l.estado !== 'activa' ? <Text style={s.mod}>({l.estado})</Text> : null}
                        </View>
                      );
                    })}
                  </View>
                  <View style={{ flexDirection: 'row', gap: Espacio.s }}>
                    {sig ? (
                      <Pressable onPress={() => avanzar(o, sig.estado)} style={({ pressed }) => [s.accion, { flexDirection: 'row', gap: 8, backgroundColor: sig.color, opacity: pressed ? 0.8 : 1 }]}>
                        <sig.Icono size={20} color={(sig.color === Paleta.ambar || sig.color === Paleta.concreto) ? Paleta.carbon : Paleta.blanco} strokeWidth={2.4} />
                        <Text style={[s.accionTexto, (sig.color === Paleta.ambar || sig.color === Paleta.concreto) && { color: Paleta.carbon }]}>{sig.texto}</Text>
                      </Pressable>
                    ) : null}
                    {o.estado !== 'listo' ? (
                      <Pressable onPress={() => setCancelando({ orden: o })} style={[s.accion, { flex: 0, flexShrink: 0, minWidth: 104, paddingHorizontal: 18, backgroundColor: Colores.kdsBorde }]}>
                        <Text style={[s.accionTexto, { color: Colores.kdsTexto }]}>Cancelar</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {cancelando ? (
        <Motivo
          titulo={cancelando.lineaId ? 'Rechazar platillo' : `Cancelar orden ${cancelando.orden.numero_visible}`}
          onCerrar={() => setCancelando(null)}
          onConfirmar={(motivo) => {
            const c = cancelando;
            setCancelando(null);
            if (c.lineaId) rechazarLinea(c.orden, c.lineaId, motivo);
            else avanzar(c.orden, 'cancelado', motivo);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function Motivo({ titulo, onCerrar, onConfirmar }: { titulo: string; onCerrar: () => void; onConfirmar: (m: string) => void }) {
  const [motivo, setMotivo] = useState('');
  const rapidos = ['Producto agotado', 'Pedido duplicado', 'Cliente se retiró'];
  return (
    <View style={s.velo}>
      <View style={s.modal}>
        <Text style={{ color: Colores.kdsTexto, fontSize: 20, fontWeight: '800' }}>{titulo}</Text>
        <Text style={{ color: Colores.kdsTextoSec }}>El motivo queda registrado en la auditoría.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Espacio.s }}>
          {rapidos.map((r) => (
            <Pressable key={r} onPress={() => setMotivo(r)} style={[s.rapido, motivo === r && { borderColor: Paleta.ambar }]}>
              <Text style={{ color: Colores.kdsTexto }}>{r}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput value={motivo} onChangeText={setMotivo} placeholder="Otro motivo…" placeholderTextColor={Colores.kdsTextoSec} style={s.input} />
        <View style={{ flexDirection: 'row', gap: Espacio.s }}>
          <Pressable onPress={onCerrar} style={[s.accion, { backgroundColor: Colores.kdsBorde }]}><Text style={[s.accionTexto, { color: Colores.kdsTexto }]}>Volver</Text></Pressable>
          <Pressable disabled={!motivo.trim()} onPress={() => onConfirmar(motivo.trim())} style={[s.accion, { backgroundColor: Paleta.rojo, opacity: motivo.trim() ? 1 : 0.5 }]}>
            <Text style={s.accionTexto}>Confirmar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  barra: { flexDirection: 'row', alignItems: 'center', gap: Espacio.l, paddingHorizontal: Espacio.l, paddingVertical: Espacio.m, borderBottomWidth: 1, borderBottomColor: Colores.kdsBorde, flexWrap: 'wrap' },
  marca: { color: Paleta.ambar, fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  contador: { color: Colores.kdsTexto, fontSize: 16, fontWeight: '700' },
  conexion: { borderRadius: Radio.pill, paddingHorizontal: 12, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 6 },
  contingencia: { color: Paleta.blanco, backgroundColor: '#7A4B05', padding: Espacio.m, fontWeight: '700' },
  grilla: { flexDirection: 'row', flexWrap: 'wrap', padding: Espacio.s },
  tarjeta: { backgroundColor: Colores.kdsTarjeta, borderRadius: Radio.l, padding: Espacio.l, gap: Espacio.m, borderWidth: 1, borderColor: Colores.kdsBorde },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  numero: { color: Colores.kdsTexto, fontSize: 28, fontWeight: '900' },
  mesa: { color: Colores.kdsTexto, fontSize: 20, fontWeight: '800' },
  tiempo: { color: Colores.kdsTextoSec, fontSize: 14, fontWeight: '600' },
  lineas: { gap: Espacio.s, borderTopWidth: 1, borderTopColor: Colores.kdsBorde, paddingTop: Espacio.m },
  linea: { flex: 1, color: Colores.kdsTexto, fontSize: 18, fontWeight: '700' },
  mod: { color: Colores.kdsTextoSec, fontSize: 15, paddingLeft: Espacio.l },
  nota: { color: Paleta.carbon, backgroundColor: Paleta.ambar, fontSize: 15, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginLeft: Espacio.l },
  agotado: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Paleta.rojo, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginLeft: Espacio.l },
  tachado: { textDecorationLine: 'line-through', color: Colores.kdsTextoSec },
  accion: { flex: 1, minHeight: 56, borderRadius: Radio.m, alignItems: 'center', justifyContent: 'center' },
  accionTexto: { color: Paleta.blanco, fontSize: 18, fontWeight: '800' },
  velo: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: Espacio.l },
  modal: { width: '100%', maxWidth: 480, backgroundColor: Colores.kdsTarjeta, borderRadius: Radio.l, padding: Espacio.xl, gap: Espacio.m },
  rapido: { borderWidth: 1.5, borderColor: Colores.kdsBorde, borderRadius: Radio.pill, paddingHorizontal: 12, paddingVertical: 8 },
  input: { minHeight: 48, borderWidth: 1.5, borderColor: Colores.kdsBorde, borderRadius: Radio.m, color: Colores.kdsTexto, paddingHorizontal: Espacio.m, fontSize: 16 },
});
