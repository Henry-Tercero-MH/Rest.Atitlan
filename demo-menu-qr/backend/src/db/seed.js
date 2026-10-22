// Datos de EJEMPLO para el demo de «Atitlán Rest. & Café».
// Son platillos típicos de referencia con precios de ejemplo: NO son el catálogo real del restaurante.
import { hashPin } from '../auth.js';

// Etiquetas: v = vegetariano, p = picante, r = recomendado de la casa, l = sabor local
const MENU = [
  {
    nombre: 'Desayunos', en: 'Breakfast', acompanamiento: true,
    platos: [
      ['Chilaquiles', 'Chilaquiles', 'Totopos bañados en salsa verde con crema, queso fresco, cebolla y aguacate.', 'Tortilla chips in green salsa with cream, fresh cheese, onion and avocado.', 5500, 'vr'],
      ['Desayuno chapín', 'Guatemalan breakfast', 'Huevos al gusto, frijoles volteados, plátano frito, crema y tortillas.', 'Eggs your way, refried beans, fried plantain, cream and tortillas.', 5500, 'rl'],
      ['Panqueques con miel local', 'Pancakes with local honey', 'Tres panqueques esponjosos con miel de San Juan y fruta.', 'Three fluffy pancakes with San Juan honey and fruit.', 5000, 'v'],
      ['Huevos rancheros', 'Huevos rancheros', 'Huevos estrellados sobre tortilla con salsa de tomate y chile.', 'Fried eggs on tortilla with tomato and chili sauce.', 5500, 'vp'],
      ['Omelette del huerto', 'Garden omelette', 'Omelette con vegetales frescos, queso y pan tostado.', 'Omelette with fresh vegetables, cheese and toast.', 6000, 'v'],
    ],
  },
  {
    nombre: 'Platos típicos', en: 'Traditional dishes', acompanamiento: true,
    platos: [
      ['Carne asada', 'Grilled steak', 'Corte de res a la parrilla con chirmol, guacamol, frijoles y tortillas.', 'Grilled beef with chirmol salsa, guacamole, beans and tortillas.', 12500, 'r'],
      ['Pepián de pollo', 'Chicken pepián', 'Recado de semillas tostadas y chiles, con arroz y tamalito.', 'Toasted seed and chili stew, with rice and tamalito.', 9500, 'rl'],
      ['Jocón', 'Jocón', 'Pollo en salsa verde de miltomate y cilantro.', 'Chicken in green tomatillo and cilantro sauce.', 9000, 'l'],
      ['Tamalitos de chipilín', 'Chipilín tamales', 'Tamalitos de masa con hojas de chipilín y salsa de tomate.', 'Corn tamales with chipilín leaves and tomato sauce.', 4000, 'vl'],
      ['Hilachas', 'Hilachas', 'Carne de res deshilachada en salsa de tomate y guaque.', 'Shredded beef in tomato and guajillo sauce.', 8500, 'p'],
    ],
  },
  {
    nombre: 'Del lago', en: 'From the lake', acompanamiento: true,
    platos: [
      ['Mojarra frita del lago', 'Fried lake mojarra', 'Mojarra entera dorada, con ensalada, arroz y tortillas.', 'Whole golden-fried mojarra with salad, rice and tortillas.', 11000, 'rl'],
      ['Ceviche de camarón', 'Shrimp ceviche', 'Camarón curtido en limón con tomate, cebolla y chile.', 'Lime-cured shrimp with tomato, onion and chili.', 10500, 'p'],
      ['Filete de pescado al ajillo', 'Garlic fish fillet', 'Filete a la plancha con mantequilla de ajo y vegetales.', 'Grilled fillet with garlic butter and vegetables.', 12000, ''],
      ['Camarones empanizados', 'Breaded shrimp', 'Camarones dorados y crujientes, con salsa de la casa y limón.', 'Crispy golden shrimp with house sauce and lime.', 11500, ''],
    ],
  },
  {
    nombre: 'Para compartir', en: 'To share',
    platos: [
      ['Tacos al pastor', 'Tacos al pastor', 'Orden de cuatro tacos de cerdo adobado con piña, cebolla y cilantro.', 'Four marinated pork tacos with pineapple, onion and cilantro.', 6000, 'p'],
      ['Papas fritas', 'French fries', 'Papas cortadas a mano, doradas y con sal de mar.', 'Hand-cut fries, golden and sprinkled with sea salt.', 3000, 'v'],
    ],
  },
  {
    nombre: 'Vegetariano', en: 'Vegetarian',
    platos: [
      ['Ensalada de la casa', 'House salad', 'Nuestro platillo especial: elote, chile, cebolla morada y cilantro, con guacamol.', 'Our signature dish: sweet corn, chili, red onion and cilantro, with guacamole.', 6500, 'vr'],
      ['Pepián de vegetales', 'Vegetable pepián', 'Güisquil, papa y ejote en recado de pepián, con arroz.', 'Chayote, potato and green beans in pepián sauce, with rice.', 8000, 'vl'],
      ['Ensalada del huerto', 'Garden salad', 'Hojas verdes, aguacate, tomate y semillas con vinagreta de miel.', 'Greens, avocado, tomato and seeds with honey vinaigrette.', 5500, 'v'],
      ['Tacos de hongos', 'Mushroom tacos', 'Hongos salteados con cebolla y chile, en tortilla de maíz.', 'Sautéed mushrooms with onion and chili on corn tortillas.', 6500, 'vp'],
    ],
  },
  {
    nombre: 'Bebidas', en: 'Drinks',
    platos: [
      ['Limonada con chía', 'Chia lemonade', 'Limonada natural con semillas de chía.', 'Fresh lemonade with chia seeds.', 2000, 'v'],
      ['Rosa de Jamaica', 'Hibiscus water', 'Agua fresca de flor de Jamaica.', 'Chilled hibiscus flower drink.', 1800, 'v'],
      ['Licuado de frutas', 'Fruit smoothie', 'Fruta de temporada con leche o agua.', 'Seasonal fruit with milk or water.', 2500, 'v'],
    ],
  },
  {
    nombre: 'Café de San Juan', en: 'San Juan coffee', leche: true,
    platos: [
      ['Café de altura de San Juan', 'San Juan highland coffee', 'Café de la cooperativa local, tostado y molido aquí.', 'Local cooperative coffee, roasted and ground here.', 2000, 'vrl'],
      ['Capuchino', 'Cappuccino', 'Espresso con leche espumada.', 'Espresso with steamed milk foam.', 2500, 'v'],
      ['Café de olla', 'Café de olla', 'Café con canela y panela, servido en jarrito de barro.', 'Coffee with cinnamon and raw sugar, served in a clay cup.', 2000, 'v'],
    ],
  },
  {
    nombre: 'Postres', en: 'Desserts',
    platos: [
      ['Plátanos en mole', 'Plantains in mole', 'Plátano maduro en mole dulce de chocolate y semillas.', 'Ripe plantain in sweet chocolate and seed mole.', 3500, 'vl'],
      ['Rellenitos de plátano', 'Plantain rellenitos', 'Masa de plátano rellena de frijol dulce y chocolate.', 'Plantain dough filled with sweet beans and chocolate.', 3000, 'v'],
      ['Miel local con queso fresco', 'Local honey with fresh cheese', 'Miel de abejas de San Juan con queso fresco y pan.', 'San Juan bee honey with fresh cheese and bread.', 3500, 'vl'],
    ],
  },
];

// Fotos entregadas por el restaurante: WebP en backend/public/fotos (en producción, bucket de Supabase con la misma ruta).
const FOTOS_LOCALES = {
  Chilaquiles: 'chilaquiles.webp',
  'Carne asada': 'carne-asada.webp',
  'Camarones empanizados': 'camarones-empanizados.webp',
  'Ensalada de la casa': 'ensalada-de-la-casa.webp',
  'Tacos al pastor': 'tacos-al-pastor.webp',
  'Papas fritas': 'papas-fritas.webp',
};

// Mientras no haya foto de cada platillo, se repiten las fotos propias SOLO como referencia visual,
// elegidas por afinidad con la sección. Reemplazar cuando el restaurante entregue el resto.
const TODAS = Object.values(FOTOS_LOCALES);
const REFERENCIA_POR_SECCION = {
  Desayunos: ['chilaquiles.webp'],
  'Platos típicos': ['carne-asada.webp', 'tacos-al-pastor.webp'],
  'Del lago': ['camarones-empanizados.webp'],
  'Para compartir': ['tacos-al-pastor.webp', 'papas-fritas.webp'],
  Vegetariano: ['ensalada-de-la-casa.webp'],
};

// imagen_path: ruta relativa, igual que en el bucket de Supabase.
const foto = (nombre, seccion, indice) => {
  if (FOTOS_LOCALES[nombre]) return FOTOS_LOCALES[nombre];
  const opciones = REFERENCIA_POR_SECCION[seccion] ?? TODAS;
  return opciones[indice % opciones.length];
};

// Tokens fijos SOLO para el demo; en producción se generan aleatorios por mesa.
export const MESAS_DEMO = [
  { numero: 'M1', capacidad: 2, area: 'Salón', qr_token: 'demo-m1-a7k2' },
  { numero: 'M2', capacidad: 4, area: 'Salón', qr_token: 'demo-m2-p9x4' },
  { numero: 'M3', capacidad: 4, area: 'Salón', qr_token: 'demo-m3-r2w8' },
  { numero: 'M4', capacidad: 6, area: 'Terraza', qr_token: 'demo-m4-t5n1' },
  { numero: 'M5', capacidad: 6, area: 'Terraza', qr_token: 'demo-m5-h3c6' },
  { numero: 'M6', capacidad: 8, area: 'Terraza (vista al lago)', qr_token: 'demo-m6-z8q3' },
];

const USUARIOS_DEMO = [
  { usuario: 'admin', nombre: '[EJEMPLO] Administración', rol: 'admin', pin: '1234' },
  { usuario: 'cocina', nombre: '[EJEMPLO] Cocina', rol: 'cocina', pin: '1111' },
  { usuario: 'mesero', nombre: '[EJEMPLO] Mesero', rol: 'mesero', pin: '2222' },
];

async function grupo(q, productoId, nombre, nombreEn, min, max, opciones) {
  const g = await q(
    'INSERT INTO grupos_modificador (producto_id, nombre, nombre_en, min_sel, max_sel) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [productoId, nombre, nombreEn, min, max],
  );
  for (const [es, en, extra = 0] of opciones) {
    await q('INSERT INTO modificadores (grupo_id, nombre, nombre_en, precio_extra_centavos) VALUES ($1, $2, $3, $4)', [
      g.rows[0].id, es, en, extra,
    ]);
  }
}

export async function seed(q) {
  const { rows } = await q('SELECT count(*)::int AS n FROM secciones');
  if (rows[0].n > 0) return false;

  for (const [si, s] of MENU.entries()) {
    const sec = await q('INSERT INTO secciones (nombre, nombre_en, orden) VALUES ($1, $2, $3) RETURNING id', [s.nombre, s.en, si + 1]);
    for (const [pi, [nombre, nombreEn, desc, descEn, precio, tags]] of s.platos.entries()) {
      const prod = await q(
        `INSERT INTO productos (seccion_id, nombre, nombre_en, descripcion, descripcion_en, precio_centavos, orden,
                                vegetariano, picante, recomendado, sabor_local, imagen_path)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
        [sec.rows[0].id, nombre, nombreEn, desc, descEn, precio, pi + 1,
          tags.includes('v'), tags.includes('p'), tags.includes('r'), tags.includes('l'), foto(nombre, s.nombre, pi)],
      );
      const id = prod.rows[0].id;
      if (s.acompanamiento) {
        await grupo(q, id, 'Acompañamiento', 'Side', 1, 1, [['Tortillas', 'Tortillas'], ['Pan francés', 'French bread']]);
        await grupo(q, id, 'Opciones', 'Options', 0, 3, [
          ['Sin cebolla', 'No onion'], ['Salsa aparte', 'Sauce on the side'], ['Extra aguacate', 'Extra avocado', 1000],
        ]);
      }
      if (s.leche) {
        await grupo(q, id, 'Leche', 'Milk', 0, 1, [['Leche entera', 'Whole milk'], ['Leche de avena', 'Oat milk', 500]]);
      }
    }
  }

  for (const m of MESAS_DEMO) {
    await q('INSERT INTO mesas (numero, capacidad, area, qr_token) VALUES ($1, $2, $3, $4)', [
      m.numero, m.capacidad, m.area, m.qr_token,
    ]);
  }

  for (const u of USUARIOS_DEMO) {
    await q('INSERT INTO usuarios (usuario, nombre, rol, pin_hash) VALUES ($1, $2, $3, $4)', [
      u.usuario, u.nombre, u.rol, await hashPin(u.pin),
    ]);
  }
  return true;
}
