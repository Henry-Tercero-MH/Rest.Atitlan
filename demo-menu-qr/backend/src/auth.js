import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import jwt from 'jsonwebtoken';

const scryptAsync = promisify(scrypt);
const SECRET = process.env.JWT_SECRET || 'solo-para-demo-cambiar-en-produccion';
if (!process.env.JWT_SECRET) console.warn('[auth] JWT_SECRET no definido: usando secreto de demo');

export async function hashPin(pin) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scryptAsync(pin, salt, 32);
  return `${salt}:${hash.toString('hex')}`;
}

export async function verifyPin(pin, stored) {
  const [salt, hex] = stored.split(':');
  const hash = await scryptAsync(pin, salt, 32);
  return timingSafeEqual(hash, Buffer.from(hex, 'hex'));
}

export function signToken(usuario) {
  // 12 h: cubre un turno completo sin caducar a mitad (regla de cocina-kds).
  return jwt.sign({ sub: usuario.id, rol: usuario.rol, nombre: usuario.nombre }, SECRET, { expiresIn: '12h' });
}

export function requireRol(...roles) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : req.query.token;
    if (!token) return res.status(401).json({ error: 'Inicia sesión' });
    try {
      const payload = jwt.verify(token, SECRET);
      if (!roles.includes(payload.rol)) return res.status(403).json({ error: 'No tienes permiso para esta acción' });
      req.usuario = payload;
      next();
    } catch {
      res.status(401).json({ error: 'Sesión vencida, vuelve a iniciar sesión' });
    }
  };
}
