import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { connect } from './db/index.js';
import { migrate } from './db/migrate.js';
import routes from './routes.js';
import { ErrorNegocio } from './ordenes.js';

const PORT = Number(process.env.PORT) || 4000;
const ORIGENES = (process.env.CORS_ORIGINS || '*').split(',').map((s) => s.trim());

const driver = await connect();
await migrate(driver);

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(cors({ origin: ORIGENES.includes('*') ? true : ORIGENES }));
app.use(express.json({ limit: '50kb' }));

// Fotos de platillos del demo (en producción viven en Supabase Storage con la misma ruta relativa).
app.use('/fotos', express.static(fileURLToPath(new URL('../public/fotos', import.meta.url)), {
  maxAge: '7d',
  immutable: true,
}));

app.use('/api', routes);

app.use((err, _req, res, _next) => {
  if (err instanceof ErrorNegocio) return res.status(err.status).json({ error: err.message, ...err.extra });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Solicitud mal formada' });
  console.error(err);
  res.status(500).json({ error: 'Ocurrió un problema en el servidor. Intenta de nuevo.' });
});

app.listen(PORT, () => console.log(`[api] escuchando en :${PORT} (db: ${driver.kind})`));
