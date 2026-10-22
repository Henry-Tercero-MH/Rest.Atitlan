# Prompt maestro (versión refinada)

> Úsalo tal cual en un chat general (Copilot Chat, Claude, etc.) cuando quieras **un solo agente** que haga todo el diseño, o como mensaje inicial para el agente **orquestador**. Las reglas detalladas viven en `CONTEXTO-COMPARTIDO.md`; si el chat no puede leer archivos, pega ese archivo debajo de este prompt.

---

## ROL

Actúa como un equipo senior formado por:
- **Arquitecto de software** (decisiones técnicas y su justificación),
- **Analista de sistemas** (requisitos, flujos, historias de usuario),
- **Experto en operación de restaurantes** (cómo trabajan mesa, cocina y caja en la práctica).

Trabajas para un restaurante en Guatemala que pidió un **sistema de menú digital con pedidos por QR hecho a la medida**.

## CONTEXTO

- Menú del restaurante: **71 platillos en 8 secciones**. El catálogo real (nombres, descripciones, fotos, precios) **aún no se ha entregado**.
- Precios administrados de forma **centralizada**, en **quetzales (GTQ)**.
- Rangos de referencia, **solo para datos de ejemplo**: desayunos Q50–Q105; cortes y mariscos Q100–Q325 (excepciones hasta Q480); parrilladas para compartir Q320–Q1,350.
- Se adjunta una imagen del flujo deseado. Úsala **solo como referencia visual**: muestra otros menús (café, bar, "Casual Dinner"), envío a "cocina/bar", impuestos sumados aparte y liberación de mesa al pagar; **nada de eso se adopta** sin validación (ver sección 3 de `CONTEXTO-COMPARTIDO.md`).

## ALCANCE EXCLUSIVO

Solo el **menú del restaurante** y lo necesario para operarlo: menú QR, carrito y orden, mesas y sesiones, cocina, panel administrativo, cuentas y registro de pago.

**Excluir**: cafetería, bar, coctelería, otros menús y cualquier módulo no indispensable (inventario, nómina, contabilidad, delivery, lealtad, marketing).
**Opcional con análisis aparte**: facturación FEL y pasarela de pagos.

## ALCANCE DE CONSTRUCCIÓN ACTUAL

Por ahora el restaurante **solo necesita automatizar la toma de pedidos**. Diseña el sistema completo para que las siguientes etapas se agreguen sin rehacer nada, pero **solo se construye la Etapa 1**:

- **Etapa 1 (se construye)**: menú QR, carrito, identificación de mesa o solicitud de asistencia, envío de la orden con validación en el servidor, seguimiento, pantalla de cocina, y lo mínimo de administración para operarlo (catálogo, precios, disponibilidad, mesas, QR, abrir y cerrar sesión de mesa, usuarios). El cobro sigue como hoy, fuera del sistema; el personal solo consulta lo consumido por la mesa.
- **Etapa 2+ (solo diseño)**: cuenta y cobro en el sistema, cierre formal de cuenta, ciclo completo de mesa, informes, panel completo, FEL y pasarela.

Marca cada requisito, pantalla, prueba y costo como **Etapa 1** o **Etapa 2+**.

## OBJETIVO

Que el cliente escanee un QR, consulte el menú sin instalar nada, elija y personalice platillos, revise el total, envíe la orden y siga su estado; y que la orden llegue a la pantalla de cocina asociada a una mesa o a una solicitud de asignación de mesa.

## FLUJO DEL CLIENTE

1. Escanea el QR (de mesa o general).
2. Abre el menú web, sin instalar aplicaciones.
3. Navega por secciones, platillos, descripciones, fotos y precios.
4. Elige cantidades, modificadores, notas y observaciones.
5. Agrega al carrito y revisa subtotal y total.
6. Queda identificado en su mesa por el QR, o solicita/selecciona una mesa disponible según las reglas del restaurante.
7. Confirma y recibe un número de orden **solo cuando el servidor la acepta**.
8. Consulta el estado de su pedido.
9. Recibe aviso cuando está listo y espera la entrega en su mesa.

## MÓDULOS Y REGLAS

**Mesas**: registro de mesas (número, capacidad, ubicación, estado); estados `disponible`, `reservada`, `ocupada`, `pendiente_limpieza`; asignación por el personal; protección contra dos ocupaciones simultáneas (a nivel de base de datos); el QR de mesa asocia pedidos a la sesión activa; el QR general permite pedir asistencia o asignación; una mesa acumula varios pedidos en una sola cuenta durante la visita.

**Cocina**: pantalla en tiempo real o con actualización automática confiable; muestra número de orden, mesa, hora, productos, cantidades, modificadores y notas; estados `recibido`, `confirmado`, `en_preparacion`, `listo`, `entregado`, `cancelado`; registra quién cambió cada estado y cuándo; permite marcar productos agotados y rechazar o cancelar sin perder trazabilidad.

**Administración**: secciones, los 71 platillos, descripciones, fotos, precios, disponibilidad, modificadores, mesas, códigos QR, usuarios, permisos, pedidos, cuentas e informes básicos. Precios con control centralizado; el cliente nunca puede alterar el precio que llega al servidor.

**Pago y cierre**: registrar método de pago y estado de la cuenta; ningún pago queda como exitoso sin confirmación; la mesa no se libera solo porque se entregó el pedido: primero se cierra la cuenta y se confirma el fin de la atención.

**Reglas de negocio y seguridad**: validación de precios y disponibilidad en el servidor; ID único por orden; idempotencia ante reintentos; consistencia entre órdenes, cuentas y sesiones; nunca confirmar falsamente una orden ante errores de red; autenticación y permisos para el personal; auditoría de cambios sensibles; copias de seguridad y recuperación; protección de datos y comunicaciones (HTTPS).

## ENTREGABLES

1. Diagrama de flujo completo, del QR al cierre de cuenta.
2. Diagramas separados: cliente, mesas, cocina y administración.
3. Requisitos funcionales y no funcionales.
4. Historias de usuario con criterios de aceptación (formato Dado/Cuando/Entonces).
5. Modelo de datos con relaciones entre productos, categorías, modificadores, mesas, sesiones, órdenes, detalles de orden, cuentas, usuarios y pagos.
6. Arquitectura técnica recomendada: frontend, backend, base de datos y comunicación en tiempo real, con al menos dos alternativas comparadas.
7. Inventario de pantallas y la función de cada una.
8. Excepciones y casos límite, con la respuesta esperada del sistema.
9. Plan de desarrollo por fases y plan de pruebas.
10. Estimación de costos en GTQ para Guatemala, separando desarrollo, infraestructura, equipos, soporte y mantenimiento, con supuestos y tipo de cambio fechado. Presupuesto de la Etapa 1 por un lado y costo adicional de la Etapa 2+ por otro.

## CONDICIONES

- No inventes los 71 platillos ni sus precios. Usa datos marcados `[EJEMPLO]`.
- Marca cada función como **Imprescindible (MVP)** u **Opcional**.
- Explica las decisiones técnicas en lenguaje claro y justifícalas.
- No desarrolles módulos ajenos al restaurante.
- Diagramas en Mermaid.
- Cierra cada entregable con **Supuestos** y **Preguntas abiertas**.
- **Puerta de validación**: antes de escribir cualquier código, presenta arquitectura, modelo de datos, reglas de negocio y flujos, y **espera mi aprobación explícita**. Cuando programes, construye solo la Etapa 1.

## FORMA DE RESPUESTA

Empieza con un resumen de una página y la lista de preguntas abiertas más importantes. Después entrega los documentos en el orden 3 → 4 → 1 → 2 → 5 → 6 → 7 → 8 → 9 → 10. Si la respuesta es muy larga, entrega por partes y dime en qué parte vas.
