/**
 * Identidad «Atitlán Rest. & Café» — tintes naturales de los textiles tz'utujil de San Juan La Laguna.
 * Contraste verificado (WCAG AA) en docs/paleta.md. Reglas:
 * - Achiote no se usa como texto sobre crema (2.6:1): solo íconos y detalles, o fondo con texto café.
 * - Aguacate como etiqueta: texto blanco sobre verde (4.7:1).
 */
import {
  Ban, BellRing, Check, CheckCheck, ChefHat, CircleDot, type LucideIcon,
} from 'lucide-react-native';

import '@/global.css';

export const Tinte = {
  anil: '#1F3A5F',
  anilProfundo: '#16294A',
  anilClaro: '#9DB4D3',
  anilSuave: '#E3EAF3',
  cochinilla: '#A63A3A',
  cochinillaOscura: '#7E2A2A',
  cochinillaSuave: '#F6E3E0',
  achiote: '#D9822B',
  achioteSuave: '#FBEBD8',
  aguacate: '#5A7D4F',
  aguacateOscuro: '#46633D',
  aguacateSuave: '#E6EFE1',
  algodon: '#F7F1E5',
  algodonOscuro: '#EFE6D4',
  cafe: '#2E2620',
  cafeMedio: '#6A5D50',
  arena: '#E2D6C2',
  piedra: '#A79C8E',
  nocheLago: '#0F1C2E',
  nocheLagoMedio: '#172A42',
  nocheLagoClaro: '#2A4262',
  blanco: '#FFFFFF',
} as const;

export type Modo = 'claro' | 'oscuro';

export const Temas = {
  claro: {
    fondo: Tinte.algodon,
    superficie: '#FFFDF8',
    superficieAlt: Tinte.algodonOscuro,
    borde: Tinte.arena,
    texto: Tinte.cafe,
    textoSecundario: Tinte.cafeMedio,
    primario: Tinte.anil,
    primarioPresionado: Tinte.anilProfundo,
    sobrePrimario: Tinte.blanco,
    precio: Tinte.cochinilla,
    acento: Tinte.achiote,
    enlace: Tinte.anil,
    chipActivoFondo: Tinte.anil,
    chipActivoTexto: Tinte.blanco,
    barraFondo: 'rgba(247,241,229,0.97)',
    sombra: 'rgba(46,38,32,0.10)',
  },
  oscuro: {
    fondo: Tinte.nocheLago,
    superficie: Tinte.nocheLagoMedio,
    superficieAlt: '#1E3450',
    borde: Tinte.nocheLagoClaro,
    texto: '#F3ECDF',
    textoSecundario: '#B9C3D0',
    primario: Tinte.achiote,
    primarioPresionado: '#B96C1F',
    sobrePrimario: '#1B140F',
    precio: '#F0A08F',
    acento: '#E9A25A',
    enlace: '#F2B36B',
    chipActivoFondo: '#F3ECDF',
    chipActivoTexto: Tinte.nocheLago,
    barraFondo: 'rgba(15,28,46,0.97)',
    sombra: 'rgba(0,0,0,0.35)',
  },
} as const;

export type ColoresTema = { [K in keyof typeof Temas.claro]: string };

// Familias cargadas con @expo-google-fonts en el layout raíz (en nativo, una familia por peso).
export const Fuentes = {
  titulo: 'Fraunces_600SemiBold',
  tituloFuerte: 'Fraunces_700Bold',
  cuerpo: 'Inter_400Regular',
  medio: 'Inter_600SemiBold',
  fuerte: 'Inter_700Bold',
} as const;

// Alias para las pantallas del personal (siempre en claro) y la cocina (siempre oscura).
export const Paleta = {
  rojo: Tinte.cochinilla,
  rojoOscuro: Tinte.cochinillaOscura,
  rojoSuave: Tinte.cochinillaSuave,
  carbon: Tinte.cafe,
  carbonMedio: Tinte.nocheLagoMedio,
  carbonClaro: Tinte.nocheLagoClaro,
  ambar: Tinte.achiote,
  ambarSuave: Tinte.achioteSuave,
  crema: Tinte.algodon,
  cremaCuero: Tinte.algodonOscuro,
  concreto: Tinte.piedra,
  concretoClaro: Tinte.arena,
  lago: Tinte.anil,
  lagoClaro: Tinte.anilClaro,
  lagoSuave: Tinte.anilSuave,
  verde: Tinte.aguacate,
  verdeSuave: Tinte.aguacateSuave,
  blanco: Tinte.blanco,
} as const;

export const Colores = {
  ...Temas.claro,
  error: Tinte.cochinillaOscura,
  exito: Tinte.aguacateOscuro,
  kdsFondo: Tinte.nocheLago,
  kdsTarjeta: Tinte.nocheLagoMedio,
  kdsBorde: Tinte.nocheLagoClaro,
  kdsTexto: '#F3ECDF',
  kdsTextoSec: '#B9C3D0',
} as const;

export type EstadoOrden = 'recibido' | 'confirmado' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado';

// Cada estado lleva ícono + texto: nunca depender solo del color.
export const Estados: Record<EstadoOrden, { etiqueta: string; etiquetaEn: string; Icono: LucideIcon; fondo: string; texto: string }> = {
  recibido: { etiqueta: 'Recibido', etiquetaEn: 'Received', Icono: CircleDot, fondo: Tinte.anilSuave, texto: Tinte.anil },
  confirmado: { etiqueta: 'Confirmado', etiquetaEn: 'Confirmed', Icono: Check, fondo: Tinte.algodonOscuro, texto: Tinte.cafe },
  en_preparacion: { etiqueta: 'En preparación', etiquetaEn: 'Cooking', Icono: ChefHat, fondo: Tinte.achioteSuave, texto: '#7A4511' },
  listo: { etiqueta: 'Listo', etiquetaEn: 'Ready', Icono: BellRing, fondo: Tinte.aguacateSuave, texto: Tinte.aguacateOscuro },
  entregado: { etiqueta: 'Entregado', etiquetaEn: 'Served', Icono: CheckCheck, fondo: Tinte.arena, texto: Tinte.cafe },
  cancelado: { etiqueta: 'Cancelado', etiquetaEn: 'Cancelled', Icono: Ban, fondo: Tinte.cochinillaSuave, texto: Tinte.cochinillaOscura },
};

export const Espacio = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;
export const Radio = { s: 8, m: 12, l: 18, pill: 999 } as const;
export const AnchoMax = 720;
