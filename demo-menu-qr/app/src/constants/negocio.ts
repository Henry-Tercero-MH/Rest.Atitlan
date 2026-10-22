// Datos del negocio en un solo lugar para actualizarlos fácil.
// [EJEMPLO]: reemplazar con los datos reales del restaurante (docs/PREGUNTAS-ABIERTAS.md #9).
export const Negocio = {
  nombre: 'Atitlán Rest. & Café',
  lugar: 'San Juan La Laguna, Sololá',
  horario: { es: 'Lunes a domingo · 7:00 a 21:00 [EJEMPLO]', en: 'Monday to Sunday · 7:00 am – 9:00 pm [EXAMPLE]' },
  direccion: 'Calle principal hacia el muelle, San Juan La Laguna [EJEMPLO]',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=San+Juan+La+Laguna+Atitlan',
  whatsapp: '50200000000', // [EJEMPLO] número con código de país, sin «+»
  instagram: 'https://instagram.com/', // [EJEMPLO]
  facebook: 'https://facebook.com/', // [EJEMPLO]
  wifi: { red: 'Atitlan-Clientes [EJEMPLO]', clave: 'lago2026 [EJEMPLO]' },
} as const;
