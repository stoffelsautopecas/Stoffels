import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import catalogHandler from '../api/catalog.js';
import productHandler from '../api/product.js';
const envPath = fileURLToPath(new URL('../.env.local', import.meta.url));
if (existsSync(envPath)) loadEnvFile(envPath);
const compress = promisify(gzip);
const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)), process.argv[2] || 'public');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png'};
const server = http.createServer(async (req, res) => {
  try {
    let name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if(name==='/api/catalog'){await catalogHandler(req,res);return;}
    if(name==='/api/product'){await productHandler(req,res);return;}
    if(name.startsWith('/api/')){res.writeHead(404,{'Content-Type':'application/json'});res.end('{"error":"Não encontrado"}');return;}
    let file = path.resolve(root, '.' + name);
    if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); res.end(); return; }
    try { if (!(await stat(file)).isFile()) throw new Error(); }
    catch { if (path.extname(name)) { res.writeHead(404); res.end('Não encontrado'); return; } file = path.join(root, 'index.html'); }
    const ext = path.extname(file);
    const headers = {'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache'};
    let body = await readFile(file);
    if (['.html','.js','.css','.json','.svg','.webmanifest'].includes(ext)) {
      headers.Vary = 'Accept-Encoding';
      if (/\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
        body = await compress(body);
        headers['Content-Encoding'] = 'gzip';
      }
    }
    res.writeHead(200, headers);
    res.end(body);
  } catch { res.writeHead(500); res.end('Erro interno'); }
});
server.listen(Number(process.env.PORT || 3001), '127.0.0.1', () => console.log(`Stoffels: http://localhost:${server.address().port}`));
