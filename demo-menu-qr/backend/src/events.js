// Tiempo real con Server-Sent Events (SSE).
// Una sola instancia del API basta para el demo y el piloto. Para varias instancias,
// reemplazar el EventEmitter por LISTEN/NOTIFY de PostgreSQL (mismo contrato hacia el cliente).
import { EventEmitter } from 'node:events';

const bus = new EventEmitter();
bus.setMaxListeners(0);

export function publicar(canal, tipo, datos) {
  bus.emit(canal, { tipo, datos });
}

export function suscribirSSE(req, res, canal) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // nginx: no almacenar en búfer
  });
  res.flushHeaders();
  res.write(`event: hola\ndata: {}\n\n`);

  const enviar = ({ tipo, datos }) => res.write(`event: ${tipo}\ndata: ${JSON.stringify(datos)}\n\n`);
  const latido = setInterval(() => res.write(': latido\n\n'), 25000);
  bus.on(canal, enviar);
  req.on('close', () => {
    clearInterval(latido);
    bus.off(canal, enviar);
  });
}
