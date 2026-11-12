// Conteúdo do app. Critérios em ../BAR.md.
// Regra fixa do app (cuidado com refluxo): nenhum abdominal, salto, corrida, inversão,
// prancha longa no chão ou instrução de prender o ar. Ver PROIBIDOS no fim.

export const EX = {
  1: { nome: 'Sentar e levantar', dica: 'Solte o ar ao levantar. Joelho na direção do pé.' },
  2: { nome: 'Flexão na parede', dica: 'Corpo reto. Solte o ar ao empurrar.' },
  3: { nome: 'Ponte de glúteo', dica: 'Aperte o glúteo lá em cima. Não prenda o ar.' },
  4: { nome: 'Bird dog', dica: 'Braço e perna opostos. Quadril parado.' },
  5: { nome: 'Panturrilha', dica: 'Suba, segure 1 segundo, desça devagar.' },
  6: { nome: 'Marcha no lugar', dica: 'Joelho alto, braços soltos. Sem pular.' },
  7: { nome: 'Subir e descer o degrau', dica: 'Pé inteiro no degrau. Degrau baixo e firme.' },
  8: { nome: 'Soco com passo lateral', dica: 'Passo pro lado e soco pra frente.' },
  9: { nome: 'Encaixe do quadril na parede', dica: 'Solte o ar e aproxime a lombar da parede.' },
  10: { nome: 'Alongar a frente do quadril', dica: 'Aperte o glúteo de trás. Tronco reto.' },
  11: { nome: 'Alongar atrás da coxa', dica: 'Costas retas. Incline a partir do quadril.' },
  12: { nome: 'Figura 4 na cadeira', dica: 'Tornozelo sobre o joelho. Incline devagar.' },
  13: { nome: 'Girar os ombros', dica: 'Círculos grandes, para trás.' },
  14: { nome: 'Girar o quadril', dica: 'Mãos na cintura, círculos grandes.' },
  15: { nome: 'Respiração pela barriga', dica: 'A barriga sobe quando o ar entra.' },
  16: { nome: 'Agachamento', dica: 'Quadril para trás, calcanhar no chão. Solte o ar ao subir.' },
  17: { nome: 'Avanço para trás', dica: 'Passo longo para trás. Tronco reto.' },
  18: { nome: 'Dobradiça de quadril', dica: 'Costas retas, quadril para trás. Cabeça acima do quadril.' },
  19: { nome: 'Passo de patinador', dica: 'Passo largo pro lado, pé de trás toca o chão. Sem pular.' },
  20: { nome: 'Boxe', dica: 'Gire o quadril a cada soco. Guarda alta.' },
  21: { nome: 'Flexão na cadeira', dica: 'Cadeira encostada na parede. Corpo reto.' },
  22: { nome: 'Escalador na cadeira', dica: 'Cadeira encostada na parede. Joelho ao peito, sem pular.' },
  23: { nome: 'Degrau com joelho alto', dica: 'Suba e leve o joelho de trás até o quadril.' },
};

// Clipes que existem em clips/NN.mp4. Exercício fora desta lista não entra em treino.
export const CLIPES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20, 21, 23];
const tem = (id) => CLIPES.includes(id);

// bpm = batida da trilha (Terry 2020; Karageorghis 2014: 125–140 no esforço)
export const TIPO = {
  aquece: { xp: 3, met: 3.0, rotulo: 'AQUECIMENTO', bpm: 112 },
  circuito: { xp: 9, met: 5.0, rotulo: 'CIRCUITO', bpm: 128 },
  forte: { xp: 12, met: 7.0, rotulo: 'FORTE', bpm: 142 },
  leve: { xp: 3, met: 3.3, rotulo: 'RECUPERE', bpm: 116 },
  mob: { xp: 5, met: 2.3, rotulo: 'MOBILIDADE', bpm: 84 },
  resp: { xp: 4, met: 1.5, rotulo: 'RESPIRAÇÃO', bpm: 0 },
  desc: { xp: 0, met: 1.5, rotulo: 'DESCANSO', bpm: 100 },
  prep: { xp: 0, met: 1.5, rotulo: 'A SEGUIR', bpm: 0 },
};

export const NIVEIS = [
  { nome: 'Base', alvo: 'Esforço 5 a 6 de 10. Dá para conversar.', rpe: 6 },
  { nome: 'Ritmo', alvo: 'Esforço 6 de 10. Conversa com pausas.', rpe: 6 },
  { nome: 'Fogo', alvo: 'Tiros em esforço 7. Só frases curtas.', rpe: 7 },
  { nome: 'Forte', alvo: 'Tiros em esforço 7 a 8.', rpe: 8 },
  { nome: 'Máquina', alvo: 'Tiros em esforço 8. Recuperação curta.', rpe: 8 },
];

// gerador pseudoaleatório com semente: a ordem muda todo dia (BAR 1.6)
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function embaralha(arr, r) {
  const a = arr.filter(tem);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const f = (ex, tipo, dur, o = {}) => ({ ex, tipo, dur, ...o });

function comPrep(lista, prep) {
  const out = [];
  lista.forEach((x, i) => {
    const ant = lista[i - 1];
    const mudou = !ant || ant.ex !== x.ex || !!ant.espelhar !== !!x.espelhar;
    if (x.tipo !== 'desc' && mudou && prep > 0)
      out.push({ ex: x.ex, tipo: 'prep', dur: i === 0 ? 6 : prep, espelhar: x.espelhar, lado: x.lado });
    out.push(x);
  });
  return out;
}

const aquecimento = () => [
  f(6, 'aquece', 60, { vel: 0.9, meta: 'Marcha leve, solte o corpo' }),
  f(13, 'aquece', 25, { meta: 'Para trás, círculos grandes' }),
  f(14, 'aquece', 25, { meta: 'Metade para cada lado' }),
  f(1, 'aquece', 30, { vel: 0.9, meta: 'Devagar, só para aquecer as pernas' }),
  f(8, 'aquece', 40, { meta: 'Soltando braços e pernas' }),
];

const voltaCalma = (r) => {
  const extra = r() < 0.5 ? 11 : 12;
  const lados = { 11: ['Perna esquerda esticada', 'Perna direita esticada'], 12: ['Tornozelo direito em cima', 'Tornozelo esquerdo em cima'] }[extra];
  return [
    f(6, 'leve', 40, { vel: 0.7, meta: 'Ande devagar, baixe a respiração' }),
    f(9, 'mob', 40, { meta: '6 vezes · segure 5 segundos' }),
    f(10, 'mob', 30, { lado: 'Joelho esquerdo no chão' }),
    f(10, 'mob', 30, { lado: 'Joelho direito no chão', espelhar: true }),
    f(extra, 'mob', 30, { lado: lados[0] }),
    f(extra, 'mob', 30, { lado: lados[1], espelhar: true }),
    f(15, 'resp', 45, { meta: 'Puxe em 4 segundos · solte em 6', ritmo: true }),
  ];
};

const META = {
  1: 'Sente e levante sem parar', 2: '10 a 12 repetições', 3: 'Segure 2 segundos em cima', 4: 'Troque o lado a cada 3 segundos',
  5: '15 repetições', 6: 'Joelho bem alto, braço forte', 7: 'Ritmo firme, sem parar', 8: 'Soco rápido, troque os lados',
  16: 'Desça até a coxa ficar reta', 17: 'Alterne as pernas sem parar', 18: 'Devagar para descer, rápido para subir',
  19: 'Largo e rápido, de um lado ao outro', 20: 'Soco, soco, soco. Não pare.', 21: 'Peito até a cadeira',
  22: 'Joelho ao peito, ritmo firme', 23: 'Joelho até a altura do quadril',
};

// Blocos por nível (0..4). "A" = circuito de força; "B" = tiros.
const CIRC_A = [[1, 2, 3, 6, 4, 5], [16, 21, 3, 17, 4, 5], [16, 21, 17, 3, 19, 4], [16, 21, 17, 18, 19, 3], [16, 21, 17, 18, 23, 22]];
const CIRC_B = [[6, 8, 7, 1, 8, 6], [20, 16, 19, 23, 8, 17]];
const TIROS = [6, 7, 8, 1, 16, 17, 19, 20, 23, 22];
const PERNAS = [16, 17, 19, 23, 22];
const CFG_A = [{ v: 3, w: 40, p: 12, d: 45 }, { v: 3, w: 45, p: 10, d: 40 }, { v: 3, w: 45, p: 8, d: 35, fin: 3 }, { v: 4, w: 45, p: 7, d: 30, fin: 2 }, { v: 4, w: 50, p: 6, d: 30, fin: 3 }];
const CFG_B = [null, null, { n: 13, f: 40, l: 50 }, { n: 15, f: 40, l: 40 }, { n: 16, f: 45, l: 30 }];

/** Monta um treino. opts: { nivel 1..5, seed (número do dia), descarga (semana 12) } */
export function buildTreino(tipo, opts = {}) {
  const n = Math.min(5, Math.max(1, opts.nivel || 1)) - 1;
  const r = rng((opts.seed || 1) * 31 + tipo.charCodeAt(0));
  const corta = (x) => (opts.descarga ? Math.max(1, Math.round(x * 0.65)) : x);
  let L = [];

  const circuito = (ids, c) => {
    const voltas = corta(c.v);
    for (let v = 1; v <= voltas; v++) {
      const ordem = v === 1 ? ids.filter(tem) : embaralha(ids, r);
      // a partir do nível Fogo, os exercícios de perna do circuito são feitos em ritmo forte (BAR 1.1)
      ordem.forEach((id) => {
        const forte = n >= 2 && PERNAS.includes(id);
        L.push(f(id, forte ? 'forte' : 'circuito', id === 4 ? c.w + 10 : c.w, { secao: `VOLTA ${v} DE ${voltas}`, meta: META[id], ...(forte ? { vel: 1.15 } : {}) }));
      });
      if (v < voltas) L.push(f(6, 'desc', c.d, { meta: 'Beba água. Respire pelo nariz.' }));
    }
  };
  const tiros = (qtd, forte, leve, rot) => {
    const pool = embaralha(n < 2 ? [6, 7, 8, 1] : TIROS, r);
    for (let i = 0; i < qtd; i++) {
      const id = pool[i % pool.length];
      const s = `${rot} ${i + 1} DE ${qtd}`;
      L.push(f(id, 'forte', forte, { secao: s, vel: id === 6 ? 1.3 : 1.15, meta: META[id] }));
      L.push(f(6, 'leve', leve, { secao: s, vel: 0.7, meta: 'Ande no lugar e respire fundo' }));
    }
  };

  if (tipo === 'A') {
    L = aquecimento();
    circuito(CIRC_A[n], CFG_A[n]);
    if (CFG_A[n].fin) tiros(corta(CFG_A[n].fin), 40, 25, 'FINAL');
    L.push(...voltaCalma(r));
    return comPrep(L, CFG_A[n].p);
  }
  if (tipo === 'B') {
    L = aquecimento();
    if (CFG_B[n]) tiros(corta(CFG_B[n].n), CFG_B[n].f, CFG_B[n].l, 'TIRO');
    else circuito(CIRC_B[n], CFG_A[n]);
    L.push(...voltaCalma(r));
    return comPrep(L, n < 2 ? CFG_A[n].p : 4);
  }
  if (tipo === 'X') {
    const pool = embaralha(n < 1 ? [1, 8, 7, 6] : [16, 20, 19, 23, 17, 8], r).slice(0, 4);
    L = [f(6, 'aquece', 45, { vel: 0.9, meta: 'Marcha leve' })];
    for (let v = 1; v <= 3; v++) {
      pool.forEach((id) => L.push(f(id, 'forte', 35, { secao: `RODADA ${v} DE 3`, vel: 1.15, meta: META[id] })));
      L.push(f(6, 'leve', 30, { secao: `RODADA ${v} DE 3`, vel: 0.7, meta: 'Respire fundo' }));
    }
    L.push(f(15, 'resp', 40, { meta: 'Puxe em 4 segundos · solte em 6', ritmo: true }));
    return comPrep(L, 4);
  }
  // Q — quadril e postura (sem promessa de corrigir a pelve: BAR "fora do bar")
  L = [
    f(14, 'aquece', 30, { meta: 'Metade para cada lado' }),
    f(9, 'mob', 60, { meta: '8 vezes · segure 5 segundos' }),
    f(10, 'mob', 45, { lado: 'Joelho esquerdo no chão' }),
    f(10, 'mob', 45, { lado: 'Joelho direito no chão', espelhar: true }),
    f(11, 'mob', 45, { lado: 'Perna esquerda esticada' }),
    f(11, 'mob', 45, { lado: 'Perna direita esticada', espelhar: true }),
    f(12, 'mob', 45, { lado: 'Tornozelo direito em cima' }),
    f(12, 'mob', 45, { lado: 'Tornozelo esquerdo em cima', espelhar: true }),
    f(3, 'circuito', 45, { meta: '12 repetições, devagar' }),
    f(4, 'circuito', 50, { meta: 'Troque o lado a cada 3 segundos' }),
    f(15, 'resp', 45, { meta: 'Puxe em 4 segundos · solte em 6', ritmo: true }),
  ];
  return comPrep(L, 5);
}

export const TREINOS = {
  A: { nome: 'Circuito de força', sub: 'Pernas, braços e costas sem parar', cor: '#34d399', capa: 16 },
  B: { nome: 'Tiros', sub: 'Forte e leve alternados, para suar', cor: '#fb923c', capa: 20 },
  X: { nome: 'Express', sub: 'Sem tempo? 9 minutos intensos', cor: '#fbbf24', capa: 19 },
  Q: { nome: 'Quadril e postura', sub: 'Solta o quadril, alivia a lombar', cor: '#60a5fa', capa: 10 },
};

export const resumoTreino = (fases, kg) => {
  const seg = fases.reduce((s, x) => s + x.dur, 0);
  const kcal = fases.reduce((s, x) => s + ((TIPO[x.tipo].met * 3.5 * kg) / 200) * (x.dur / 60), 0);
  const xp = fases.reduce((s, x) => s + TIPO[x.tipo].xp, 0) + 50;
  const forte = fases.filter((x) => x.tipo === 'forte').reduce((s, x) => s + x.dur, 0);
  return { min: Math.round(seg / 60), kcal: Math.round(kcal), xp, forteMin: Math.round(forte / 60) };
};

/** 0=domingo. Seg/qua/sex circuito, ter/qui tiros. Dia de esporte e domingo: sem treino obrigatório. */
export const treinoDoDia = (dow, diaEsporte) => {
  if (dow === diaEsporte) return null;
  return [null, 'A', 'B', 'A', 'B', 'A', null][dow];
};

// Missões. meta = quantas marcações no dia. minima = conta para manter a sequência (todas contam).
// Fontes das metas em BAR.md (critério 3.6).
export const MISSOES = [
  { id: 'treino', icone: 'raio', nome: 'Treino do dia', xp: 0, meta: 1, especial: 'treino' },
  { id: 'sono', icone: 'lua', nome: 'Dormi 7 horas ou mais', xp: 40, meta: 1, gatilhos: ['Quando o alarme de desacelerar tocar, largo o celular', 'Depois de escovar os dentes, vou direto para a cama'] },
  { id: 'caminhada', icone: 'passos', nome: 'Caminhar 10 min depois de comer', xp: 20, meta: 2, gatilhos: ['Quando eu levantar da mesa do almoço e do jantar', 'Depois de lavar a louça'] },
  { id: 'pausas', icone: 'cadeira', nome: 'Levantar da cadeira', sub: 'Uma pausa a cada hora sentado', xp: 6, meta: 6, gatilhos: ['Quando o relógio marcar hora cheia', 'Toda vez que eu terminar uma ligação ou tarefa'] },
  { id: 'jantar', icone: 'talher', nome: 'Jantar 3 horas antes de deitar', xp: 30, meta: 1, gatilhos: ['Quando eu chegar em casa, janto antes de sentar no sofá', 'Aviso em casa o horário do jantar'] },
  { id: 'porcao', icone: 'pizza', nome: 'Prato na medida', sub: 'Metade feijão e salada, um quarto carne, um quarto arroz. Sem repetir.', xp: 15, meta: 2, gatilhos: ['Quando eu pegar o prato, sirvo o feijão e a salada primeiro', 'Sirvo o prato na cozinha e levo para a mesa'] },
  { id: 'respiracao', icone: 'vento', nome: 'Respiração pela barriga', sub: '5 minutos guiados', xp: 30, meta: 1, especial: 'resp', gatilhos: ['Antes de dormir, já deitado', 'Depois do almoço, antes de voltar ao trabalho'] },
  { id: 'agua', icone: 'gota', nome: 'Beber água', sub: 'Um copo antes de cada refeição e no treino', xp: 4, meta: 6 },
];

export const DICAS = [
  'Suor é só o corpo esfriando. O que conta é ficar ofegante nas partes FORTE.',
  'A barriga diminui por dentro antes de aparecer na balança. Meça a cintura toda semana.',
  'Dormir pouco aumenta a fome no dia seguinte: quem dormiu mais comeu em média 270 kcal a menos por dia.',
  'Dez minutos andando depois de comer baixam o açúcar do sangue.',
  'Jantar 2 a 3 horas antes de deitar é a missão que mais ajuda o refluxo.',
  'Na hora da força, solte o ar. Prender o ar aumenta a pressão no estômago.',
  'Um dia ruim não quebra nada. Volte no dia seguinte.',
  'Feijão e salada primeiro no prato: sobra menos espaço para o arroz, sem passar fome.',
  'Ficar sentado o dia todo trava o quadril. Levante a cada hora, nem que seja por 2 minutos.',
  'Treine de estômago vazio ou 2 horas depois de comer.',
  'O hábito leva em média 66 dias para ficar automático. Falhar um dia não zera a conta.',
  'Respirar pela barriga 5 minutos por dia ajuda a segurar o refluxo.',
];

export const ALERTAS = [
  'Azia ou queimação que piora, ou que aparece em dois treinos seguidos',
  'Dificuldade para engolir, vômito ou fezes escuras',
  'Dor no peito, tontura ou falta de ar fora do normal no exercício',
  'Dor na lombar ou no quadril que não passa ou acorda à noite',
  'Formigamento ou fraqueza na perna',
];

export const TITULOS = ['Recomeço', 'Aprendiz', 'Guerreiro', 'Atleta', 'Campeão', 'Lenda'];
export const ESTAGIO_NIVEL = [1, 3, 6, 10, 15, 21]; // nível em que cada estágio do personagem começa

export const CONQUISTAS = [
  { id: 'm1', ic: 'check', nome: 'Primeiro passo', desc: 'Primeira missão cumprida', ok: (s) => s.xp > 0 },
  { id: 't1', ic: 'haltere', nome: 'Estreia', desc: 'Primeiro treino completo', ok: (s) => s.treinos.length >= 1 },
  { id: 's3', ic: 'fogo', nome: 'Pegando ritmo', desc: '3 dias seguidos', ok: (s, x) => x.seq >= 3 },
  { id: 's7', ic: 'fogo', nome: 'Semana cheia', desc: '7 dias seguidos', ok: (s, x) => x.seq >= 7 },
  { id: 's30', ic: 'fogo', nome: 'Um mês', desc: '30 dias seguidos', ok: (s, x) => x.seq >= 30 },
  { id: 's66', ic: 'fogo', nome: 'Hábito formado', desc: '66 dias seguidos', ok: (s, x) => x.seq >= 66 },
  { id: 'dp', ic: 'trofeu', nome: 'Dia perfeito', desc: 'Todas as missões num dia', ok: (s) => Object.values(s.dias).some((d) => d.perfeito) },
  { id: 't10', ic: 'haltere', nome: 'Dez treinos', desc: '10 treinos completos', ok: (s) => s.treinos.length >= 10 },
  { id: 't30', ic: 'haltere', nome: 'Trinta treinos', desc: '30 treinos completos', ok: (s) => s.treinos.length >= 30 },
  { id: 'n3', ic: 'raio', nome: 'Entrou no fogo', desc: 'Chegou ao nível de treino Fogo', ok: (s) => s.nivelTreino >= 3 },
  { id: 'n5', ic: 'raio', nome: 'Máquina', desc: 'Chegou ao nível de treino Máquina', ok: (s) => s.nivelTreino >= 5 },
  { id: 'c2', ic: 'regua', nome: 'Cinto mais folgado', desc: '2 cm a menos de cintura', ok: (s, x) => x.cintura >= 2 },
  { id: 'c5', ic: 'regua', nome: 'Outro furo no cinto', desc: '5 cm a menos de cintura', ok: (s, x) => x.cintura >= 5 },
  { id: 'k2', ic: 'grafico', nome: 'Menos 2 kg', desc: 'Dois quilos a menos', ok: (s, x) => x.perdido >= 2 },
  { id: 'k5', ic: 'grafico', nome: 'Menos 5 kg', desc: 'Cinco quilos a menos', ok: (s, x) => x.perdido >= 5 },
  { id: 'l5', ic: 'estrela', nome: 'Nível 5', desc: 'Personagem no nível 5', ok: (s, x) => x.nivel >= 5 },
  { id: 'd50', ic: 'check', nome: 'Cinquenta dias', desc: '50 dias com missão cumprida', ok: (s) => Object.values(s.dias).filter((d) => d.xp > 0).length >= 50 },
  { id: 'l10', ic: 'estrela', nome: 'Nível 10', desc: 'Personagem no nível 10', ok: (s, x) => x.nivel >= 10 },
];

// Para o teste automático (BAR 1.4): nenhum nome de exercício pode conter estes termos.
export const PROIBIDOS = ['abdominal', 'crunch', 'sit-up', 'prancha', 'burpee', 'polichinelo', 'salto', 'pular corda', 'corrida', 'invert'];
