// Servidor local + proxy para demo-web. Cero dependencias, requiere Node 18+.
//
//   node demo-web/serve.mjs        ->  http://localhost:8080
//   PORT=3001 node demo-web/serve.mjs
//   SL_UPSTREAM=http://localhost:3000 node demo-web/serve.mjs   (contra tu propia instancia)
//
// Por que hace falta: el navegador bloquea por CORS las llamadas a la API
// desde otro dominio. Este proceso sirve el HTML y reenvia /api/* al upstream,
// asi que para el navegador todo es el mismo origen.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, extname } from 'node:path';

const DIR = dirname(fileURLToPath(import.meta.url));
const UPSTREAM = (process.env.SL_UPSTREAM || 'https://sourcelibrary.org').replace(/\/$/, '');
const PORT = Number(process.env.PORT || 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (req, res) => {
  let url;
  try {
    url = new URL(req.url, 'http://localhost');
  } catch {
    res.writeHead(400).end('bad request');
    return;
  }

  // 1) Proxy de la API
  if (url.pathname.startsWith('/api/')) {
    try {
      const upstream = await fetch(UPSTREAM + url.pathname + url.search, {
        headers: { 'user-agent': 'sourcelibrary-demo-web/1.0', accept: '*/*' },
      });
      const body = Buffer.from(await upstream.arrayBuffer());
      res.writeHead(upstream.status, {
        'content-type': upstream.headers.get('content-type') || 'application/octet-stream',
        'cache-control': 'public, max-age=300',
      });
      res.end(body);
    } catch (err) {
      res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Error hablando con ' + UPSTREAM + ': ' + err.message);
    }
    return;
  }

  // 2) Ficheros estaticos de esta carpeta (sin salir de ella)
  const rel = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const file = resolve(join(DIR, rel));
  if (!file.startsWith(resolve(DIR))) {
    res.writeHead(403).end('forbidden');
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('no encontrado: ' + rel);
  }
});

server.listen(PORT, () => {
  console.log('demo-web escuchando en http://localhost:' + PORT);
  console.log('proxy /api/* -> ' + UPSTREAM);
});
