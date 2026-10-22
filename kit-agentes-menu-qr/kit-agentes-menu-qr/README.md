# Kit de agentes expertos: Menú digital QR del restaurante

Este kit contiene el **prompt maestro refinado** y **12 agentes expertos** listos para usar en VS Code, tanto con **GitHub Copilot (agentes personalizados)** como con **Claude Code (subagentes)**. Todo está en español y comparte las mismas reglas: solo el menú del restaurante, datos de ejemplo marcados y **arquitectura aprobada antes de escribir código**.

**Diseño completo, construcción por etapas.** Los agentes diseñan el sistema completo, pero por ahora solo construyen la **Etapa 1: toma de pedidos** (menú QR, carrito, mesa, envío de orden, seguimiento, cocina y lo mínimo de administración). El cobro, el cierre de cuenta y los informes quedan diseñados como **Etapa 2+**. El detalle está en `CONTEXTO-COMPARTIDO.md`, sección 2.1.

## 1. Qué hay en la carpeta

```
kit-agentes-menu-qr/
├── README.md                     ← este archivo
├── PROMPT-MAESTRO.md             ← tu prompt original, refinado (uso en un solo chat)
├── CONTEXTO-COMPARTIDO.md        ← reglas globales que leen todos los agentes (fuente única)
├── agentes/                      ← los 12 prompts en texto plano (para leer o copiar a cualquier IA)
├── .github/
│   ├── copilot-instructions.md   ← reglas globales que Copilot carga siempre
│   └── agents/*.agent.md         ← agentes personalizados de Copilot
├── .claude/
│   └── agents/*.md               ← subagentes de Claude Code
├── CLAUDE.md                     ← reglas globales que Claude Code carga siempre
└── docs/
    ├── APROBACIONES.md           ← la "puerta": tú marcas qué está aprobado
    ├── PREGUNTAS-ABIERTAS.md     ← preguntas para el restaurante
    └── referencia/flujo-referencia.jpeg  ← tu imagen, solo como referencia visual
```

> Las carpetas `.github` y `.claude` empiezan con punto y algunos sistemas las ocultan. En VS Code se ven normalmente en el explorador.

## 2. Los agentes

| # | Agente | Qué hace | Fase |
|---|---|---|---|
| 0 | `orquestador` | Dice qué sigue, revisa entregables, vigila alcance y aprobaciones | Siempre |
| 1 | `analista-requisitos` | Requisitos, historias de usuario, diagramas de flujo | A |
| 2 | `experto-operacion-restaurante` | Reglas de negocio, procesos reales, casos límite operativos | A |
| 3 | `modelo-datos` | Modelo entidad-relación, restricciones, datos de ejemplo, plantilla del catálogo | A (B: migraciones) |
| 4 | `arquitecto-software` | Arquitectura comparando alternativas, plan por fases | A |
| 5 | `backend-tiempo-real` | API, idempotencia, concurrencia de mesas, tiempo real | A y B |
| 6 | `seguridad` | Modelo de amenazas, permisos, auditoría, respaldos | A (B: revisión) |
| 7 | `frontend-cliente-qr` | Pantallas del cliente en el celular | A y B |
| 8 | `cocina-kds` | Pantalla de cocina | A y B |
| 9 | `panel-administrativo` | Panel de gestión, mesas, caja, informes | A y B |
| 10 | `qa-pruebas` | Plan y casos de prueba, piloto | A y B |
| 11 | `costos-guatemala` | Estimación en GTQ | A |
| 12 | `disenador-ui-marca` | Identidad visual, tokens, íconos, accesibilidad | A y B |

**Fase A** = solo documentos. **Fase B** = código, y solo cuando `docs/APROBACIONES.md` lo habilita.

## 3. Cómo instalarlo

1. Crea una carpeta para el proyecto (o usa tu repositorio) y copia **todo el contenido** de `kit-agentes-menu-qr/` en la raíz.
2. Ábrela en VS Code (`Archivo → Abrir carpeta`).
3. Sigue la opción de la herramienta que uses (puedes tener ambas).

### Opción A: GitHub Copilot en VS Code

1. Ten instalada la extensión **GitHub Copilot Chat** y VS Code actualizado.
2. Abre el panel de chat (`Ctrl+Alt+I` en Windows/Linux, `⌃⌘I` en Mac).
3. En el selector de agente/modo del chat (donde dice *Agent*, *Ask*, *Edit*) aparecerán los agentes de `.github/agents/` con su nombre de archivo: `orquestador`, `analista-requisitos`, etc. Elige uno y escribe tu mensaje.
4. `.github/copilot-instructions.md` se aplica a todos los chats del proyecto, así que las reglas globales siempre están presentes.

> Si tu versión de VS Code es anterior y no muestra los agentes, renombra la carpeta `.github/agents` a `.github/chatmodes` y la extensión de cada archivo de `.agent.md` a `.chatmode.md`. Para revisar la configuración: paleta de comandos (`Ctrl+Shift+P`) → busca "agent" o "chat mode".

Si quieres limitar herramientas por agente (por ejemplo, que los de Fase A no ejecuten comandos), agrega en el encabezado del archivo una línea `tools: [...]` con los nombres que muestre tu VS Code en el selector de herramientas del chat.

### Opción B: Claude Code (extensión de VS Code o terminal)

1. Instala la extensión **Claude Code** o usa `claude` en la terminal integrada, dentro de la carpeta del proyecto.
2. `CLAUDE.md` se carga solo al iniciar, con las reglas globales.
3. Escribe `/agents` para ver los 12 subagentes de `.claude/agents/`.
4. Para usar uno, pídelo por nombre: *"Usa el agente analista-requisitos para redactar los requisitos"*. También puedes mencionarlo con `@`.
5. Los agentes de Fase A tienen permisos para leer y escribir documentos, pero no para ejecutar comandos; los de construcción sí pueden.

### Opción C: cualquier otra IA

Copia `PROMPT-MAESTRO.md` (y pega debajo `CONTEXTO-COMPARTIDO.md`) en un chat. O usa un archivo de `agentes/` por conversación, pegando primero el contexto compartido.

## 4. Orden de trabajo recomendado

### Fase A: diseño (sin código)

| Paso | Agente | Mensaje sugerido |
|---|---|---|
| 1 | `orquestador` | "Inicia el proyecto: crea la estructura de `docs/`, revisa las preguntas abiertas y dime el primer paso." |
| 2 | `analista-requisitos` | "Redacta requisitos e historias de usuario. Luego el flujo general y los cuatro flujos separados." |
| 3 | `experto-operacion-restaurante` | "Revisa los flujos y redacta las reglas de negocio, procesos operativos y casos límite." |
| 4 | `modelo-datos` | "Diseña el modelo de datos, las restricciones y la plantilla del catálogo real." |
| 5 | `arquitecto-software` | "Propón la arquitectura con alternativas comparadas y el plan por fases." |
| 6 | `backend-tiempo-real` | "Diseña la API, la creación de órdenes con idempotencia, la concurrencia de mesas y el tiempo real." |
| 7 | `seguridad` | "Haz el modelo de amenazas y completa la columna de seguridad de los casos límite." |
| 8 | `frontend-cliente-qr`, `cocina-kds`, `panel-administrativo` | "Haz el inventario de pantallas de tu módulo." |
| 9 | `qa-pruebas` | "Escribe el plan de pruebas, los casos de prueba y el plan de piloto." |
| 10 | `costos-guatemala` | "Estima los costos en GTQ con tres escenarios." |
| 11 | `orquestador` | "Revisa todo, señala contradicciones y prepara el resumen para aprobación." |

### Puerta de validación (tú decides)

1. Lee los cuatro documentos clave: reglas de negocio, flujos, modelo de datos y arquitectura.
2. Pide correcciones al agente responsable si hace falta.
3. Cuando estés conforme, edita `docs/APROBACIONES.md`: pon **APROBADO** con fecha en cada uno y cambia "Fase B (código) habilitada" a **SÍ**.

Los agentes de construcción revisan ese archivo antes de programar y se detienen si falta algo. El mismo archivo dice qué etapa se puede construir; cuando quieras pasar a la Etapa 2, cambia esa línea.

### Fase B: construcción

Sigue la parte de la **Etapa 1** de `docs/08-plan/plan-fases.md`. Para cada fase: `backend-tiempo-real` → `frontend-cliente-qr` / `cocina-kds` / `panel-administrativo` → `qa-pruebas` → `seguridad` (revisión) → `orquestador` (cierre de fase).

## 5. Consejos

- **Un agente por conversación**: abre un chat nuevo para cada paso; los documentos en `docs/` son la memoria compartida entre agentes.
- **Responde las preguntas abiertas** en `docs/PREGUNTAS-ABIERTAS.md` en cuanto puedas; muchas decisiones dependen de ellas (IVA, propina, número de mesas).
- **Catálogo real**: cuando lo tengas, llénalo en la plantilla que genera `modelo-datos` y pídele que reemplace los datos `[EJEMPLO]`.
- **Si cambias reglas globales**, edita `CONTEXTO-COMPARTIDO.md` y copia el mismo contenido en `CLAUDE.md` y `.github/copilot-instructions.md`.
- **Si editas un agente**, la versión de texto está en `agentes/`; replica el cambio en `.github/agents/` y `.claude/agents/` (el cuerpo es el mismo, solo cambia el encabezado).

## 6. Decisiones que tomé al refinar tu prompt

- Las diferencias entre la imagen y tu pedido se resolvieron a favor del pedido: sin selector de 4 menús, sin bar, sin impuestos sumados por defecto y sin liberar la mesa al pagar. Están listadas en `CONTEXTO-COMPARTIDO.md`, sección 3.
- Se fijaron nombres oficiales de estados para mesa, sesión, orden, línea, cuenta y pago, para que todos los agentes hablen igual.
- El panel administrativo tiene su propio agente (`panel-administrativo`) porque es un módulo grande, separado de la web del cliente y de cocina.
- Como por ahora solo se automatiza la toma de pedidos, cada agente marca su trabajo como Etapa 1 o Etapa 2+, y los de construcción no programan nada de la Etapa 2+.
- La "validación antes del código" ahora es un mecanismo concreto: el archivo `docs/APROBACIONES.md`, que solo tú editas.
