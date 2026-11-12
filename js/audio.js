// Som do app: batida gerada por código (funciona offline, sem direitos autorais),
// bipes, efeitos de recompensa e voz em pt-BR. BAR 2.1 a 2.3.
let ctx = null, master = null, musicaGain = null, fxGain = null;
let timer = null, proxima = 0, passo = 0, bpm = 0, ligado = false, volBase = 0.5;
const escuta = new Set();

export function iniciarAudio() {
  // precisa ser chamado dentro de um toque do usuário (política de autoplay)
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.connect(ctx.destination);
    musicaGain = ctx.createGain(); musicaGain.gain.value = 0.5; musicaGain.connect(master);
    fxGain = ctx.createGain(); fxGain.gain.value = 0.9; fxGain.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
}
export const setVolumeMusica = (v) => { volBase = v; if (musicaGain) musicaGain.gain.value = v; };

function tom(freq, t, dur, vol, tipo = 'sine', destino = fxGain, freqFim) {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = tipo; o.frequency.setValueAtTime(freq, t);
  if (freqFim) o.frequency.exponentialRampToValueAtTime(freqFim, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(destino); o.start(t); o.stop(t + dur + 0.02);
}
function ruido(t, dur, vol, hp) {
  if (!ctx) return;
  const n = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ctx.createBufferSource(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
  s.buffer = buf; fl.type = 'highpass'; fl.frequency.value = hp; g.gain.value = vol;
  s.connect(fl); fl.connect(g); g.connect(musicaGain); s.start(t);
}

// compasso de 16 passos. Baixo em lá menor, muda a cada 2 compassos.
const BAIXO = [55, 55, 65.4, 49];
function tocarPasso(i, t) {
  const forte = bpm >= 135, compasso = Math.floor(i / 16), p = i % 16;
  if (p % 4 === 0) tom(150, t, 0.16, 0.9, 'sine', musicaGain, 42); // bumbo
  if (forte && p === 14 && compasso % 2) tom(150, t, 0.12, 0.6, 'sine', musicaGain, 42);
  if (p === 4 || p === 12) { ruido(t, 0.12, 0.35, 1500); tom(190, t, 0.08, 0.25, 'triangle', musicaGain); } // caixa
  if (p % 2 === 0 && p % 4 !== 0) ruido(t, 0.04, bpm >= 120 ? 0.16 : 0.08, 7000); // chimbal
  if (forte && p % 2 === 1) ruido(t, 0.02, 0.06, 9000);
  const nota = BAIXO[Math.floor(compasso / 2) % 4];
  if (bpm >= 100 && [0, 3, 6, 8, 11, 14].includes(p)) tom(nota * (p === 11 ? 1.5 : 1), t, 0.14, 0.32, 'sawtooth', musicaGain);
  if (bpm < 100 && p % 8 === 0) tom(nota * 4, t, 1.2, 0.07, 'sine', musicaGain); // bloco calmo: só um colchão
  if (p % 4 === 0) { const d = Math.max(0, (t - ctx.currentTime) * 1000); setTimeout(() => escuta.forEach((fn) => fn(p === 0)), d); }
}
function agenda() {
  const semi = 60 / bpm / 4;
  while (proxima < ctx.currentTime + 0.12) { tocarPasso(passo, proxima); proxima += semi; passo++; }
}
/** Liga a batida no bpm dado. bpm 0 = silêncio. Mantém o compasso ao mudar de ritmo. */
export function batida(novoBpm, comMusica = true) {
  if (!ctx) return;
  ligado = comMusica;
  if (!novoBpm || !comMusica) { clearInterval(timer); timer = null; bpm = 0; return; }
  if (novoBpm === bpm && timer) return;
  bpm = novoBpm;
  if (!timer) { proxima = ctx.currentTime + 0.05; passo = 0; timer = setInterval(agenda, 25); }
}
export const pararBatida = () => { clearInterval(timer); timer = null; bpm = 0; };
export const aoBater = (fn) => { escuta.add(fn); return () => escuta.delete(fn); };

export const bipe = (agudo) => ctx && tom(agudo ? 1320 : 880, ctx.currentTime, agudo ? 0.35 : 0.12, 0.5, 'square');
export function somXP() { if (!ctx) return; const t = ctx.currentTime; tom(660, t, 0.09, 0.35, 'triangle'); tom(990, t + 0.08, 0.14, 0.35, 'triangle'); }
export function somFeito() { if (!ctx) return; const t = ctx.currentTime; [523, 659, 784].forEach((f, i) => tom(f, t + i * 0.07, 0.16, 0.35, 'triangle')); }
export function somNivel() { if (!ctx) return; const t = ctx.currentTime; [523, 659, 784, 1047, 1319].forEach((f, i) => tom(f, t + i * 0.1, 0.3, 0.4, 'triangle')); }
export const vibrar = (p) => { try { navigator.vibrate?.(p); } catch {} };

// ---- voz
let voz = null;
function escolherVoz() {
  const vs = speechSynthesis.getVoices();
  voz = vs.find((v) => /pt[-_]BR/i.test(v.lang)) || vs.find((v) => /^pt/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) { escolherVoz(); speechSynthesis.addEventListener?.('voiceschanged', escolherVoz); }
export const temVoz = () => !!voz;
export function falar(texto, ligada = true) {
  if (!ligada || !('speechSynthesis' in window) || !voz) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.voice = voz; u.lang = voz.lang; u.rate = 1.08; u.volume = 1;
    if (musicaGain && ligado) { // baixa a música enquanto fala
      musicaGain.gain.setTargetAtTime(volBase * 0.35, ctx.currentTime, 0.05);
      u.onend = u.onerror = () => musicaGain.gain.setTargetAtTime(volBase, ctx.currentTime, 0.2);
    }
    speechSynthesis.speak(u);
  } catch {}
}
export const calarVoz = () => { try { speechSynthesis.cancel(); } catch {} };
