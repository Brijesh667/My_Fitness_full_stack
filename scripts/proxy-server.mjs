#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'frontend', 'dist');
const PORT = Number(process.env.PROXY_PORT ?? 4173);
const TARGET_HOST = process.env.PROXY_TARGET_HOST ?? '127.0.0.1';
const TARGET_PORT = Number(process.env.PROXY_TARGET_PORT ?? 5000);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

function proxyApi(req, res) {
  const headers = { ...req.headers, host: `${TARGET_HOST}:${TARGET_PORT}` };
  const forwardedFor = req.headers['x-forwarded-for'];
  headers['x-forwarded-for'] = forwardedFor
    ? `${forwardedFor}, ${req.socket.remoteAddress ?? ''}`
    : req.socket.remoteAddress ?? '';
  headers['x-forwarded-proto'] = 'http';
  headers['x-forwarded-host'] = req.headers.host ?? `localhost:${PORT}`;

  const upstream = http.request(
    {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: req.url,
      method: req.method,
      headers
    },
    (upstreamResponse) => {
      res.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
      upstreamResponse.pipe(res);
    }
  );

  upstream.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
    }
    res.end(
      JSON.stringify({
        success: false,
        error: { code: 'PROXY_ERROR', message: 'Backend is not available' }
      })
    );
  });

  req.pipe(upstream);
}

function serveStatic(req, res) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, `http://localhost:${PORT}`).pathname);
  } catch {
    pathname = '/';
  }

  const safePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const candidate = path.resolve(DIST, safePath);
  const insideDist = candidate === DIST || candidate.startsWith(`${DIST}${path.sep}`);
  let filePath = insideDist && fs.existsSync(candidate) && fs.statSync(candidate).isFile()
    ? candidate
    : path.join(DIST, 'index.html');

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Frontend build not found. Run the frontend build first.');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath)] ?? 'application/octet-stream',
      'Cache-Control': filePath.endsWith('index.html') ? 'no-cache' : 'public, max-age=60'
    });
    res.end(req.method === 'HEAD' ? undefined : content);
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    proxyApi(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`proxy: http://localhost:${PORT} -> ${TARGET_HOST}:${TARGET_PORT}`);
});
