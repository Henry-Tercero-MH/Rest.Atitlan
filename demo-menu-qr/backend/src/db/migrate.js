import { readFile } from 'node:fs/promises';
import { seed } from './seed.js';

export async function migrate(driver) {
  const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await driver.exec(sql);
  if (process.env.SEED_DEMO !== 'false') {
    const sembrado = await driver.tx((q) => seed(q));
    if (sembrado) console.log('[db] datos [EJEMPLO] cargados');
  }
}
