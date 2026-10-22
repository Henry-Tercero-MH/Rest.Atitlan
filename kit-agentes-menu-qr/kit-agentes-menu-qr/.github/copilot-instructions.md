<!-- Generado a partir de CONTEXTO-COMPARTIDO.md. Si cambias las reglas, edita ese archivo y copia aquí. -->

# Contexto compartido y reglas globales

> Este archivo lo leen **todos** los agentes antes de trabajar. Si algo aquí contradice a un agente, gana este archivo, salvo que el responsable del proyecto indique lo contrario por escrito en `docs/APROBACIONES.md`.

## 1. Qué se diseña

Un **sistema de menú digital con pedidos por QR** para **un restaurante en Guatemala**, hecho a la medida.

El cliente escanea un QR con su celular, abre el menú en el navegador (sin instalar apps), elige platillos, los personaliza, revisa el total y envía la orden. La orden llega en tiempo real a la **pantalla de cocina** y queda asociada a una **mesa** (o a una solicitud de asignación de mesa). El personal gestiona mesas, cocina, cuentas y pagos desde paneles internos.

## 2. Alcance exclusivo (no negociable)

**Dentro del alcance**
- Menú del **restaurante**: 71 platillos en 8 secciones (el catálogo real lo entrega el cliente).
- Flujo del cliente por QR, carrito, envío de orden, seguimiento y notificación de "listo".
- Gestión de mesas, sesiones de mesa y cuentas. Las mesas son **configurables sin límite** (N mesas): número, capacidad, ubicación o área (salón, terraza, etc.), estado y QR propio; se pueden editar, desactivar y reimprimir su QR.
- Pantalla de cocina (KDS).
- Panel administrativo (catálogo, precios, disponibilidad, modificadores, mesas, QR, usuarios, permisos, pedidos, cuentas, informes básicos).
- Registro de pago y cierre de cuenta.

**Fuera del alcance (no diseñar, no programar, no estimar)**
- Cafetería, bar, coctelería, "Casual Dinner" ni cualquier otro menú distinto al del restaurante.
- Pantalla o flujo de "bar". El destino de los pedidos es **solo cocina**.
- Inventario de insumos, recetas, nómina, contabilidad, delivery, reservas en línea públicas, programas de lealtad, marketing.
- Cualquier módulo que no sea necesario para operar el restaurante.

**Opcional, solo con análisis aparte (no implementar sin aprobación)**
- Facturación electrónica **FEL** (SAT Guatemala).
- Pasarela de pagos en línea.

Si una idea no está en "Dentro del alcance", el agente **la anota como propuesta opcional** y no la desarrolla.

## 1.1 Datos ya confirmados

- El restaurante **ya tiene Wi-Fi**; no se diseña ni presupuesta red.
- El sistema es **100 % web**. Hospedaje y base de datos en un plan de **Railway**, contratado y pagado por el restaurante (no entra en el presupuesto de desarrollo).
- Las **fotos de los platillos** se guardan en **Supabase Storage** (contenedor público de solo lectura). El panel las sube optimizadas (WebP + miniatura); el menú las descarga directo de Supabase; la base de datos en Railway guarda solo la ruta. Plan Free al inicio, Pro (USD 25/mes) si se superan 5 GB de transferencia o hay pausas por inactividad.
- Mano de obra de la Etapa 1 acordada como referencia: **Q 5,000**. El equipo (tablets, impresoras térmicas, porta-QR) se presupuesta **aparte**; no incluye UPS ni red. Railway: Hobby para pruebas y piloto, Pro recomendado en producción (≈ USD 20–25 al mes).
- Se usan **tablets** para la pantalla de cocina e **impresoras térmicas de 80 mm** para comandas (cocina) y resumen de consumo (caja).

## 2.1 Diseñar completo, construir por etapas

El restaurante, **por ahora, solo necesita automatizar la toma de pedidos**. Por eso:

- **Se diseña el sistema completo** (requisitos, flujos, modelo de datos, arquitectura, pantallas) para que las etapas siguientes se agreguen **sin rehacer** lo construido.
- **Se construye solo la Etapa 1**. Lo demás queda documentado y preparado, pero no se programa.

**Etapa 1: Toma de pedidos (lo único que se construye ahora)**
- Web del cliente por QR: menú por secciones, detalle, modificadores, notas, carrito, total.
- Identificación de mesa con el QR de mesa; con el QR general, solicitud de asistencia o asignación de mesa (la atiende el personal).
- Envío de orden: validación de precios y disponibilidad en el servidor, idempotencia, número de orden.
- Seguimiento del estado del pedido y aviso de "listo".
- Pantalla de cocina: recepción en tiempo real, estados, agotados, rechazos y cancelaciones con trazabilidad.
- Lo **mínimo** de administración para que lo anterior funcione: cargar y editar el catálogo (precios y disponibilidad), registrar mesas y generar sus QR, abrir y cerrar la sesión de mesa (lo hace el personal), usuarios y roles de cocina/mesero/admin.
- Consulta (solo lectura) de lo consumido por una mesa en su visita, para que el personal cobre **con el método que ya usa hoy**.
- Auditoría de cambios de precio, disponibilidad y estados de orden.

**Etapa 2 y siguientes: diseñadas, no construidas**
- Cuenta y cobro dentro del sistema: registro de método de pago, confirmación de pago, cierre formal de cuenta.
- Ciclo completo de mesa con `pendiente_limpieza` y reservas.
- Informes, panel administrativo completo, auditoría avanzada.
- Opcionales: FEL y pasarela de pagos.

**Cómo "preparar sin construir"**
- El modelo de datos incluye desde el inicio las entidades de etapas futuras (`cuenta`, `pago`, etc.) o deja claro cómo se agregarán sin migraciones destructivas; la decisión la justifica `modelo-datos`.
- La arquitectura y la API reservan los puntos de extensión (p. ej. cada orden pertenece a una sesión de mesa a la que luego se asociará la cuenta).
- Cada requisito, historia, pantalla, prueba y costo lleva la etiqueta **Etapa 1** o **Etapa 2+**.
- En la Etapa 1, la mesa **tampoco** se libera sola al entregar el pedido: el personal cierra la sesión después de cobrar por fuera.
- Un agente de construcción que reciba un pedido de la Etapa 2+ se detiene y lo dice, salvo que `docs/APROBACIONES.md` indique que esa etapa está habilitada.

## 3. Uso de la imagen de referencia

La imagen "Flujo del menú digital – Restaurante" es **solo referencia visual del flujo y de la interfaz**. Diferencias que se deben respetar:

| La imagen muestra | Lo que se debe hacer |
|---|---|
| Pantalla con 4 menús (Restaurante, Café, Bar, Casual Dinner) | El QR abre directamente las **8 secciones del restaurante**. |
| "Envío a cocina/bar" | Envío **solo a cocina**. |
| Bebidas Q15–Q45 y "Agua natural" en el pedido | No asumir bebidas. Si el catálogo de 71 platillos incluye bebidas básicas, se tratan como productos del restaurante; si no, quedan fuera. **Pregunta abierta.** |
| "Impuestos" sumados aparte del subtotal | En Guatemala el IVA (12 %) suele estar incluido en el precio publicado. **Pregunta abierta**: confirmar si los precios incluyen IVA y si se sugiere propina. No sumar impuestos por defecto. |
| La mesa queda disponible al pagar | La mesa **no** se libera sola: cuenta cerrada → atención terminada confirmada por personal → `pendiente_limpieza` → `disponible`. |
| Platillos y precios como "Filete de res Q195" | Son ejemplos de la imagen, **no** datos reales. |

## 4. Datos de ejemplo

- **No inventar** nombres reales de platillos ni precios definitivos.
- Todo dato de prueba se marca así: nombre `[EJEMPLO] Desayuno 01`, precio `Q 75.00 (EJEMPLO)`.
- Rangos de referencia (solo para que los ejemplos sean verosímiles): desayunos Q50–Q105; cortes y mariscos Q100–Q325 (excepciones hasta Q480); parrilladas para compartir Q320–Q1,350.
- Las 8 secciones se nombran `[EJEMPLO] Sección 1` … `Sección 8` hasta recibir el catálogo real, salvo "Desayunos", "Cortes", "Mariscos" y "Parrilladas", que el contexto sí menciona.
- Moneda: **GTQ**, formato `Q 1,350.00`. Montos en la base de datos como enteros en centavos o `DECIMAL(10,2)`; nunca `float`.

## 5. Estados oficiales (usar exactamente estos nombres)

- **Mesa**: `disponible`, `reservada`, `ocupada`, `pendiente_limpieza` (opcional: `fuera_de_servicio`).
- **Sesión de mesa**: `abierta`, `cuenta_solicitada`, `cerrada`.
- **Orden**: `recibido`, `confirmado`, `en_preparacion`, `listo`, `entregado`, `cancelado`.
- **Línea de orden** (para agotados/rechazos parciales): `activa`, `rechazada`, `cancelada`.
- **Cuenta**: `abierta`, `en_cobro`, `pagada`, `anulada`.
- **Pago**: `pendiente`, `confirmado`, `rechazado`, `anulado`.

Cada agente que proponga un estado nuevo debe justificarlo y pedir aprobación.

## 6. Reglas de negocio y seguridad mínimas

1. El servidor recalcula **precios, totales y disponibilidad**. Lo que envía el cliente solo son IDs, cantidades, modificadores y notas.
2. Cada orden tiene un **identificador único** (interno, p. ej. UUID) y un **número visible** corto y legible (p. ej. `#0325`).
3. **Idempotencia**: cada envío lleva una clave de idempotencia generada en el dispositivo; un reintento nunca crea una orden duplicada.
4. **Nunca mostrar "orden enviada"** sin confirmación del servidor. Ante error de red, el cliente ve un estado claro ("no confirmada, reintentar").
5. **Concurrencia de mesas**: dos clientes no pueden abrir sesión en la misma mesa al mismo tiempo (bloqueo o restricción única a nivel de base de datos, no solo en la interfaz).
6. Una mesa tiene **como máximo una sesión abierta** y **una cuenta abierta**; una cuenta puede tener **varias órdenes**.
7. Ningún pago se marca `confirmado` sin confirmación explícita (personal o pasarela).
8. Autenticación y permisos por rol para personal (roles base: `admin`, `gerente`, `mesero`, `cocina`, `caja`).
9. **Auditoría** de cambios sensibles: precios, disponibilidad, estados de orden, cancelaciones, pagos, mesas, usuarios y permisos (quién, qué, cuándo, valor anterior y nuevo).
10. Copias de seguridad automáticas con prueba de restauración documentada.
11. HTTPS obligatorio; datos personales mínimos (no se pide nombre ni teléfono al cliente salvo que se apruebe).

## 7. Puerta de validación: arquitectura antes que código

El proyecto tiene dos fases:

- **Fase A, Diseño**: solo documentos en `docs/`. Ningún agente escribe código de la aplicación.
- **Fase B, Construcción**: solo empieza cuando `docs/APROBACIONES.md` tenga marcados como **APROBADO** estos cuatro documentos:
  1. Arquitectura (`docs/03-arquitectura/arquitectura.md`)
  2. Modelo de datos (`docs/04-datos/modelo-datos.md`)
  3. Reglas de negocio (`docs/02-operacion/reglas-negocio.md`)
  4. Flujos (`docs/05-flujos/`)

Además, en la Fase B solo se programa lo de la **etapa habilitada** en `docs/APROBACIONES.md` (al inicio, Etapa 1: toma de pedidos).

Todo agente que vaya a escribir código **debe leer primero `docs/APROBACIONES.md`**. Si falta alguna aprobación, se detiene, lo dice y ofrece trabajar en el documento pendiente. Solo la persona responsable del proyecto marca aprobaciones; un agente nunca se aprueba a sí mismo.

## 8. Forma de trabajar de todos los agentes

- Escribir en **español**, con lenguaje claro para una persona no técnica cuando se justifican decisiones.
- Distinguir siempre **Imprescindible (MVP)** y **Opcional (fase posterior)**, y marcar cada elemento como **Etapa 1** (se construye ahora) o **Etapa 2+** (solo diseño).
- Justificar cada recomendación técnica: qué se eligió, alternativas, por qué, costo/riesgo.
- Diagramas en **Mermaid** dentro de Markdown (se ven en VS Code y GitHub).
- Cerrar cada entregable con dos secciones: **Supuestos** y **Preguntas abiertas para el restaurante**.
- No sobrescribir el trabajo de otro agente: si hay que cambiar un documento ajeno, se propone el cambio en una sección "Propuestas para otros agentes".
- Cuando falte información, no inventar: registrar la pregunta en `docs/PREGUNTAS-ABIERTAS.md`.

## 9. Mapa de entregables y responsables

| # | Entregable | Agente responsable | Archivo |
|---|---|---|---|
| 1 | Diagrama de flujo completo QR → cierre de cuenta | analista-requisitos | `docs/05-flujos/flujo-general.md` |
| 2 | Diagramas separados: cliente, mesas, cocina, administración | analista-requisitos | `docs/05-flujos/flujo-*.md` |
| 3 | Requisitos funcionales y no funcionales | analista-requisitos | `docs/01-requisitos/requisitos.md` |
| 4 | Historias de usuario y criterios de aceptación | analista-requisitos | `docs/01-requisitos/historias-usuario.md` |
| 5 | Modelo de datos y relaciones | modelo-datos | `docs/04-datos/modelo-datos.md` |
| 6 | Arquitectura técnica | arquitecto-software | `docs/03-arquitectura/arquitectura.md` |
| 7 | Inventario de pantallas | frontend-cliente-qr, cocina-kds, panel-administrativo | `docs/06-pantallas/*.md` |
| 8 | Excepciones y casos límite | experto-operacion-restaurante (+ backend, seguridad) | `docs/07-excepciones/casos-limite.md` |
| 9 | Plan por fases y pruebas | arquitecto-software (fases), qa-pruebas (pruebas) | `docs/08-plan/*.md` |
| 10 | Estimación de costos en GTQ | costos-guatemala | `docs/09-costos/estimacion-costos.md` |
| — | Reglas de negocio y procesos | experto-operacion-restaurante | `docs/02-operacion/*.md` |
| — | Modelo de amenazas y controles | seguridad | `docs/10-seguridad/seguridad.md` |
| — | Tiempo real, API, idempotencia | backend-tiempo-real | `docs/03-arquitectura/api-y-tiempo-real.md` |
