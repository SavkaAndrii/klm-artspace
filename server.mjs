// Optional local preview only. GitHub Pages serves the same files without Node.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map(arg => arg.replace(/^--/, '').split('=')));
const port = Number(args.port || 4173);
const base = args.base ? `/${args.base.replace(/^\/+|\/+$/g, '')}/` : '/';
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png' };

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    if (base !== '/' && pathname === base.slice(0, -1)) {
      res.writeHead(301, { Location: base + url.search });
      return res.end();
    }
    if (!pathname.startsWith(base)) { res.writeHead(404); return res.end('Nie znaleziono strony.'); }
    let target = path.resolve(root, pathname.slice(base.length) || '.');
    if (target !== root && !target.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
    if ((await stat(target)).isDirectory()) {
      if (!pathname.endsWith('/')) {
        res.writeHead(301, { Location: url.pathname + '/' + url.search });
        return res.end();
      }
      target = path.join(target, 'index.html');
    }
    const type = mime[path.extname(target)];
    if (!type) { res.writeHead(404); return res.end(); }
    const data = await readFile(target);
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Nie znaleziono strony.');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`KLM Art Space: http://127.0.0.1:${port}${base}`));
