// Ejecuta el esquema y la carga de ejemplo contra DATABASE_URL (uso: npm run migrate).
import { connect } from './db/index.js';
import { migrate } from './db/migrate.js';

const driver = await connect();
await migrate(driver);
console.log(`[db] migración aplicada (${driver.kind})`);
process.exit(0);
