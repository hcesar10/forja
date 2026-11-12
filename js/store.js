// Estado do app. Tudo fica só no aparelho (IndexedDB). Nada pessoal vai para o servidor.
import { MISSOES, CONQUISTAS, ESTAGIO_NIVEL, treinoDoDia } from './data.js';

const DB = 'forja', LOJA = 'kv', CHAVE = 'estado';

export const novoEstado = () => ({
  v: 2,
  perfil: { nome: '', kg: 90, altura: 174, dormir: '23:00', treinoHora: '07:00', diaEsporte: -1, gatilhos: {}, pronto: false },
  inicio: null, // data do primeiro dia (AAAA-MM-DD)
  xp: 0,
  nivelTreino: 1,
  dias: {}, // 'AAAA-MM-DD': { xp, m: {id: n}, perfeito }
  treinos: [], // { d, tipo, nivel, min, kcal, xp, rpe, azia }
  medidas: [], // { d, kg, cintura }
  conquistas: {}, // id: data
  ajustes: { musica: true, voz: true, volMusica: 0.5 },
  backupEm: null,
});

function abrir() {
  return new Promise((ok, erro) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(LOJA);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => erro(r.error);
  });
}
async function idb(modo, fn) {
  const db = await abrir();
  return new Promise((ok, erro) => {
    const t = db.transaction(LOJA, modo);
    const q = fn(t.objectStore(LOJA));
    t.oncomplete = () => ok(q.result);
    t.onerror = () => erro(t.error);
  });
}

export let S = novoEstado();
let memoria = false; // true = modo demonstração, não grava

export async function carregar(demo) {
  if (demo) { memoria = true; S = demo; return S; }
  try {
    const salvo = await idb('readonly', (s) => s.get(CHAVE));
    if (salvo) S = { ...novoEstado(), ...salvo, perfil: { ...novoEstado().perfil, ...salvo.perfil }, ajustes: { ...novoEstado().ajustes, ...salvo.ajustes } };
  } catch (e) { console.warn('IndexedDB indisponível', e); memoria = true; }
  return S;
}

let fila = null;
export function salvar() {
  if (memoria) return;
  clearTimeout(fila);
  fila = setTimeout(() => idb('readwrite', (s) => s.put(JSON.parse(JSON.stringify(S)), CHAVE)).catch((e) => console.warn('falha ao salvar', e)), 150);
}
export const substituir = (novo) => { S = { ...novoEstado(), ...novo }; salvar(); };

// ---- datas (sempre no fuso do aparelho)
export const chave = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const deChave = (k) => { const [a, m, d] = k.split('-').map(Number); return new Date(a, m - 1, d); };
export const maisDias = (k, n) => { const d = deChave(k); d.setDate(d.getDate() + n); return chave(d); };
export const hoje = () => chave();
export const dia = (k = hoje()) => (S.dias[k] ||= { xp: 0, m: {} });
export const numeroDoDia = (k = hoje()) => Math.round(deChave(k).getTime() / 864e5);
export const semana = () => (S.inicio ? Math.floor((numeroDoDia() - numeroDoDia(S.inicio)) / 7) + 1 : 1);
const segunda = (k) => { const d = deChave(k); return maisDias(k, -((d.getDay() + 6) % 7)); };

// ---- nível do personagem
export const xpDoNivel = (n) => 100 + (n - 1) * 60; // XP para ir do nível n ao n+1
export function nivel(xp = S.xp) {
  let n = 1, resto = xp;
  while (resto >= xpDoNivel(n)) { resto -= xpDoNivel(n); n++; }
  return { n, resto, falta: xpDoNivel(n), pct: resto / xpDoNivel(n) };
}
export const estagio = (n = nivel().n) => ESTAGIO_NIVEL.filter((x) => n >= x).length - 1;

// ---- sequência que perdoa (BAR 3.2 a 3.4)
// Dia ativo = pelo menos 1 missão. Sábado e domingo parados não quebram. Até 2 congelamentos por semana.
export function sequencia() {
  let seq = 0, k = hoje();
  const usados = {};
  if (!(S.dias[k]?.xp > 0)) k = maisDias(k, -1); // hoje ainda em aberto não quebra
  for (let i = 0; i < 400; i++) {
    if (S.inicio && k < S.inicio) break;
    if (S.dias[k]?.xp > 0) seq++;
    else {
      const dow = deChave(k).getDay();
      if (dow !== 0 && dow !== 6) {
        const sem = segunda(k);
        if ((usados[sem] || 0) >= 2) break;
        usados[sem] = (usados[sem] || 0) + 1;
      }
    }
    k = maisDias(k, -1);
    if (!S.inicio && i > 60) break;
  }
  const congeladosEstaSemana = usados[segunda(hoje())] || 0;
  return { seq, congelamentos: 2 - congeladosEstaSemana };
}
export function ultimos7() {
  const lista = [];
  for (let i = 6; i >= 0; i--) { const k = maisDias(hoje(), -i); lista.push({ k, ativo: S.dias[k]?.xp > 0, dow: deChave(k).getDay(), hoje: i === 0 }); }
  return { lista, total: lista.filter((x) => x.ativo).length };
}

// ---- missões do dia
export function missoesDeHoje(k = hoje()) {
  const dow = deChave(k).getDay();
  const tipo = treinoDoDia(dow, S.perfil.diaEsporte);
  return MISSOES.filter((m) => m.id !== 'treino' || tipo || dow === S.perfil.diaEsporte).map((m) => {
    const feito = dia(k).m[m.id] || 0;
    const x = { ...m, feito, completa: feito >= m.meta, gatilho: S.perfil.gatilhos[m.id] };
    if (m.id === 'treino') Object.assign(x, tipo ? { tipo } : { nome: 'Dia de esporte', sub: 'Futebol, vôlei ou outro. Marque quando jogar.', xp: 120, especial: null, icone: 'bola' });
    return x;
  });
}

/** Soma XP e devolve o que mudou, para a tela comemorar. */
export function ganharXP(qtd, k = hoje()) {
  const antes = nivel();
  S.inicio ||= k;
  S.xp += qtd;
  dia(k).xp += qtd;
  const depois = nivel();
  const ms = missoesDeHoje(k);
  let perfeito = false;
  if (!dia(k).perfeito && ms.every((m) => m.completa)) { dia(k).perfeito = true; perfeito = true; S.xp += 50; dia(k).xp += 50; }
  const novas = conferirConquistas();
  salvar();
  return { subiu: depois.n > antes.n ? depois.n : 0, estagioNovo: estagio(depois.n) > estagio(antes.n) ? estagio(depois.n) : -1, perfeito, novas };
}

export function marcar(id, k = hoje()) {
  const m = MISSOES.find((x) => x.id === id);
  const d = dia(k);
  const feito = d.m[id] || 0;
  if (!m || feito >= m.meta) return null;
  d.m[id] = feito + 1;
  const xp = id === 'treino' ? 120 : m.xp;
  return { xp, ...ganharXP(xp, k), completa: d.m[id] >= m.meta };
}

export function resumoMedidas() {
  const m = S.medidas;
  if (!m.length) return { perdido: 0, cintura: 0 };
  const p = m[0], u = m[m.length - 1];
  const cint = m.filter((x) => x.cintura);
  return { perdido: +(p.kg - u.kg).toFixed(1) || 0, cintura: cint.length > 1 ? +(cint[0].cintura - cint[cint.length - 1].cintura).toFixed(1) : 0 };
}

export function conferirConquistas() {
  const x = { seq: sequencia().seq, nivel: nivel().n, ...resumoMedidas() };
  const novas = [];
  CONQUISTAS.forEach((c) => { if (!S.conquistas[c.id] && c.ok(S, x)) { S.conquistas[c.id] = hoje(); novas.push(c); } });
  return novas;
}

// ---- nível do treino (BAR 1.2 e 1.3)
/** Registra o treino e decide se sobe, desce ou mantém. */
export function registrarTreino(t) {
  S.treinos.push({ d: hoje(), ...t });
  const mesmos = S.treinos.filter((x) => (x.tipo === 'A' || x.tipo === 'B') && x.nivel === S.nivelTreino);
  const ult = S.treinos.slice(-2);
  let aviso = null;
  if (ult.length === 2 && ult.every((x) => x.azia)) {
    if (S.nivelTreino > 1) S.nivelTreino--;
    aviso = 'azia';
  } else if (ult.length === 2 && ult.every((x) => x.rpe >= 9)) {
    if (S.nivelTreino > 1) { S.nivelTreino--; aviso = 'desceu'; }
  } else if (S.nivelTreino < 5 && mesmos.length >= 4) {
    const quatro = mesmos.slice(-4);
    const limite = maisDias(hoje(), -14);
    const semAzia = !S.treinos.some((x) => x.azia && x.d >= limite);
    const media = quatro.reduce((s, x) => s + x.rpe, 0) / 4;
    const feitosSemana = S.treinos.filter((x) => x.d >= maisDias(hoje(), -7) && (x.tipo === 'A' || x.tipo === 'B')).length;
    if (semAzia && media <= 7 && feitosSemana >= 4) aviso = 'subir';
  }
  conferirConquistas();
  salvar();
  return aviso;
}
export const subirNivelTreino = () => { if (S.nivelTreino < 5) S.nivelTreino++; conferirConquistas(); salvar(); };

export function minutosDaSemana() {
  const ini = segunda(hoje());
  return S.treinos.filter((x) => x.d >= ini).reduce((s, x) => s + x.min, 0);
}

export async function pedirPersistencia() {
  try { if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist(); } catch {}
}
