// Service worker: baixa tudo na instalação e serve offline (BAR 4.2, 4.4, 4.5).
// Modelo: o build.py troca a versão e a lista de arquivos e grava o sw.js.
const VERSAO = 'forja-4a630d0160';
const ARQUIVOS = ['./', 'index.html', 'manifest.webmanifest', 'css/app.css', 'js/app.js', 'js/art.js', 'js/audio.js', 'js/data.js', 'js/player.js', 'js/store.js', 'icons/apple-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'clips/01.jpg', 'clips/01.mp4', 'clips/02.jpg', 'clips/02.mp4', 'clips/03.jpg', 'clips/03.mp4', 'clips/04.jpg', 'clips/04.mp4', 'clips/05.jpg', 'clips/05.mp4', 'clips/06.jpg', 'clips/06.mp4', 'clips/07.jpg', 'clips/07.mp4', 'clips/08.jpg', 'clips/08.mp4', 'clips/09.jpg', 'clips/09.mp4', 'clips/10.jpg', 'clips/10.mp4', 'clips/11.jpg', 'clips/11.mp4', 'clips/12.jpg', 'clips/12.mp4', 'clips/13.jpg', 'clips/13.mp4', 'clips/14.jpg', 'clips/14.mp4', 'clips/15.jpg', 'clips/15.mp4', 'clips/16.jpg', 'clips/16.mp4', 'clips/17.jpg', 'clips/17.mp4', 'clips/18.jpg', 'clips/18.mp4', 'clips/19.jpg', 'clips/19.mp4', 'clips/20.jpg', 'clips/20.mp4', 'clips/21.jpg', 'clips/21.mp4', 'clips/22.jpg', 'clips/22.mp4', 'clips/23.jpg', 'clips/23.mp4', 'clips/24.jpg', 'clips/24.mp4', 'clips/25.jpg', 'clips/25.mp4', 'clips/26.jpg', 'clips/26.mp4', 'clips/27.jpg', 'clips/27.mp4', 'clips/28.jpg', 'clips/28.mp4', 'clips/29.jpg', 'clips/29.mp4'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// vídeo pede pedaços (Range): responde 206 a partir do arquivo inteiro guardado
async function pedaco(req, resp) {
  const m = /bytes=(\d+)-(\d*)/.exec(req.headers.get('range') || '');
  if (!m) return resp;
  const buf = await resp.arrayBuffer(), ini = +m[1], fim = m[2] ? Math.min(+m[2], buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(ini, fim + 1), { status: 206, statusText: 'Partial Content', headers: {
    'Content-Type': resp.headers.get('Content-Type') || 'video/mp4', 'Content-Range': `bytes ${ini}-${fim}/${buf.byteLength}`, 'Content-Length': String(fim - ini + 1), 'Accept-Ranges': 'bytes' } });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSAO);
    const guardado = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await cache.match('index.html') : null);
    if (guardado) return req.headers.has('range') ? pedaco(req, guardado) : guardado;
    return fetch(req);
  })());
});
