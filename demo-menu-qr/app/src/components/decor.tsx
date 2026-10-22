// Elementos gráficos en SVG (ligeros para señal débil): separador textil, paisaje del lago y logo.
import { Image } from 'expo-image';
import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Pattern, Rect, Stop } from 'react-native-svg';

import { Tinte } from '@/constants/theme';

/** Franja textil tz'utujil (zigzag + rombos). Solo como separador delgado, nunca como fondo. */
export function Tejido({ alto = 12, colores = [Tinte.achiote, Tinte.cochinilla, Tinte.anil] as const, opacidad = 1 }: {
  alto?: number;
  colores?: readonly [string, string, string];
  opacidad?: number;
}) {
  const id = `tejido-${useId().replace(/:/g, '')}`;
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ height: alto, opacity: opacidad }}>
      <Svg width="100%" height={alto}>
        <Defs>
          <Pattern id={id} x="0" y="0" width="24" height="12" patternUnits="userSpaceOnUse">
            <Path d="M0 10 L6 2 L12 10 L18 2 L24 10" stroke={colores[0]} strokeWidth="1.5" fill="none" />
            <Path d="M12 3 L15 6 L12 9 L9 6 Z" fill={colores[1]} />
            <Circle cx="0" cy="6" r="1.2" fill={colores[2]} />
            <Circle cx="24" cy="6" r="1.2" fill={colores[2]} />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height={alto} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/** Panorama del lago al atardecer con los volcanes San Pedro, Tolimán y Atitlán y una lancha. */
export function Paisaje({ alto = 220 }: { alto?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <Svg width="100%" height={alto} viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" accessibilityLabel="Lago de Atitlán al atardecer con volcanes">
      <Defs>
        <LinearGradient id={`cielo-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={Tinte.anil} />
          <Stop offset="0.55" stopColor={Tinte.cochinilla} />
          <Stop offset="1" stopColor={Tinte.achiote} />
        </LinearGradient>
        <LinearGradient id={`lago-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2B4A72" />
          <Stop offset="1" stopColor={Tinte.nocheLago} />
        </LinearGradient>
      </Defs>
      <Rect width="400" height="150" fill={`url(#cielo-${id})`} />
      <Circle cx="250" cy="128" r="22" fill="#F2B36B" opacity="0.95" />
      {/* Atitlán y Tolimán (fondo), San Pedro (frente, izquierda) */}
      <Path d="M210 150 L282 62 L300 70 L318 60 L400 128 L400 150 Z" fill="#4A3550" opacity="0.85" />
      <Path d="M150 150 L240 98 L268 112 L330 150 Z" fill="#3A2C48" opacity="0.9" />
      <Path d="M-10 150 L70 70 L84 66 L160 150 Z" fill={Tinte.anilProfundo} />
      <Path d="M40 150 C 90 136, 120 140, 160 150 Z" fill={Tinte.aguacateOscuro} opacity="0.7" />
      <Rect y="148" width="400" height="72" fill={`url(#lago-${id})`} />
      {/* Reflejos del sol */}
      <G stroke="#F2B36B" strokeLinecap="round" opacity="0.8">
        <Path d="M228 160 H272" strokeWidth="2" />
        <Path d="M236 170 H264" strokeWidth="1.6" />
        <Path d="M242 180 H258" strokeWidth="1.3" />
        <Path d="M246 190 H254" strokeWidth="1" />
      </G>
      <G stroke="#9DB4D3" strokeLinecap="round" opacity="0.35" strokeWidth="1">
        <Path d="M20 172 H90" />
        <Path d="M300 182 H380" />
        <Path d="M60 200 H140" />
      </G>
      {/* Lancha (trazo lineal) */}
      <G stroke={Tinte.algodon} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M110 178 L160 178 L152 186 L118 186 Z" />
        <Path d="M128 178 V168 H144 V178" />
      </G>
    </Svg>
  );
}

/** Foto del restaurante para el banner, con degradado añil abajo para que el texto blanco se lea bien. */
export function FotoBanner({ alto = 220 }: { alto?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <View style={{ height: alto, width: '100%' }}>
      <Image
        source={require('@/assets/images/lugar/banner.webp')}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        contentFit="cover"
        contentPosition="left"
        accessibilityLabel="Salón de Atitlán Rest. & Café con retratos de la gente del pueblo"
      />
      {/* En web, react-native-svg no acepta `style` en <Svg>: se posiciona con un View contenedor. */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
        <Svg width="100%" height={alto}>
          <Defs>
            <LinearGradient id={`velo-${id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0.25" stopColor={Tinte.nocheLago} stopOpacity="0" />
              <Stop offset="1" stopColor={Tinte.nocheLago} stopOpacity="0.88" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height={alto} fill={`url(#velo-${id})`} />
        </Svg>
      </View>
    </View>
  );
}

/** Logo provisional: volcán + ola del lago en círculo añil (reemplazar por el logo real). */
export function Logo({ tam = 44 }: { tam?: number }) {
  return (
    <Svg width={tam} height={tam} viewBox="0 0 48 48" accessibilityLabel="Atitlán Rest. & Café">
      <Circle cx="24" cy="24" r="23" fill={Tinte.anil} />
      <Circle cx="24" cy="24" r="20" fill="none" stroke={Tinte.achiote} strokeWidth="1" strokeDasharray="2 3" />
      <Path d="M10 30 L21 14 L24 17 L27 14 L38 30 Z" fill={Tinte.algodon} />
      <Path d="M19 18 L21 14 L24 17 L27 14 L29 18 L26 17 L24 19 L22 17 Z" fill={Tinte.cochinilla} />
      <Path d="M10 34 C14 31, 18 37, 24 34 S 34 31, 38 34" stroke={Tinte.achiote} strokeWidth="2" fill="none" strokeLinecap="round" />
    </Svg>
  );
}
