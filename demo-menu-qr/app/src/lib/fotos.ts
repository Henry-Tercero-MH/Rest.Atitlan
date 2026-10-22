import type { ImageSourcePropType } from 'react-native';

// Fotos incluidas en la app (mismo nombre de archivo que en el API/Supabase).
// Cargan sin red y sirven al modo demo; si una ruta no está aquí se pide por URL.
export const FOTOS_INCLUIDAS: Record<string, ImageSourcePropType> = {
  'chilaquiles.webp': require('@/assets/fotos/chilaquiles.webp'),
  'carne-asada.webp': require('@/assets/fotos/carne-asada.webp'),
  'tacos-al-pastor.webp': require('@/assets/fotos/tacos-al-pastor.webp'),
  'camarones-empanizados.webp': require('@/assets/fotos/camarones-empanizados.webp'),
  'papas-fritas.webp': require('@/assets/fotos/papas-fritas.webp'),
  'ensalada-de-la-casa.webp': require('@/assets/fotos/ensalada-de-la-casa.webp'),
};
