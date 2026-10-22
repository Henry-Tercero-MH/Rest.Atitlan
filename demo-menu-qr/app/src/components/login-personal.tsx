import { LogIn } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Aviso, Boton, Campo, Pantalla, Tarjeta, Texto, Titulo } from '@/components/ui';
import { Logo } from '@/components/decor';
import { Colores, Espacio, Fuentes, Paleta } from '@/constants/theme';
import { usePersonal } from '@/lib/personal';

export function LoginPersonal({ titulo, sugerido }: { titulo: string; sugerido: { usuario: string; pin: string } }) {
  const { entrar } = usePersonal();
  const [usuario, setUsuario] = useState(sugerido.usuario);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const enviar = async () => {
    setCargando(true);
    setError(null);
    try {
      await entrar(usuario.trim(), pin);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <Pantalla fondo={Colores.kdsFondo}>
      <View style={{ height: Espacio.xxl }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Espacio.s }}>
        <Logo tam={40} />
        <Text style={{ color: Paleta.ambar, fontFamily: Fuentes.medio, fontSize: 15, letterSpacing: 1 }}>Atitlán Rest. & Café · Personal</Text>
      </View>
      <Titulo color={Colores.kdsTexto}>{titulo}</Titulo>
      <Tarjeta>
        <Texto secundario>Usuario</Texto>
        <Campo value={usuario} onChangeText={setUsuario} autoCapitalize="none" autoCorrect={false} />
        <Texto secundario>PIN</Texto>
        <Campo value={pin} onChangeText={setPin} secureTextEntry keyboardType="number-pad" onSubmitEditing={enviar} />
        {error ? <Aviso tipo="error">{error}</Aviso> : null}
        <Boton titulo="Entrar" Icono={LogIn} onPress={enviar} cargando={cargando} deshabilitado={!usuario || !pin} />
      </Tarjeta>
      <Aviso tipo="info">
        Demo: usuario «{sugerido.usuario}», PIN {sugerido.pin}. Otros: admin/1234, cocina/1111, mesero/2222.
      </Aviso>
    </Pantalla>
  );
}
