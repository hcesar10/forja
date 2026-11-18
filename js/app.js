import { EX, TREINOS, NIVEIS, DICAS, ALERTAS, TITULOS, CONQUISTAS, MISSOES, buildTreino, resumoTreino, treinoDoDia } from './data.js';
import * as st from './store.js';
import { S } from './store.js';
import { icone, heroi } from './art.js';
import * as som from './audio.js';
import { abrirPlayer } from './player.js';

const $ = (s, el = document) => el.querySelector(s);
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const app = $('#app'), sobre = $('#sobre'), abas = $('#abas');
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const D1 = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const instalado = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
let instalar = null; // evento beforeinstallprompt guardado
let rota = 'hoje';
const reduz = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let xpVisto = null; // { n, p } da barra de XP na última vez, para ela encher a partir dali
let tocou = null; // { id, xp } da missão recém-marcada: anima o ícone e mostra o +XP voando
const numVisto = {}; // valor anterior de cada número de .tres, para contar a partir dele
const anelVisto = {}; // fração anterior de cada anel do Hoje, para ele fechar a partir dali
// Som e vibração depois da pintura: criar o AudioContext dentro do toque custava ~160 ms de INP (18/11).
const depoisDePintar = (fn) => requestAnimationFrame(() => setTimeout(fn, 0));

// ---------- utilidades de tela
function aviso(html, cls = '') {
  const el = document.createElement('div');
  el.className = 'aviso ' + cls; el.innerHTML = html;
  $('#avisos').append(el);
  setTimeout(() => el.classList.add('sai'), 1700);
  setTimeout(() => el.remove(), 2200);
}
function modal(html, cls = '') {
  sobre.innerHTML = `<div class="fundo" data-a="fechar"></div><div class="folha ${cls}" role="dialog" aria-modal="true">${html}</div>`;
  sobre.className = 'aberto';
}
export function fechar() { sobre.className = ''; setTimeout(() => { if (!sobre.className) sobre.innerHTML = ''; }, 250); }

/** Mostra o que o XP destravou: nível novo, estágio novo, conquistas. */
export function comemorar(r, xp) {
  if (xp) { aviso(`${icone('estrela')}<b>+${xp} XP</b>`, 'xp'); depoisDePintar(() => { som.iniciarAudio(); som.somXP(); som.vibrar(30); }); }
  if (r?.perfeito) setTimeout(() => aviso(`${icone('trofeu')}<b>Dia perfeito</b> +50 XP`, 'ouro'), 500);
  r?.novas?.forEach((c, i) => setTimeout(() => aviso(`${icone('trofeu')}<span><b>${esc(c.nome)}</b><br>${esc(c.desc)}</span>`, 'ouro'), 900 + i * 700));
  const evo = st.estagioNovo(); // o personagem muda pelos treinos completos, não pelo nível
  if (r?.subiu || evo >= 0) setTimeout(() => {
    som.somNivel(); som.vibrar([40, 60, 40, 60, 120]);
    const e = evo >= 0 ? evo : st.estagio(), falta = st.faltamTreinos();
    modal(`<div class="subiu"><div class="raios"></div>${heroi(e, { id: 'm' })}<p class="rot">NÍVEL ${r?.subiu || st.nivel().n}</p>
      <h2>${evo >= 0 ? 'Você evoluiu: ' + TITULOS[e] : 'Subiu de nível'}</h2>
      <p class="fraco">${evo >= 0 ? 'Seu personagem ganhou um visual novo.' : falta ? `Faltam ${falta} ${falta === 1 ? 'treino' : 'treinos'} para a próxima evolução.` : 'Seu personagem está no auge.'}</p>
      <button class="bt primario" data-a="fechar">Continuar</button></div>`, 'centro');
  }, 600);
}

// ---------- telas
function cabecalhoHeroi() {
  const nv = st.nivel(), e = st.estagio(), p = Math.max(0.03, nv.pct);
  const de = !xpVisto ? p : xpVisto.n === nv.n ? xpVisto.p : 0.03;
  const ganhou = xpVisto && (nv.n > xpVisto.n || p > xpVisto.p);
  xpVisto = { n: nv.n, p };
  return `<section class="cartao heroi-cartao">
    <div class="heroi-arte">${heroi(e)}</div>
    <div class="heroi-info">
      <p class="rot">${TITULOS[e].toUpperCase()}</p>
      <h2>Nível ${nv.n}</h2>
      <div class="barra${ganhou ? ' ganhou' : ''}" role="progressbar" aria-valuenow="${Math.round(nv.pct * 100)}" aria-valuemin="0" aria-valuemax="100"><i style="--p:${de}" data-p="${p}"></i></div>
      <p class="fraco">${nv.resto} de ${nv.falta} XP</p>
    </div></section>`;
}

function telaHoje() {
  const agora = new Date(), h = agora.getHours();
  const ola = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const seq = st.sequencia(), u7 = st.ultimos7(), ms = st.missoesDeHoje();
  const feitas = ms.filter((m) => m.completa).length;
  const min = st.minutosDaSemana();
  const tipo = treinoDoDia(agora.getDay(), S.perfil.diaEsporte);
  const feitoTreino = st.dia().m.treino >= 1;
  let cartaoTreino = '';
  if (tipo) {
    const fases = buildTreino(tipo, optsTreino()), r = resumoTreino(fases, S.perfil.kg), t = TREINOS[tipo];
    cartaoTreino = `<section class="cartao treino-dia ${feitoTreino ? 'feito' : ''}" style="--cor:${t.cor}">
      <img src="clips/${String(t.capa).padStart(2, '0')}.jpg" alt="" loading="lazy">
      <div class="treino-txt"><p class="rot">${feitoTreino ? 'TREINO FEITO' : 'TREINO DE HOJE'} · ${NIVEIS[S.nivelTreino - 1].nome.toUpperCase()}</p>
        <h2>${t.nome}</h2><p class="chips"><span>${icone('relogio')}${r.min} min</span><span>${icone('fogo')}${r.kcal} kcal</span><span>${icone('estrela')}${r.xp} XP</span></p>
        <button class="bt ${feitoTreino ? 'fantasma' : 'primario'} grande" data-a="treino" data-t="${tipo}">${icone('play')}${feitoTreino ? 'Fazer de novo' : 'Começar treino'}</button></div></section>`;
  }
  const ultMed = S.medidas[S.medidas.length - 1];
  const pedirMedida = !ultMed || st.numeroDoDia() - st.numeroDoDia(ultMed.d) >= 7;
  const dica = DICAS[st.numeroDoDia() % DICAS.length];
  app.innerHTML = `<main class="tela">
    <header class="topo"><div><p class="fraco">${DIAS[agora.getDay()]}, ${agora.getDate()}/${agora.getMonth() + 1}</p><h1>${ola}${S.perfil.nome ? ', ' + esc(S.perfil.nome) : ''}</h1></div>
      <button class="seq" data-a="sequencia" aria-label="Sequência de ${seq.seq} dias">${icone('fogo')}<b>${seq.seq}</b></button></header>
    ${cabecalhoHeroi()}
    <section class="tres aneis" aria-live="off">
      <div>${anel(feitas, ms.length, 'var(--verde)', 'm')}<span>missões hoje</span></div>
      <div>${anel(min, 150, 'var(--laranja)', 'min')}<span>min na semana</span></div>
      <div>${anel(u7.total, 7, 'var(--azul)', 'd')}<span>dias ativos</span></div>
    </section>
    ${!instalado() && instalar ? `<button class="cartao linha-acao" data-a="instalar">${icone('baixar')}<span><b>Instalar o app</b><br><small>Abre em tela cheia e funciona sem internet</small></span>${icone('seta')}</button>` : ''}
    ${cartaoTreino}
    <h3 class="sec">Missões de hoje</h3>
    <section class="missoes">${ms.filter((m) => m.especial !== 'treino').map(linhaMissao).join('')}</section>
    ${pedirMedida ? `<button class="cartao linha-acao" data-a="medir">${icone('regua')}<span><b>Medida da semana</b><br><small>Cintura e peso. É o que mostra a barriga diminuindo.</small></span>${icone('seta')}</button>` : ''}
    <section class="cartao dica"><p class="rot">DICA DO DIA</p><p>${dica}</p></section>
  </main>`;
}

/** Anel que fecha conforme o valor chega na meta (referência: anéis do Apple Fitness). */
function anel(v, max, cor, k) {
  const p = Math.min(1, v / max), de = anelVisto[k] ?? 0;
  anelVisto[k] = p;
  const fechou = p >= 1 && de < 1 && anelVisto.pronto ? ' fechou' : '';
  return `<span class="anel${p >= 1 ? ' cheio' : ''}${fechou}" style="--c:${cor}"><svg viewBox="0 0 64 64" aria-hidden="true"><circle class="trilho" cx="32" cy="32" r="27"/><circle class="arco" cx="32" cy="32" r="27" pathLength="100" style="--de:${de}" data-p="${p}"/></svg><b>${v}<small>/${max}</small></b></span>`;
}

function linhaMissao(m) {
  const pips = m.meta > 1 ? `<div class="pips">${Array.from({ length: m.meta }, (_, i) => `<i class="${i < m.feito ? 'on' : ''}"></i>`).join('')}<small>${m.feito} de ${m.meta}</small></div>` : '';
  const sub = m.gatilho || m.sub || '';
  const acao = m.especial === 'resp' ? 'respirar' : 'marcar';
  const anima = tocou?.id === m.id ? (m.completa ? ' tocou acabou' : ' tocou') : '';
  return `<button class="missao ${m.completa ? 'ok' : ''}${anima}" data-a="${m.completa ? 'nada' : acao}" data-id="${m.id}" ${m.completa ? 'aria-disabled="true"' : ''}>
    <span class="tile">${icone(m.icone)}</span>
    <span class="mtxt"><b>${m.nome}</b>${sub ? `<small>${esc(sub)}</small>` : ''}${pips}</span>
    <span class="mfim">${m.completa ? icone('check') : `<em>+${m.xp}</em>`}</span></button>`;
}

const optsTreino = () => ({ nivel: S.nivelTreino, seed: st.numeroDoDia(), descarga: st.semana() % 12 === 0 });

function telaTreinos() {
  const n = NIVEIS[S.nivelTreino - 1], sem = st.semana();
  app.innerHTML = `<main class="tela">
    <header class="topo"><div><p class="fraco">Semana ${sem}${sem % 12 === 0 ? ' · semana leve' : ''}</p><h1>Treinos</h1></div></header>
    <section class="cartao nivel-treino"><p class="rot">SEU NÍVEL DE TREINO</p>
      <div class="degraus">${NIVEIS.map((x, i) => `<i class="${i < S.nivelTreino ? 'on' : ''}"></i>`).join('')}</div>
      <h2>${S.nivelTreino}. ${n.nome}</h2><p class="fraco">${n.alvo}</p>
      <div class="duo"><button class="bt fantasma" data-a="nivel-treino" data-d="-1"${S.nivelTreino <= 1 ? ' disabled' : ''}>Mais leve</button><button class="bt fantasma" data-a="nivel-treino" data-d="1"${S.nivelTreino >= 5 ? ' disabled' : ''}>Mais puxado</button></div>
      <p class="fraco pequeno">Achou fácil? Suba aqui. O app também sugere subir depois de 4 treinos na semana sem achar pesado e sem azia.</p></section>
    <section class="lista-treinos">${Object.entries(TREINOS).map(([k, t]) => {
      const r = resumoTreino(buildTreino(k, optsTreino()), S.perfil.kg);
      return `<button class="cartao treino-item" data-a="treino" data-t="${k}" style="--cor:${t.cor}">
        <img src="clips/${String(t.capa).padStart(2, '0')}.jpg" alt="" loading="lazy">
        <span><b>${t.nome}</b><small>${t.sub}</small><span class="chips"><span>${icone('relogio')}${r.min} min</span>${r.forteMin ? `<span>${icone('raio')}${r.forteMin} forte</span>` : `<span>${icone('fogo')}${r.kcal} kcal</span>`}</span></span><i class="bola-play">${icone('play')}</i></button>`;
    }).join('')}</section>
    <section class="cartao alerta"><p class="rot">${icone('alerta')} PARE E PROCURE UM MÉDICO SE TIVER</p><div class="alerta-lista">${ALERTAS.map((a) => `<p>${icone('alerta')}<span>${a}</span></p>`).join('')}</div>
      <p class="fraco pequeno">Treine de estômago vazio ou 2 horas depois de comer. Solte o ar na hora da força.</p></section>
  </main>`;
}

const ddmm = (k) => k.slice(8) + '/' + k.slice(5, 7);
function grafico(pontos, cor, unidade) {
  if (pontos.length < 2) return `<div class="vazio">${icone('regua')}<p>Registre a medida toda semana.<br>Com duas medidas o gráfico aparece aqui.</p></div>`;
  const vs = pontos.map((p) => p.v), mn = Math.min(...vs), mx = Math.max(...vs), faixa = mx - mn || 1;
  const X = (i) => 12 + (i * 276) / (pontos.length - 1), Y = (v) => 12 + (1 - (v - mn) / faixa) * 76;
  const linha = pontos.map((p, i) => `${X(i).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' ');
  const dif = (vs[vs.length - 1] - vs[0]).toFixed(1);
  return `<svg class="graf" viewBox="0 0 300 100" preserveAspectRatio="none"><polyline points="${linha}" fill="none" stroke="${cor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    ${pontos.map((p, i) => `<circle cx="${X(i)}" cy="${Y(p.v)}" r="${i === pontos.length - 1 ? 5.5 : 3}" fill="${cor}" ${i === pontos.length - 1 ? 'stroke="#141a22" stroke-width="2.5"' : ''}/>`).join('')}</svg>
    <p class="graf-leg"><span>${vs[0]} ${unidade}<small>${ddmm(pontos[0].d)}</small></span><b style="color:${cor}">${dif > 0 ? '+' : ''}${dif} ${unidade}</b><span>${vs[vs.length - 1]} ${unidade}<small>${ddmm(pontos[pontos.length - 1].d)}</small></span></p>`;
}

function telaProgresso() {
  const cint = S.medidas.filter((m) => m.cintura).map((m) => ({ v: m.cintura, d: m.d })), peso = S.medidas.filter((m) => m.kg).map((m) => ({ v: m.kg, d: m.d }));
  const seq = st.sequencia(), tot = S.treinos.reduce((s, t) => s + t.min, 0);
  const dias = Array.from({ length: 35 }, (_, i) => { const k = st.maisDias(st.hoje(), i - 34), d = S.dias[k]; return { k, xp: d?.xp || 0, perfeito: d?.perfeito }; });
  const seg0 = st.maisDias(st.hoje(), -((new Date().getDay() + 6) % 7)); // segunda desta semana
  const semIni = S.inicio ? st.maisDias(S.inicio, -((st.deChave(S.inicio).getDay() + 6) % 7)) : seg0;
  const semanas = Array.from({ length: 8 }, (_, i) => {
    const ini = st.maisDias(seg0, (i - 7) * 7), fim = st.maisDias(ini, 6);
    return { ini, m: S.treinos.filter((t) => t.d >= ini && t.d <= fim).reduce((s, t) => s + t.min, 0) };
  }).filter((x) => x.ini >= semIni);
  const mxSem = Math.max(165, ...semanas.map((x) => x.m));
  app.innerHTML = `<main class="tela">
    <header class="topo"><div><p class="fraco">O que mudou de verdade</p><h1>Progresso</h1></div>
      <button class="bt fantasma" data-a="medir">${icone('mais')}Medida</button></header>
    <section class="cartao"><p class="rot">CINTURA</p>${grafico(cint, '#34d399', 'cm')}</section>
    <section class="cartao"><p class="rot">PESO</p>${grafico(peso, '#e5e7eb', 'kg')}</section>
    <section class="tres" aria-live="off"><div><b>${S.treinos.length}</b><span>treinos</span></div><div><b>${tot}</b><span>minutos</span></div><div><b>${seq.seq}</b><span>dias seguidos</span></div></section>
    <section class="cartao"><p class="rot">MINUTOS POR SEMANA · META 150</p>
      <div class="barras" style="grid-template-columns:repeat(${semanas.length}, minmax(0, 56px))">${semanas.map((x, i) => `<div class="${i === semanas.length - 1 ? 'atual' : ''}" style="--i:${i}"><div class="col"><em style="bottom:${(x.m / mxSem) * 100}%">${x.m}</em><i style="height:${Math.max(2, (x.m / mxSem) * 100)}%" class="${x.m >= 150 ? 'bateu' : ''}"></i></div><span>${i === semanas.length - 1 ? 'esta' : ddmm(x.ini)}</span></div>`).join('')}<hr style="bottom:calc(20px + ${150 / mxSem} * (100% - 20px))"></div>
      <p class="fraco pequeno">A linha tracejada é a meta de 150 minutos. Cada barra é uma semana, pela data da segunda-feira.</p></section>
    <section class="cartao"><p class="rot">ÚLTIMOS 35 DIAS</p><div class="calend">${dias.map((d, i) => `<i class="${d.perfeito ? 'p' : d.xp >= 120 ? 'a3' : d.xp >= 50 ? 'a2' : d.xp > 0 ? 'a1' : ''}" title="${d.k}" style="--i:${i}"></i>`).join('')}</div>
      <p class="fraco pequeno">Mais claro = mais missões. Dourado = dia perfeito. Você tem ${seq.congelamentos} de 2 congelamentos nesta semana.</p></section>
    <h3 class="sec">Conquistas · ${Object.keys(S.conquistas).length} de ${CONQUISTAS.length}</h3>
    <section class="conq">${CONQUISTAS.map((c) => `<div class="${S.conquistas[c.id] ? 'on' : ''}">${icone(S.conquistas[c.id] ? c.ic : 'cadeado')}<b>${c.nome}</b><small>${c.desc}</small></div>`).join('')}</section>
  </main>`;
}

function telaPerfil() {
  const p = S.perfil, a = S.ajustes;
  const chave = (id, on, rot) => `<button class="chave ${on ? 'on' : ''}" data-a="ajuste" data-id="${id}" role="switch" aria-checked="${on}"><span>${rot}</span><i></i></button>`;
  app.innerHTML = `<main class="tela">
    <header class="topo"><div><p class="fraco">Ajustes e dados</p><h1>Perfil</h1></div></header>
    <section class="cartao lista-acoes">
      ${linha('usuario', 'Nome', 'nome', p.nome || 'Sem nome')}${linha('grafico', 'Peso', 'kg', p.kg + ' kg')}${linha('regua', 'Altura', 'altura', p.altura + ' cm')}
      ${linha('lua', 'Hora de deitar', 'dormir', p.dormir)}${linha('relogio', 'Hora do treino', 'treinoHora', p.treinoHora)}${linha('bola', 'Dia de esporte', 'esporte', ESPORTE.find((x) => x[0] === p.diaEsporte)?.[1] || 'Não jogo')}
    </section>
    <h3 class="sec">Som do treino</h3>
    <section class="cartao">${chave('musica', a.musica, 'Batida')}${chave('voz', a.voz, 'Voz que guia o treino')}</section>
    <h3 class="sec">Meus gatilhos</h3>
    <section class="cartao lista-acoes">${MISSOES.filter((m) => m.gatilhos).map((m) => `<button data-a="escolher" data-q="g-${m.id}">${icone(m.icone)}<span>${m.nome}<small>${esc(p.gatilhos[m.id] || 'Sem gatilho')}</small></span>${icone('seta')}</button>`).join('')}</section>
    <p class="fraco pequeno centro">Ligar a missão a um momento do dia aumenta a chance de cumprir.</p>
    <h3 class="sec">App</h3>
    <section class="cartao lista-acoes">
      ${instalado() ? `<p class="feito-linha">${icone('check')}App instalado</p>` : `<button data-a="instalar">${icone('baixar')}<span>Instalar o app</span>${icone('seta')}</button>`}
      <button data-a="lembretes">${icone('calendario')}<span>Lembretes no calendário<small>Dormir, treino e jantar, com alarme</small></span>${icone('seta')}</button>
      <button data-a="exportar">${icone('escudo')}<span>Salvar backup<small>${S.backupEm ? 'Último: ' + S.backupEm.split('-').reverse().join('/') : 'Nenhum backup ainda'}</small></span>${icone('seta')}</button>
      <button data-a="importar">${icone('baixar')}<span>Restaurar backup</span>${icone('seta')}</button>
      <button data-a="apagar" class="perigo">${icone('x')}<span>Apagar tudo e recomeçar</span>${icone('seta')}</button>
    </section>
    <p class="fraco pequeno centro">Seus dados ficam só neste aparelho. Este app não substitui consulta médica.</p>
    <input type="file" id="arq" accept="application/json,.json" hidden>
  </main>`;
}

const ESPORTE = [[-1, 'Não jogo'], [6, 'Sábado'], [0, 'Domingo'], [1, 'Segunda'], [2, 'Terça'], [3, 'Quarta'], [4, 'Quinta'], [5, 'Sexta']];
const linha = (ic, rotulo, qual, valor) => `<button data-a="escolher" data-q="${qual}" class="com-valor">${icone(ic)}<span>${rotulo}</span><b>${esc(valor)}</b>${icone('seta')}</button>`;
const seletor = (rotulo, qual, valor) => `<div class="campo"><span class="campo-rot">${rotulo}</span><button class="seletor" data-a="escolher" data-q="${qual}"><span>${esc(valor)}</span>${icone('seta')}</button></div>`;
const CAMPOS = { nome: ['Como eu te chamo?', 'text', ''], kg: ['Peso (kg)', 'number', 'decimal'], altura: ['Altura (cm)', 'number', 'numeric'], dormir: ['Hora de deitar', 'time', ''], treinoHora: ['Hora do treino', 'time', ''] };
function abrirEscolha(qual) {
  if (CAMPOS[qual]) {
    const [titulo, tipo, modo] = CAMPOS[qual];
    return modal(`<h2>${titulo}</h2><input id="cp" type="${tipo}" ${modo ? `inputmode="${modo}"` : ''} value="${esc(S.perfil[qual])}" maxlength="20" autocomplete="off">
      <button class="bt primario grande" data-a="salvar-campo" data-q="${qual}">Salvar</button><button class="bt fantasma" data-a="fechar">Cancelar</button>`);
  }
  const g = qual.startsWith('g-') ? MISSOES.find((m) => m.id === qual.slice(2)) : null;
  const atual = g ? S.perfil.gatilhos[g.id] || '' : S.perfil.diaEsporte;
  const ops = g ? [...(S.perfil.pronto ? [['', 'Sem gatilho']] : []), ...g.gatilhos.map((x) => [x, x])] : ESPORTE;
  modal(`<h2>${g ? g.nome : 'Dia de esporte'}</h2>${g ? '<p class="fraco">Quando você vai fazer?</p>' : ''}${ops.map(([v, t]) => `<button class="opcao ${v === atual ? 'on' : ''}" data-a="escolhido" data-q="${qual}" data-v="${esc(v)}">${esc(t)}</button>`).join('')}`);
}

const TELAS = { hoje: telaHoje, treinos: telaTreinos, progresso: telaProgresso, perfil: telaPerfil };
function ir(r, anim = true) {
  rota = TELAS[r] ? r : 'hoje';
  const troca = () => {
    TELAS[rota]();
    if (anim) app.firstElementChild?.classList.add('entra');
    abas.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.ir === rota));
    abas.style.setProperty('--aba', Object.keys(TELAS).indexOf(rota));
    scrollTo(0, 0);
    depois();
  };
  if (anim && document.startViewTransition && !reduz()) document.startViewTransition(troca); else troca();
  if (location.hash.slice(1) !== rota) history.replaceState(null, '', '#' + rota);
}
export const redesenhar = () => { const y = scrollY; TELAS[rota](); scrollTo(0, y); depois(); };

/** Depois de desenhar a tela: barra de XP enche, números contam, +XP voa da missão marcada. */
function depois() {
  const r = reduz();
  app.querySelectorAll('.barra i[data-p]').forEach((i) => {
    if (r) i.style.setProperty('--p', i.dataset.p);
    else requestAnimationFrame(() => requestAnimationFrame(() => i.style.setProperty('--p', i.dataset.p)));
  });
  app.querySelectorAll('.arco[data-p]').forEach((c) => {
    const fim = () => c.style.setProperty('--de', c.dataset.p);
    if (r) fim(); else requestAnimationFrame(() => requestAnimationFrame(fim));
  });
  anelVisto.pronto = true;
  app.querySelectorAll('.tres b').forEach((b, k) => {
    const no = b.firstChild, alvo = parseInt(no.textContent, 10), chave = rota + k, de = numVisto[chave] ?? 0;
    numVisto[chave] = alvo;
    if (!r && de !== alvo) contar(no, de, alvo);
  });
  if (tocou) {
    const el = app.querySelector(`.missao[data-id="${tocou.id}"]`);
    if (el && tocou.xp && !r) el.insertAdjacentHTML('beforeend', `<span class="voa" aria-hidden="true">+${tocou.xp} XP</span>`);
    tocou = null;
  }
}
function contar(no, de, ate) {
  const t0 = performance.now(), dur = 650;
  no.textContent = de;
  const passo = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    no.textContent = Math.round(de + (ate - de) * (1 - (1 - k) ** 3));
    if (k < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

// ---------- boas-vindas (8 telas; cada resposta muda algo no plano — BAR 3.10)
const ob = { i: 0, folego: 1 };
function boasVindas() {
  abas.hidden = true;
  const p = S.perfil, total = 8;
  const passos = [
    () => `<div class="ob-arte">${heroi(0)}</div><h1>Este é você no nível 1</h1><p class="fraco">Cada coisa boa que você faz por você dá XP. Com XP ele evolui.</p>
      <p class="ob-missao">Primeira missão: puxe o ar bem fundo pela barriga e solte devagar.</p>
      <button class="bt primario grande" data-a="ob-primeira">${icone('check')}Respirei</button>`,
    () => `<h1>Como eu te chamo?</h1><input class="ob-campo" id="ob-nome" maxlength="20" placeholder="Seu nome" value="${esc(p.nome)}" autocomplete="off">
      <button class="bt primario grande" data-a="ob-prox">Continuar</button>`,
    () => `<h1>Seu ponto de partida</h1><p class="fraco">O peso calcula as calorias de cada treino. A cintura mostra a barriga diminuindo.</p>
      <div class="duo"><label>Peso (kg)<input id="ob-kg" type="number" inputmode="decimal" value="${p.kg}"></label><label>Altura (cm)<input id="ob-alt" type="number" inputmode="numeric" value="${p.altura}"></label></div>
      <label>Cintura na altura do umbigo (cm), se souber<input id="ob-cint" type="number" inputmode="decimal" placeholder="Pode deixar para depois"></label>
      <button class="bt primario grande" data-a="ob-prox">Continuar</button>`,
    () => `<h1>Como está o fôlego?</h1><p class="fraco">Subindo dois lances de escada sem parar, você:</p>
      ${[['Fica sem ar', 1], ['Cansa, mas chega', 1], ['Chega bem', 2]].map(([t, n], i) => `<button class="opcao ${ob.folego === i ? 'on' : ''}" data-a="ob-folego" data-i="${i}" data-n="${n}">${t}<small>Começa no nível ${n}: ${NIVEIS[n - 1].nome}</small></button>`).join('')}
      <button class="bt primario grande" data-a="ob-prox">Continuar</button>`,
    () => `<h1>Seus horários</h1><p class="fraco">A missão de sono e os lembretes usam estes horários.</p>
      <div class="duo"><label>Deitar às<input id="ob-dormir" type="time" value="${p.dormir}"></label><label>Treinar às<input id="ob-treino" type="time" value="${p.treinoHora}"></label></div>
      <p class="ob-nota">Para dormir 7 horas, o despertador não pode tocar antes de ${maisHoras(p.dormir, 7)}.</p>
      <button class="bt primario grande" data-a="ob-prox">Continuar</button>`,
    () => `<h1>Joga algum esporte?</h1><p class="fraco">No dia do jogo o esporte vale como treino.</p>
      ${[[-1, 'Não jogo'], [6, 'Sábado'], [0, 'Domingo'], [3, 'Quarta'], [4, 'Quinta']].map(([v, t]) => `<button class="opcao ${p.diaEsporte === v ? 'on' : ''}" data-a="ob-esporte" data-v="${v}">${t}</button>`).join('')}
      <div class="semana">${[1, 2, 3, 4, 5, 6, 0].map((d) => { const t = treinoDoDia(d, p.diaEsporte); return `<div class="${d === p.diaEsporte ? 'esp' : t ? 'tr' : ''}"><b>${D1[d]}</b><span>${d === p.diaEsporte ? 'jogo' : t === 'A' ? 'força' : t === 'B' ? 'tiros' : 'livre'}</span></div>`; }).join('')}</div>
      <button class="bt primario grande" data-a="ob-prox">Continuar</button>`,
    () => `<h1>Quando você vai fazer?</h1><p class="fraco">Escolha o momento do dia de cada missão.</p>
      ${['sono', 'caminhada', 'jantar'].map((id) => { const m = MISSOES.find((x) => x.id === id); p.gatilhos[id] ||= m.gatilhos[0]; return seletor(m.nome, 'g-' + id, p.gatilhos[id]); }).join('')}
      <button class="bt primario grande" data-a="ob-prox">Continuar</button>`,
    () => { const t = treinoDoDia(new Date().getDay(), p.diaEsporte); const r = t ? resumoTreino(buildTreino(t, { nivel: S.nivelTreino, seed: st.numeroDoDia() }), p.kg) : null;
      return `<div class="ob-arte">${heroi(0)}</div><h1>Tudo pronto${p.nome ? ', ' + esc(p.nome) : ''}</h1>
      <ul class="ob-resumo"><li>${icone('haltere')}Nível de treino: <b>${NIVEIS[S.nivelTreino - 1].nome}</b></li>
      <li>${icone('raio')}${r ? `Hoje: <b>${TREINOS[t].nome}</b>, ${r.min} min, ${r.kcal} kcal` : 'Hoje é dia livre: faça as missões'}</li>
      <li>${icone('fogo')}Uma missão por dia mantém a sequência</li><li>${icone('escudo')}2 dias de folga por semana sem perder nada</li></ul>
      <button class="bt primario grande" data-a="ob-fim">Começar</button>`; },
  ];
  app.innerHTML = `<main class="tela ob entra ob-${ob.i}"><div class="ob-prog">${Array.from({ length: total }, (_, i) => `<i class="${i <= ob.i ? 'on' : ''}"></i>`).join('')}</div>${passos[ob.i]()}</main>`;
}
const maisHoras = (hhmm, h) => { const [a, b] = hhmm.split(':').map(Number); return `${String((a + h) % 24).padStart(2, '0')}:${String(b).padStart(2, '0')}`; };
const menosMin = (hhmm, min) => { const [a, b] = hhmm.split(':').map(Number); const t = (a * 60 + b - min + 1440) % 1440; return [Math.floor(t / 60), t % 60]; };

function lerOnboarding() {
  const p = S.perfil, v = (id) => $('#' + id)?.value;
  if (ob.i === 1) p.nome = (v('ob-nome') || '').trim();
  if (ob.i === 2) {
    p.kg = +v('ob-kg') || p.kg; p.altura = +v('ob-alt') || p.altura;
    const c = +v('ob-cint');
    if (!S.medidas.length) S.medidas.push({ d: st.hoje(), kg: p.kg, ...(c ? { cintura: c } : {}) });
  }
  if (ob.i === 4) { p.dormir = v('ob-dormir') || p.dormir; p.treinoHora = v('ob-treino') || p.treinoHora; }
  st.salvar();
}

// ---------- respiração guiada (5 min; puxa 4 s, solta 6 s — Ong 2018)
let resp = null;
function abrirRespiracao() {
  som.iniciarAudio();
  const total = new URLSearchParams(location.search).has('rapido') ? 20 : 300;
  sobre.innerHTML = `<div class="resp"><button class="fechar-x" data-a="resp-sair" aria-label="Fechar">${icone('x')}</button>
    <p class="rot">RESPIRAÇÃO PELA BARRIGA</p><div class="bolha"><i></i><b id="resp-txt">Puxe</b></div>
    <p class="fraco" id="resp-dica">Mão na barriga. Ela sobe quando o ar entra.</p><p class="resp-tempo" id="resp-t">5:00</p></div>`;
  sobre.className = 'aberto cheio';
  const ini = performance.now(); let fase = '';
  const bolha = $('.bolha i'), txt = $('#resp-txt'), tt = $('#resp-t');
  resp = setInterval(() => {
    const s = (performance.now() - ini) / 1000, c = s % 10, f = c < 4 ? 'Puxe' : 'Solte';
    if (f !== fase) { fase = f; txt.textContent = f; bolha.style.transitionDuration = f === 'Puxe' ? '4s' : '6s'; if (reduz()) bolha.style.opacity = f === 'Puxe' ? '1' : '.4'; else bolha.style.transform = f === 'Puxe' ? 'scale(1)' : 'scale(.45)'; som.vibrar(f === 'Puxe' ? 40 : [20, 40, 20]); }
    const r = Math.max(0, Math.ceil(total - s));
    tt.textContent = `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`;
    if (s >= total) { clearInterval(resp); resp = null; fechar(); som.somFeito(); const x = st.marcar('respiracao'); if (x) { tocou = { id: 'respiracao', xp: x.xp }; comemorar(x, x.xp); } redesenhar(); }
  }, 100);
}

// ---------- medidas
function abrirMedida() {
  const u = S.medidas[S.medidas.length - 1];
  modal(`<h2>Medida da semana</h2><p class="fraco">De manhã, antes de comer. Fita na altura do umbigo, sem apertar.</p>
    <div class="duo"><label>Cintura (cm)<input id="md-c" type="number" inputmode="decimal" placeholder="${u?.cintura || 'ex.: 104'}"></label><label>Peso (kg)<input id="md-k" type="number" inputmode="decimal" placeholder="${u?.kg || S.perfil.kg}"></label></div>
    <button class="bt primario grande" data-a="salvar-medida">Salvar</button><button class="bt fantasma" data-a="fechar">Agora não</button>`);
}

// ---------- lembretes: arquivo de calendário com alarme (BAR 4.7)
function baixar(nome, texto, tipo) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([texto], { type: tipo })); a.download = nome;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
function lembretes() {
  const p = S.perfil, d = st.hoje().replaceAll('-', ''), hm = (h, m) => `${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
  const ev = (uid, titulo, [h, m], regra) => `BEGIN:VEVENT\r\nUID:${uid}@forja\r\nDTSTAMP:${d}T000000\r\nDTSTART:${d}T${hm(h, m)}\r\nDURATION:PT15M\r\nRRULE:${regra}\r\nSUMMARY:${titulo}\r\nBEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:${titulo}\r\nTRIGGER:PT0M\r\nEND:VALARM\r\nEND:VEVENT\r\n`;
  const ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Forja//PT\r\n' +
    ev('dormir', 'Forja: desacelerar para dormir', menosMin(p.dormir, 45), 'FREQ=DAILY') +
    ev('jantar', 'Forja: jantar agora (3 h antes de deitar)', menosMin(p.dormir, 195), 'FREQ=DAILY') +
    ev('treino', 'Forja: treino do dia', p.treinoHora.split(':').map(Number), 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR') + 'END:VCALENDAR\r\n';
  baixar('forja-lembretes.ics', ics, 'text/calendar');
  modal(`<h2>Lembretes baixados</h2><p class="fraco">Abra o arquivo <b>forja-lembretes.ics</b> e toque em "Adicionar" no calendário do celular. Ele cria três alarmes: desacelerar para dormir, jantar e treino.</p><button class="bt primario grande" data-a="fechar">Entendi</button>`);
}

// ---------- ações
const acoes = {
  nada() {},
  fechar,
  marcar(el) { const x = st.marcar(el.dataset.id); if (x) { tocou = { id: el.dataset.id, xp: x.xp }; comemorar(x, x.xp); if (x.completa) depoisDePintar(som.somFeito); redesenhar(); st.pedirPersistencia(); } },
  respirar: abrirRespiracao,
  'resp-sair'() { clearInterval(resp); resp = null; fechar(); },
  treino(el) {
    const tipo = el.dataset.t, fases = buildTreino(tipo, optsTreino());
    const r = resumoTreino(fases, S.perfil.kg), t = TREINOS[tipo];
    const exs = [...new Set(fases.filter((x) => !['prep', 'desc', 'aquece', 'leve', 'mob', 'resp'].includes(x.tipo)).map((x) => x.ex))];
    modal(`<p class="rot" style="color:${t.cor}">${NIVEIS[S.nivelTreino - 1].nome.toUpperCase()} · ${r.min} MIN · ${r.kcal} KCAL</p><h2>${t.nome}</h2>
      <p class="fraco">${NIVEIS[S.nivelTreino - 1].alvo}</p>
      <div class="previa">${exs.map((id) => `<figure><img src="clips/${String(id).padStart(2, '0')}.jpg" alt=""><figcaption>${EX[id].nome}</figcaption></figure>`).join('')}</div>
      <p class="fraco pequeno">Você precisa de: cadeira firme${exs.some((x) => [7, 23].includes(x)) ? ', um degrau baixo' : ''} e água. Estômago vazio ou 2 horas depois de comer.</p>
      <button class="bt primario grande" data-a="iniciar" data-t="${tipo}">${icone('play')}Iniciar</button><button class="bt fantasma" data-a="fechar">Agora não</button>`);
  },
  iniciar(el) { fechar(); som.iniciarAudio(); abrirPlayer(el.dataset.t, buildTreino(el.dataset.t, optsTreino()), { aoSair: () => { abas.hidden = false; ir(rota, false); } }); abas.hidden = true; },
  medir: abrirMedida,
  'salvar-medida'() {
    const c = +$('#md-c').value, k = +$('#md-k').value;
    if (!c && !k) return;
    const u = S.medidas[S.medidas.length - 1];
    const nova = { d: st.hoje(), kg: k || u?.kg || S.perfil.kg, ...(c ? { cintura: c } : u?.cintura ? { cintura: u.cintura } : {}) };
    if (u?.d === nova.d) S.medidas[S.medidas.length - 1] = nova; else S.medidas.push(nova);
    if (k) S.perfil.kg = k;
    fechar(); comemorar(st.ganharXP(30), 30); redesenhar();
  },
  sequencia() {
    const s = st.sequencia(), u = st.ultimos7();
    modal(`<div class="seq-modal">${icone('fogo', 'grande')}<h2>${s.seq} ${s.seq === 1 ? 'dia seguido' : 'dias seguidos'}</h2>
      <div class="semana">${u.lista.map((d) => `<div class="${d.ativo ? 'tr' : ''} ${d.hoje ? 'hj' : ''}"><b>${D1[d.dow]}</b><span>${d.ativo ? icone('check') : ''}</span></div>`).join('')}</div>
      <p><b>${u.total} dos últimos 7 dias</b> com pelo menos uma missão.</p>
      <ul class="ob-resumo"><li>${icone('check')}Uma missão no dia já mantém a sequência</li><li>${icone('escudo')}${s.congelamentos} de 2 congelamentos sobrando nesta semana</li><li>${icone('lua')}Sábado e domingo parados não quebram nada</li></ul>
      <button class="bt primario grande" data-a="fechar">Fechar</button></div>`);
  },
  escolher(el) { abrirEscolha(el.dataset.q); },
  'salvar-campo'(el) {
    const q = el.dataset.q, v = $('#cp').value.trim();
    if (v) S.perfil[q] = ['kg', 'altura'].includes(q) ? +v.replace(',', '.') || S.perfil[q] : v;
    st.salvar(); fechar(); redesenhar();
  },
  escolhido(el) {
    const q = el.dataset.q;
    if (q === 'esporte') S.perfil.diaEsporte = +el.dataset.v; else S.perfil.gatilhos[q.slice(2)] = el.dataset.v;
    st.salvar(); fechar(); S.perfil.pronto ? redesenhar() : boasVindas();
  },
  ajuste(el) { const id = el.dataset.id; S.ajustes[id] = !S.ajustes[id]; st.salvar(); redesenhar(); },
  async instalar() {
    if (instalar) { instalar.prompt(); await instalar.userChoice; instalar = null; redesenhar(); }
    else modal(`<h2>Instalar o app</h2><p class="fraco">No Chrome, toque nos três pontinhos no canto de cima e escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</p><button class="bt primario grande" data-a="fechar">Entendi</button>`);
  },
  lembretes,
  exportar() { S.backupEm = st.hoje(); st.salvar(); baixar(`forja-backup-${st.hoje()}.json`, JSON.stringify(S), 'application/json'); redesenhar(); aviso(`${icone('check')}<b>Backup salvo</b> na pasta de downloads`); },
  importar() { $('#arq').click(); },
  apagar() { modal(`<h2>Apagar tudo?</h2><p class="fraco">Nível, XP, treinos e medidas somem deste aparelho. Não dá para desfazer.</p><button class="bt perigo grande" data-a="apagar-sim">Apagar tudo</button><button class="bt fantasma" data-a="fechar">Cancelar</button>`); },
  'apagar-sim'() { st.substituir(st.novoEstado()); fechar(); ob.i = 0; boasVindas(); },
  'nivel-treino'(el) { S.nivelTreino = Math.min(5, Math.max(1, S.nivelTreino + +el.dataset.d)); st.conferirConquistas(); st.salvar(); redesenhar(); },
  'ob-primeira'() { comemorar(st.ganharXP(10), 10); st.pedirPersistencia(); ob.i = 1; setTimeout(boasVindas, 650); },
  'ob-prox'() { lerOnboarding(); ob.i++; boasVindas(); },
  'ob-folego'(el) { ob.folego = +el.dataset.i; S.nivelTreino = +el.dataset.n; boasVindas(); },
  'ob-esporte'(el) { S.perfil.diaEsporte = +el.dataset.v; boasVindas(); },
  'ob-fim'() { S.perfil.pronto = true; st.salvar(); abas.hidden = false; ir('hoje'); },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a],[data-ir]');
  if (!el) return;
  if (el.dataset.ir) return ir(el.dataset.ir);
  acoes[el.dataset.a]?.(el);
});
document.addEventListener('change', async (e) => {
  const el = e.target;
  if (el.dataset.campo) { const k = el.dataset.campo; S.perfil[k] = ['kg', 'altura', 'diaEsporte'].includes(k) ? +el.value : el.value.trim(); st.salvar(); }
  if (el.id === 'arq' && el.files[0]) {
    try { const novo = JSON.parse(await el.files[0].text()); if (!novo.perfil || !novo.dias) throw 0; st.substituir(novo); location.reload(); }
    catch { modal(`<h2>Arquivo inválido</h2><p class="fraco">Escolha um arquivo forja-backup salvo por este app.</p><button class="bt primario grande" data-a="fechar">Fechar</button>`); }
  }
});
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); instalar = e; if (S.perfil.pronto && rota === 'hoje') redesenhar(); });
addEventListener('appinstalled', () => { instalar = null; redesenhar(); });
addEventListener('hashchange', () => { const h = location.hash.slice(1); if (S.perfil.pronto && TELAS[h] && h !== rota) ir(h); });

// ---------- demonstração para testes (?demo=1) — não grava nada
function estadoDemo() {
  const s = st.novoEstado();
  Object.assign(s.perfil, { nome: 'Alex', kg: 88, pronto: true, diaEsporte: 6, gatilhos: { sono: MISSOES[1].gatilhos[0], caminhada: MISSOES[2].gatilhos[0] } });
  s.inicio = st.maisDias(st.hoje(), -40); s.nivelTreino = 3; s.xp = 2380; s.estagioVisto = 5; // sem modal de evolução na demo
  for (let i = 40; i >= 1; i--) { const k = st.maisDias(st.hoje(), -i), dow = st.deChave(k).getDay(); if (i % 9 === 4) continue; s.dias[k] = { xp: 60 + ((i * 37) % 200), m: {}, perfeito: i % 6 === 0 };
    if (dow >= 1 && dow <= 5) s.treinos.push({ d: k, tipo: dow % 2 ? 'A' : 'B', nivel: i > 20 ? 2 : 3, min: 28 + (i % 4), kcal: 210, xp: 250, rpe: 6 + (i % 3), azia: false }); }
  for (let w = 5; w >= 0; w--) s.medidas.push({ d: st.maisDias(st.hoje(), -w * 7), kg: +(89.6 - (5 - w) * 0.5).toFixed(1), cintura: +(101 - (5 - w) * 0.8).toFixed(1) });
  s.dias[st.hoje()] = { xp: 78, m: { agua: 3, pausas: 2, sono: 1 } };
  ['m1', 't1', 's3', 's7', 'dp', 't10', 'n3', 'c2', 'k2', 'l5'].forEach((c) => (s.conquistas[c] = st.hoje()));
  return s;
}

// ---------- início
async function iniciar() {
  const q = new URLSearchParams(location.search);
  await st.carregar(q.has('demo') ? estadoDemo() : null);
  const ic = { hoje: 'casa', treinos: 'haltere', progresso: 'grafico', perfil: 'usuario' }, nm = { hoje: 'Hoje', treinos: 'Treinos', progresso: 'Progresso', perfil: 'Perfil' };
  abas.querySelectorAll('button').forEach((b) => (b.innerHTML = icone(ic[b.dataset.ir]) + `<span>${nm[b.dataset.ir]}</span>`));
  som.setVolumeMusica(S.ajustes.volMusica);
  if (!S.perfil.pronto) boasVindas();
  else { abas.hidden = false; ir(location.hash.slice(1) || 'hoje', false); }
  if (q.get('demo') === 'player') { abas.hidden = true; abrirPlayer('B', buildTreino('B', optsTreino()), { aoSair: () => { abas.hidden = false; ir('hoje', false); }, pular: +q.get('fase') || 0 }); }
  if (q.get('demo') === 'fim') { abas.hidden = true; abrirPlayer('B', buildTreino('B', optsTreino()), { aoSair: () => { abas.hidden = false; ir('hoje', false); }, direto: 'fim' }); }
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) navigator.serviceWorker.register('sw.js').catch((e) => console.warn('service worker', e));
}
iniciar();
