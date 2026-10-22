// Adaptador de base de datos.
// - Con DATABASE_URL: PostgreSQL real (Docker local, Railway).
// - Sin DATABASE_URL: PGlite (PostgreSQL en WASM, en memoria) para correr el demo sin instalar nada.
import pg from 'pg';

let driver;

export async function connect() {
  if (driver) return driver;
  if (process.env.DATABASE_URL) {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      max: 10,
    });
    driver = {
      kind: 'postgres',
      query: (sql, params) => pool.query(sql, params),
      exec: (sql) => pool.query(sql),
      async tx(fn) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const result = await fn((sql, params) => client.query(sql, params));
          await client.query('COMMIT');
          return result;
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      },
    };
  } else {
    const { PGlite } = await import('@electric-sql/pglite');
    const db = new PGlite();
    driver = {
      kind: 'pglite',
      query: (sql, params) => db.query(sql, params),
      exec: (sql) => db.exec(sql),
      tx: (fn) => db.transaction((t) => fn((sql, params) => t.query(sql, params))),
    };
  }
  return driver;
}

export function db() {
  if (!driver) throw new Error('Base de datos no inicializada');
  return driver;
}

// Código de error de PostgreSQL para violación de restricción única.
export const UNIQUE_VIOLATION = '23505';
