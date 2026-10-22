-- DEMO - Esquema PostgreSQL del menú QR (Rest. Atitlán)
-- Incluye tablas de la Etapa 2+ (cuentas, pagos) para no requerir migraciones destructivas después.
-- Montos SIEMPRE en centavos enteros (nunca float).

-- gen_random_uuid() es nativo desde PostgreSQL 13 (no requiere pgcrypto).

-- ---------- Catálogo ----------
CREATE TABLE IF NOT EXISTS secciones (
  id          SERIAL PRIMARY KEY,
  nombre      TEXT NOT NULL,
  orden       INT  NOT NULL DEFAULT 0,
  activa      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS productos (
  id              SERIAL PRIMARY KEY,
  seccion_id      INT NOT NULL REFERENCES secciones(id),
  nombre          TEXT NOT NULL,
  descripcion     TEXT NOT NULL DEFAULT '',
  precio_centavos INT  NOT NULL CHECK (precio_centavos >= 0),
  imagen_path     TEXT,                 -- ruta dentro del bucket público de Supabase Storage
  disponible      BOOLEAN NOT NULL DEFAULT TRUE,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  orden           INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS grupos_modificador (
  id          SERIAL PRIMARY KEY,
  producto_id INT NOT NULL REFERENCES productos(id),
  nombre      TEXT NOT NULL,
  min_sel     INT NOT NULL DEFAULT 0,
  max_sel     INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS modificadores (
  id                    SERIAL PRIMARY KEY,
  grupo_id              INT NOT NULL REFERENCES grupos_modificador(id),
  nombre                TEXT NOT NULL,
  precio_extra_centavos INT NOT NULL DEFAULT 0 CHECK (precio_extra_centavos >= 0),
  disponible            BOOLEAN NOT NULL DEFAULT TRUE
);

-- Bilingüe (turistas) y etiquetas del menú. ADD COLUMN IF NOT EXISTS: migración no destructiva.
ALTER TABLE secciones          ADD COLUMN IF NOT EXISTS nombre_en      TEXT;
ALTER TABLE productos          ADD COLUMN IF NOT EXISTS nombre_en      TEXT;
ALTER TABLE productos          ADD COLUMN IF NOT EXISTS descripcion_en TEXT;
ALTER TABLE productos          ADD COLUMN IF NOT EXISTS vegetariano    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE productos          ADD COLUMN IF NOT EXISTS picante        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE productos          ADD COLUMN IF NOT EXISTS recomendado    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE productos          ADD COLUMN IF NOT EXISTS sabor_local    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE grupos_modificador ADD COLUMN IF NOT EXISTS nombre_en      TEXT;
ALTER TABLE modificadores      ADD COLUMN IF NOT EXISTS nombre_en      TEXT;

-- ---------- Mesas y sesiones ----------
CREATE TABLE IF NOT EXISTS mesas (
  id         SERIAL PRIMARY KEY,
  numero     TEXT NOT NULL UNIQUE,
  capacidad  INT  NOT NULL DEFAULT 4,
  area       TEXT NOT NULL DEFAULT 'Salón',
  estado     TEXT NOT NULL DEFAULT 'disponible'
             CHECK (estado IN ('disponible','reservada','ocupada','pendiente_limpieza','fuera_de_servicio')),
  qr_token   TEXT NOT NULL UNIQUE,
  activa     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS sesiones_mesa (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mesa_id     INT NOT NULL REFERENCES mesas(id),
  estado      TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta','cuenta_solicitada','cerrada')),
  abierta_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
  cerrada_en  TIMESTAMPTZ,
  abierta_por INT,
  cerrada_por INT
);
-- Regla 5/6: como máximo UNA sesión no cerrada por mesa (garantizado por la base de datos).
CREATE UNIQUE INDEX IF NOT EXISTS ux_sesion_activa_por_mesa
  ON sesiones_mesa (mesa_id) WHERE estado <> 'cerrada';

-- ---------- Etapa 2+: cuentas y pagos (diseñadas, no usadas por la API del demo) ----------
CREATE TABLE IF NOT EXISTS cuentas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id  UUID NOT NULL REFERENCES sesiones_mesa(id),
  estado     TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta','en_cobro','pagada','anulada')),
  creada_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_cuenta_abierta_por_sesion
  ON cuentas (sesion_id) WHERE estado IN ('abierta','en_cobro');

CREATE TABLE IF NOT EXISTS pagos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id      UUID NOT NULL REFERENCES cuentas(id),
  metodo         TEXT NOT NULL,
  monto_centavos INT  NOT NULL CHECK (monto_centavos > 0),
  estado         TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','confirmado','rechazado','anulado')),
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Órdenes ----------
CREATE SEQUENCE IF NOT EXISTS orden_numero_seq START 1;

CREATE TABLE IF NOT EXISTS ordenes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero           INT  NOT NULL DEFAULT nextval('orden_numero_seq'),
  sesion_id        UUID REFERENCES sesiones_mesa(id),   -- NULL = QR general, asignación pendiente
  mesa_id          INT  REFERENCES mesas(id),
  estado           TEXT NOT NULL DEFAULT 'recibido'
                   CHECK (estado IN ('recibido','confirmado','en_preparacion','listo','entregado','cancelado')),
  total_centavos   INT  NOT NULL CHECK (total_centavos >= 0),
  idempotency_key  TEXT NOT NULL UNIQUE,
  creada_en        TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizada_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_ordenes_estado ON ordenes (estado, creada_en);

CREATE TABLE IF NOT EXISTS orden_lineas (
  id                       SERIAL PRIMARY KEY,
  orden_id                 UUID NOT NULL REFERENCES ordenes(id),
  producto_id              INT  NOT NULL REFERENCES productos(id),
  nombre                   TEXT NOT NULL,            -- copia al momento de pedir
  cantidad                 INT  NOT NULL CHECK (cantidad BETWEEN 1 AND 50),
  precio_unitario_centavos INT  NOT NULL,            -- precio base + modificadores
  nota                     TEXT NOT NULL DEFAULT '',
  estado                   TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','rechazada','cancelada'))
);

CREATE TABLE IF NOT EXISTS orden_linea_modificadores (
  id                    SERIAL PRIMARY KEY,
  linea_id              INT NOT NULL REFERENCES orden_lineas(id),
  modificador_id        INT NOT NULL REFERENCES modificadores(id),
  nombre                TEXT NOT NULL,
  precio_extra_centavos INT NOT NULL
);

-- ---------- Personal y auditoría ----------
CREATE TABLE IF NOT EXISTS usuarios (
  id        SERIAL PRIMARY KEY,
  usuario   TEXT NOT NULL UNIQUE,
  nombre    TEXT NOT NULL,
  rol       TEXT NOT NULL CHECK (rol IN ('admin','gerente','mesero','cocina','caja')),
  pin_hash  TEXT NOT NULL,
  activo    BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS auditoria (
  id          BIGSERIAL PRIMARY KEY,
  usuario_id  INT,
  entidad     TEXT NOT NULL,
  entidad_id  TEXT NOT NULL,
  accion      TEXT NOT NULL,
  antes       JSONB,
  despues     JSONB,
  motivo      TEXT,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);
