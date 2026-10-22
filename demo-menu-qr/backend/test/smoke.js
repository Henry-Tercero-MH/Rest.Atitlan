// Prueba de humo del flujo Etapa 1 contra un API en marcha (API_URL, por defecto http://localhost:4000).
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const API = (process.env.API_URL || 'http://localhost:4000') + '/api';
const MESA = 'demo-m4-t5n1';

async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

const ok = (msg) => console.log(`  ✓ ${msg}`);

const menu = await call('/menu');
assert.equal(menu.status, 200);
assert.equal(menu.data.secciones.length, 8);
ok('menú con 8 secciones');

const corte = menu.data.secciones.find((s) => s.nombre === 'Platos típicos').productos[0];
const termino = corte.grupos.find((g) => g.min_sel === 1);
const extra = corte.grupos.find((g) => g.min_sel === 0).opciones.find((o) => o.precio_extra_centavos > 0);

const sinTermino = await call('/ordenes', {
  method: 'POST',
  body: { qr_token: MESA, idempotency_key: randomUUID(), lineas: [{ producto_id: corte.id, cantidad: 1 }] },
});
assert.equal(sinTermino.status, 400);
ok('rechaza modificador obligatorio faltante');

const clave = randomUUID();
const cuerpo = {
  qr_token: MESA,
  idempotency_key: clave,
  // precio_centavos manipulado por el cliente: debe ignorarse
  lineas: [{ producto_id: corte.id, cantidad: 2, modificadores: [termino.opciones[0].id, extra.id], nota: 'sin sal', precio_centavos: 1 }],
};
const [a, b] = await Promise.all([call('/ordenes', { method: 'POST', body: cuerpo }), call('/ordenes', { method: 'POST', body: cuerpo })]);
assert.ok([200, 201].includes(a.status) && [200, 201].includes(b.status), JSON.stringify([a, b]));
assert.equal(a.data.orden.id, b.data.orden.id);
ok(`idempotencia: dos envíos simultáneos → una sola orden ${a.data.orden.numero_visible}`);

const esperado = (corte.precio_centavos + extra.precio_extra_centavos) * 2;
assert.equal(a.data.orden.total_centavos, esperado);
ok(`total recalculado en servidor (${esperado / 100} GTQ)`);

const login = await call('/auth/login', { method: 'POST', body: { usuario: 'cocina', pin: '1111' } });
assert.equal(login.status, 200);
const token = login.data.token;
assert.equal((await call('/auth/login', { method: 'POST', body: { usuario: 'cocina', pin: '0000' } })).status, 401);
ok('login de cocina (y PIN incorrecto rechazado)');

assert.equal((await call('/cocina/ordenes')).status, 401);
const kds = await call('/cocina/ordenes', { token });
assert.ok(kds.data.ordenes.some((o) => o.id === a.data.orden.id));
ok('la orden aparece en cocina; sin sesión → 401');

const id = a.data.orden.id;
assert.equal((await call(`/ordenes/${id}/estado`, { method: 'PATCH', token, body: { estado: 'listo' } })).status, 409);
for (const e of ['confirmado', 'en_preparacion', 'listo']) {
  const r = await call(`/ordenes/${id}/estado`, { method: 'PATCH', token, body: { estado: e } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
}
assert.equal((await call(`/ordenes/${id}`)).data.orden.estado, 'listo');
ok('transiciones válidas; salto de estado rechazado');

const p = menu.data.secciones[0].productos[0];
assert.equal((await call(`/admin/productos/${p.id}`, { method: 'PATCH', token, body: { precio_centavos: 1 } })).status, 403);
assert.equal((await call(`/admin/productos/${p.id}`, { method: 'PATCH', token, body: { disponible: false } })).status, 200);
const agotado = await call('/ordenes', {
  method: 'POST',
  body: { qr_token: MESA, idempotency_key: randomUUID(), lineas: [{ producto_id: p.id, cantidad: 1, modificadores: [] }] },
});
assert.equal(agotado.status, 409);
assert.deepEqual(agotado.data.agotados, [p.id]);
await call(`/admin/productos/${p.id}`, { method: 'PATCH', token, body: { disponible: true } });
ok('cocina marca agotado (no puede cambiar precio) y el servidor rechaza el pedido');

const visita = await call(`/mesas/qr/${MESA}/ordenes`);
assert.equal(visita.data.total_centavos, esperado);
ok('consumo de la visita de la mesa');

assert.equal((await call('/mesas/qr/no-existe')).status, 404);
ok('QR inválido → 404');

console.log('\nTodo OK');
