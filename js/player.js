// Player do treino. Critérios: BAR.md, grupo 2.
import { EX, TIPO, TREINOS, NIVEIS, treinoDoDia } from './data.js';
import * as st from './store.js';
import { icone, heroi } from './art.js';
import * as som from './audio.js';
import { comemorar, fechar } from './app.js';

const sobre = document.getElementById('sobre');
const $ = (s) => sobre.querySelector(s);
const pad = (n) => String(n).padStart(2, '0');
let P = null, trava = null, tirarBatida = null;
const ACELERA = +new URLSearchParams(location.search).get('acelera') || 1; // só para teste automático

async function telaAcesa() {
  try { if ('wakeLock' in navigator && document.visibilityState === 'visible') trava = await navigator.wakeLock.request('screen'); } catch {}
}
const aoVoltar = () => { if (P && document.visibilityState === 'visible') telaAcesa(); };

export function abrirPlayer(tipo, fases, opts = {}) {
  const total = fases.reduce((s, x) => s + x.dur, 0);
  P = { tipo, fases, opts, i: -1, ini: 0, pausado: false, decorrido: 0, antes: 0, total, xp: 0, kcal: 0, seg: 0, raf: 0, ditos: {}, exAtual: 0 };
  sobre.innerHTML = `<div class="player" data-tipo="prep">
    <header class="pl-topo"><button class="pl-bt" data-p="sair" aria-label="Sair do treino">${icone('x')}</button>
      <div class="pl-prog"><i id="pl-prog"></i></div><span id="pl-resta" class="pl-resta"></span></header>
    <div class="pl-video"><video id="pl-v" muted loop playsinline autoplay preload="auto" crossorigin="anonymous"></video>
      <div class="pl-selo" id="pl-selo"></div><div class="pl-ritmo" id="pl-ritmo" hidden></div>
      <div class="pl-prep" id="pl-prep"></div><div class="pl-xp" id="pl-xp"></div></div>
    <section class="pl-info"><p class="pl-secao" id="pl-secao"></p><h1 id="pl-nome"></h1><p class="pl-meta" id="pl-meta"></p><p class="pl-dica" id="pl-dica"></p></section>
    <section class="pl-tempo"><div class="pl-num" id="pl-num">0</div><div class="pl-barra"><i id="pl-barra"></i></div></section>
    <section class="pl-seguir" id="pl-seguir"><img id="pl-simg" alt=""><span><small>DEPOIS</small><b id="pl-snome"></b></span></section>
    <footer class="pl-ctrl">
      <button class="pl-bt alt" data-p="musica" aria-label="Batida" aria-pressed="${st.S.ajustes.musica}">${icone('nota')}</button>
      <button class="pl-bt" data-p="ant" aria-label="Exercício anterior">${icone('anterior')}</button>
      <button class="pl-bt principal" data-p="pausa" aria-label="Pausar" id="pl-pausa">${icone('pause')}</button>
      <button class="pl-bt" data-p="prox" aria-label="Próximo exercício">${icone('proximo')}</button>
      <button class="pl-bt alt" data-p="voz" aria-label="Voz" aria-pressed="${st.S.ajustes.voz}">${icone('voz')}</button>
    </footer></div>`;
  sobre.className = 'aberto cheio';
  sobre.onclick = (e) => { const b = e.target.closest('[data-p]'); if (b) cmd[b.dataset.p]?.(b); };
  document.addEventListener('visibilitychange', aoVoltar);
  telaAcesa();
  tirarBatida = som.aoBater(() => { const n = $('#pl-num'); if (!n || P?.pausado) return; n.classList.remove('bate'); void n.offsetWidth; n.classList.add('bate'); });
  if (opts.direto === 'fim') { P.xp = 214; P.kcal = 236; P.seg = 1722; return fim(true); }
  entrar(opts.pular || 0);
  P.raf = requestAnimationFrame(quadro);
}

function proximoReal(i) { for (let j = i + 1; j < P.fases.length; j++) if (P.fases[j].tipo !== 'prep') return P.fases[j]; return null; }

function entrar(i) {
  if (i >= P.fases.length) return fim(true);
  P.i = i; P.decorrido = 0; P.ini = performance.now(); P.ditos = {};
  P.antes = P.fases.slice(0, i).reduce((s, x) => s + x.dur, 0);
  const f = P.fases[i], t = TIPO[f.tipo], ex = EX[f.ex], a = st.S.ajustes;
  const v = $('#pl-v'), pl = $('.player');
  pl.dataset.tipo = f.tipo;
  if (P.exAtual !== f.ex) { v.src = `clips/${pad(f.ex)}.mp4`; P.exAtual = f.ex; }
  v.classList.toggle('espelho', !!f.espelhar);
  const vel = f.vel || 1; v.defaultPlaybackRate = vel; v.playbackRate = vel; v.onloadeddata = () => { v.playbackRate = vel; };
  if (!P.pausado) v.play().catch(() => {});
  $('#pl-selo').textContent = t.rotulo; $('#pl-selo').hidden = f.tipo === 'prep';
  const alvo = f.tipo === 'prep' ? proximoReal(i) : null;
  $('#pl-secao').textContent = alvo ? 'A SEGUIR' + (alvo.secao ? ' · ' + alvo.secao : '') : f.secao || t.rotulo;
  $('#pl-nome').textContent = f.tipo === 'desc' ? 'Descanso' : ex.nome;
  $('#pl-meta').textContent = f.lado || f.meta || '';
  $('#pl-dica').textContent = f.tipo === 'desc' || f.tipo === 'leve' ? '' : ex.dica;
  $('#pl-prep').hidden = true; // a prévia fica nítida: é a hora de ver o movimento
  $('#pl-ritmo').hidden = !f.ritmo;
  const prox = proximoReal(f.tipo === 'prep' ? i + 1 : i);
  $('#pl-seguir').hidden = !prox;
  if (prox) { $('#pl-simg').src = `clips/${pad(prox.ex)}.jpg`; $('#pl-snome').textContent = prox.tipo === 'desc' ? 'Descanso' : EX[prox.ex].nome + (prox.lado ? ' · outro lado' : ''); }
  som.batida(f.tipo === 'prep' ? TIPO[(proximoReal(i) || f).tipo].bpm : t.bpm, a.musica);
  // voz: dá para seguir sem olhar a tela (BAR 2.2)
  const fala = f.tipo === 'prep' ? `A seguir: ${ex.nome}.${f.lado ? ' ' + f.lado + '.' : ''}`
    : f.tipo === 'forte' ? 'Forte!' : f.tipo === 'leve' ? 'Recupere.' : f.tipo === 'desc' ? 'Descanso. Beba água.'
    : f.tipo === 'resp' ? 'Respire pela barriga. Puxe em quatro, solte em seis.' : P.fases[i - 1]?.tipo === 'prep' ? 'Vai!' : `${ex.nome}.`;
  som.falar(fala, a.voz);
  if (f.tipo !== 'prep') som.vibrar(f.tipo === 'forte' ? [60, 40, 60] : 40);
}

function concluirFase() {
  const f = P.fases[P.i], t = TIPO[f.tipo];
  P.kcal += ((t.met * 3.5 * st.S.perfil.kg) / 200) * (f.dur / 60);
  P.seg += f.dur;
  if (t.xp) { P.xp += t.xp; const el = $('#pl-xp'); el.textContent = `+${t.xp} XP`; el.classList.remove('sobe'); void el.offsetWidth; el.classList.add('sobe'); som.somXP(); }
}

function quadro(agora) {
  if (!P) return;
  P.raf = requestAnimationFrame(quadro);
  if (P.pausado || P.i < 0 || P.acabou) return;
  const f = P.fases[P.i];
  P.decorrido = ((agora - P.ini) / 1000) * ACELERA;
  const resta = Math.max(0, f.dur - P.decorrido), seg = Math.ceil(resta), a = st.S.ajustes;
  $('#pl-num').textContent = seg >= 60 ? `${Math.floor(seg / 60)}:${pad(seg % 60)}` : seg;
  $('#pl-barra').style.transform = `scaleX(${1 - resta / f.dur})`;
  const feito = P.antes + P.decorrido;
  $('#pl-prog').style.transform = `scaleX(${Math.min(1, feito / P.total)})`;
  $('#pl-resta').textContent = `${Math.ceil((P.total - feito) / 60)} min`;
  $('#pl-seguir').classList.toggle('logo', resta <= 5 && f.tipo !== 'prep');
  if (f.ritmo) { const c = P.decorrido % 10, r = $('#pl-ritmo'); const txt = c < 4 ? 'PUXE O AR' : 'SOLTE'; if (r.textContent !== txt) r.textContent = txt; }
  const dizer = (k, fn) => { if (!P.ditos[k]) { P.ditos[k] = 1; fn(); } };
  if (seg <= 3 && seg >= 1) dizer('b' + seg, () => som.bipe(false));
  if (f.tipo !== 'prep' && f.dur >= 30) {
    if (resta <= f.dur / 2) dizer('meio', () => som.falar(f.tipo === 'forte' ? 'Metade. Não pare!' : 'Metade.', a.voz));
    if (seg === 10 && f.tipo === 'forte') dizer('dez', () => som.falar('Dez segundos!', a.voz));
  }
  if (resta <= 0) { som.bipe(true); if (f.tipo !== 'prep') concluirFase(); entrar(P.i + 1); }
}

const cmd = {
  pausa() {
    P.pausado = !P.pausado;
    const v = $('#pl-v'), b = $('#pl-pausa');
    if (P.pausado) { v.pause(); som.pararBatida(); som.calarVoz(); b.innerHTML = icone('play'); b.setAttribute('aria-label', 'Continuar'); $('.player').classList.add('pausado'); }
    else { P.ini = performance.now() - (P.decorrido * 1000) / ACELERA; v.play().catch(() => {}); const f = P.fases[P.i]; som.batida(TIPO[f.tipo].bpm, st.S.ajustes.musica); b.innerHTML = icone('pause'); b.setAttribute('aria-label', 'Pausar'); $('.player').classList.remove('pausado'); }
  },
  prox() { if (P.pausado) cmd.pausa(); entrar(P.i + 1); },
  ant() { if (P.pausado) cmd.pausa(); let j = P.i - 1; while (j > 0 && P.fases[j].tipo === 'prep') j--; entrar(Math.max(0, P.decorrido > 3 ? P.i : j)); },
  musica(b) { const a = st.S.ajustes; a.musica = !a.musica; st.salvar(); b.setAttribute('aria-pressed', a.musica); if (!P.pausado && !P.acabou) som.batida(TIPO[P.fases[P.i].tipo].bpm, a.musica); },
  voz(b) { const a = st.S.ajustes; a.voz = !a.voz; st.salvar(); b.setAttribute('aria-pressed', a.voz); if (!a.voz) som.calarVoz(); },
  sair() {
    if (P.acabou) return encerrar();
    if (!P.pausado) cmd.pausa();
    const d = document.createElement('div');
    d.className = 'pl-confirma';
    d.innerHTML = `<div><h2>Parar o treino?</h2><p>Você já ganhou ${P.xp} XP. Ele fica guardado.</p><button class="bt primario grande" data-p="voltar">Continuar treinando</button><button class="bt fantasma" data-p="parar">Parar agora</button></div>`;
    $('.player').append(d);
  },
  voltar() { $('.pl-confirma')?.remove(); cmd.pausa(); },
  parar() { if (P.xp) comemorar(st.ganharXP(P.xp), P.xp); encerrar(); },
  rpe(b) { P.rpe = +b.dataset.v; sobre.querySelectorAll('[data-p="rpe"]').forEach((x) => x.classList.toggle('on', x === b)); pronto(); },
  azia(b) { P.azia = b.dataset.v === '1'; sobre.querySelectorAll('[data-p="azia"]').forEach((x) => x.classList.toggle('on', x === b)); pronto(); },
  concluir() {
    const sugestao = P.registrado ? null : st.registrarTreino({ tipo: P.tipo, nivel: st.S.nivelTreino, min: Math.round(P.seg / 60), kcal: Math.round(P.kcal), xp: P.xp + 50, rpe: P.rpe, azia: P.azia });
    P.registrado = true;
    const res = P.resultado;
    encerrar();
    if (sugestao === 'subir') mostrar(`<h2>Pronto para subir de nível?</h2><p class="fraco">Você fez 4 treinos na semana sem achar pesado e sem azia. O próximo nível é <b>${NIVEIS[st.S.nivelTreino].nome}</b>: ${NIVEIS[st.S.nivelTreino].alvo}</p><button class="bt primario grande" data-a="subir-treino">Subir de nível</button><button class="bt fantasma" data-a="fechar">Ficar mais uma semana</button>`);
    else if (sugestao === 'azia') mostrar(`<h2>Azia em dois treinos seguidos</h2><p class="fraco">O app baixou um nível do treino. Treine de estômago vazio e solte o ar na força. Se a azia continuar, pare os treinos e fale com seu médico.</p><button class="bt primario grande" data-a="fechar">Entendi</button>`);
    else if (sugestao === 'desceu') mostrar(`<h2>Treino mais leve</h2><p class="fraco">Dois treinos seguidos no limite. O app baixou um nível para você recuperar. Ele sobe de novo quando ficar confortável.</p><button class="bt primario grande" data-a="fechar">Entendi</button>`);
    else comemorar(res, 0);
  },
};
function mostrar(html) { sobre.innerHTML = `<div class="fundo" data-a="fechar"></div><div class="folha" role="dialog" aria-modal="true">${html}</div>`; sobre.className = 'aberto'; sobre.onclick = null; }
document.addEventListener('click', (e) => { if (e.target.closest('[data-a="subir-treino"]')) { st.subirNivelTreino(); fechar(); } });
const pronto = () => { const b = $('#pl-concluir'), ok = P.rpe && P.azia !== undefined; if (b) { b.disabled = !ok; $('#pl-falta').hidden = !!ok; } };

function fim(completo) {
  P.acabou = true;
  cancelAnimationFrame(P.raf);
  som.pararBatida(); som.somNivel(); som.vibrar([60, 60, 60, 60, 160]);
  const xp = P.xp + (completo ? 50 : 0);
  if (completo) st.dia().m.treino = 1; // qualquer treino completo cumpre a missão do dia
  P.resultado = P.opts.direto ? {} : st.ganharXP(xp);
  som.falar('Treino completo! Mandou bem.', st.S.ajustes.voz);
  const nv = st.nivel(), seq = st.sequencia().seq, min = Math.round(P.seg / 60);
  sobre.innerHTML = `<div class="fim"><div class="confete">${Array.from({ length: 28 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--d:${(i % 7) * 0.12}s;--c:${['#34d399', '#fbbf24', '#60a5fa', '#f472b6'][i % 4]}"></i>`).join('')}</div>
    <div class="fim-arte">${heroi(st.estagio(nv.n), { id: 'f' })}</div>
    <p class="rot">${TREINOS[P.tipo].nome.toUpperCase()}</p><h1>Treino completo</h1>
    <section class="tres"><div><b>${min}</b><span>minutos</span></div><div><b>${Math.round(P.kcal)}</b><span>kcal</span></div><div><b>+${xp}</b><span>XP</span></div></section>
    <div class="fim-nivel"><span>Nível ${nv.n}</span><div class="barra"><i style="--p:${Math.max(0.03, nv.pct)}"></i></div><span>${icone('fogo')}${seq}</span></div>
    <section class="cartao"><p class="rot">QUANTO ESFORÇO FOI?</p><div class="rpe">${Array.from({ length: 10 }, (_, i) => `<button data-p="rpe" data-v="${i + 1}">${i + 1}</button>`).join('')}</div>
      <p class="rpe-leg"><span>muito leve</span><span>no limite</span></p></section>
    <section class="cartao"><p class="rot">SENTIU AZIA OU QUEIMAÇÃO?</p><div class="duo"><button class="opcao" data-p="azia" data-v="0">Não</button><button class="opcao" data-p="azia" data-v="1">Sim</button></div></section>
    ${proximoPasso()}
    <p class="fraco pequeno" id="pl-falta">Marque o esforço e a azia para concluir.</p><button class="bt primario grande" id="pl-concluir" data-p="concluir" disabled>Concluir</button></div>`;
}

function proximoPasso() {
  const faltam = st.missoesDeHoje().filter((m) => !m.completa && m.especial !== 'treino');
  const DIA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  let quando = '';
  for (let i = 1; i <= 7 && !quando; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    const t = treinoDoDia(d.getDay(), st.S.perfil.diaEsporte);
    if (t) quando = `${i === 1 ? 'amanhã' : DIA[d.getDay()]} · ${TREINOS[t].nome}`;
  }
  return `<section class="cartao proximo"><p class="rot">O QUE VEM AGORA</p>
    ${faltam.length ? `<p>${faltam.length === 1 ? 'Falta 1 missão' : 'Faltam ' + faltam.length + ' missões'} para fechar o dia:</p><ul>${faltam.slice(0, 3).map((m) => `<li>${icone(m.icone)}${m.nome}</li>`).join('')}</ul>` : `<p>${icone('check')} Todas as missões de hoje estão feitas.</p>`}
    <p class="fraco">${icone('calendario')}Próximo treino: ${quando}</p></section>`;
}

function encerrar() {
  const aoSair = P?.opts.aoSair;
  cancelAnimationFrame(P?.raf); som.pararBatida(); som.calarVoz(); tirarBatida?.();
  document.removeEventListener('visibilitychange', aoVoltar);
  trava?.release?.().catch(() => {}); trava = null;
  P = null; sobre.onclick = null; fechar();
  aoSair?.();
}
