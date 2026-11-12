// Ícones e personagem desenhados em SVG, no mesmo traço (BAR 5.2: nada de emoji como ícone).
const P = {
  raio: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  lua: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
  passos: '<path d="M7 4c2 0 3 2 3 5s-1 5-3 5-3-2-3-5 1-5 3-5zM5 17h4v1a2 2 0 0 1-4 0zM17 8c2 0 3 2 3 5s-1 5-3 5-3-2-3-5 1-5 3-5z"/><path d="M15 21h4"/>',
  cadeira: '<path d="M4 9v12M4 14h9v7M17.500 13V4M14 7.500 17.500 4 21 7.500"/>',
  talher: '<path d="M7 3v18M4 3v5a3 3 0 0 0 6 0V3M17 21v-9M17 12h-3c0-4 1-7 3-9z"/>',
  prato: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/>',
  pizza: '<circle cx="12" cy="12" r="9"/><path d="M12 3v9l7.8 4.5M12 12H3"/>',
  vento: '<path d="M3 8h10a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7a2.5 2.5 0 1 1-2.5 2.5"/>',
  gota: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.500 6-11 6-11z"/>',
  bola: '<circle cx="12" cy="12" r="9"/><path d="m12 7 4.500 3.300-1.700 5.300H9.200l-1.700-5.300zM12 3v4M3.500 9.500l4 0.800M20.500 9.500l-4 0.800M6.500 19l2.700-3.400M17.500 19l-2.700-3.400"/>',
  casa: '<path d="m3 11 9-8 9 8M5 9.500V20h5v-6h4v6h5V9.500"/>',
  haltere: '<path d="M6 7v10M3 9.500v5M18 7v10M21 9.500v5M6 12h12"/>',
  grafico: '<path d="M4 20V10M10 20V4M16 20v-8M21 20H3"/>',
  usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  fogo: '<path d="M12 2s5 4.500 5 10a5 5 0 0 1-10 0c0-2 1-3.500 1-3.500S9 11 10.500 11C10.500 7 12 2 12 2z"/>',
  check: '<path d="m5 12.500 4.500 4.500L19 7.500"/>',
  play: '<path d="M7 4v16l13-8z"/>',
  pause: '<path d="M7 4v16M17 4v16"/>',
  proximo: '<path d="M5 4v16l11-8zM19 4v16"/>',
  anterior: '<path d="M19 4v16L8 12zM5 4v16"/>',
  nota: '<path d="M9 18V5l11-2v13"/><circle cx="6.500" cy="18" r="2.500"/><circle cx="17.500" cy="16" r="2.500"/>',
  voz: '<path d="M4 9v6h4l5 4V5L8 9zM16.500 8.500a5 5 0 0 1 0 7M19 6a8.500 8.500 0 0 1 0 12"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  seta: '<path d="m9 5 7 7-7 7"/>',
  escudo: '<path d="M12 3 4.500 6v6c0 4.500 3.200 7.800 7.500 9 4.300-1.200 7.500-4.500 7.500-9V6z"/>',
  trofeu: '<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8 21h8M9 18h6"/>',
  cadeado: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.500 2"/>',
  baixar: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  calendario: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  regua: '<path d="M3 8h18v8H3zM7 8v3M11 8v4M15 8v3M19 8v4"/>',
  alerta: '<path d="M12 3 2.500 20h19zM12 10v4.500M12 17.500v.01"/>',
  coracao: '<path d="M12 20s-7-4.500-7-10a4 4 0 0 1 7-2.500A4 4 0 0 1 19 10c0 5.500-7 10-7 10z"/>',
  estrela: '<path d="m12 3 2.700 5.700 6.300.800-4.600 4.300 1.200 6.200L12 17l-5.600 3 1.200-6.200L3 9.500l6.300-.800z"/>',
};
export const icone = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

// Personagem: 6 estágios. A cada estágio muda a roupa e a cintura afina um pouco.
const PELE = '#e8b08a', CABELO = '#2b2320';
const ROUPA = ['#6b7280', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b'];
const CALCA = ['#64748b', '#5b6b85', '#5b6b85', '#4a6fa5', '#6d5bb5', '#8a5a2b'];
export function heroi(est = 0, opts = {}) {
  const e = Math.max(0, Math.min(5, est));
  const cor = ROUPA[e], calca = CALCA[e];
  const bw = 48 - e * 5; // meia-largura da cintura: 48 (barriga) até 23 (tronco em V)
  const om = 36 + e * 0.8; // ombros quase fixos: a silhueta não alarga
  const b = Math.max(0, 3 - e) * 5; // quanto a barriga salta para os lados
  const id = 'h' + e + (opts.id || '');
  const corAura = e === 5 ? '#fbbf24' : '#a78bfa';
  const aura = e >= 4 ? `<circle cx="100" cy="116" r="92" fill="${corAura}" opacity=".10"/><circle cx="100" cy="116" r="74" fill="${corAura}" opacity=".12"/>${e === 5 ? Array.from({ length: 12 }, (_, i) => `<rect x="98.500" y="12" width="3" height="12" rx="1.500" fill="#fbbf24" opacity=".8" transform="rotate(${i * 30} 100 116)"/>`).join('') : ''}` : '';
  const capa = e >= 3 ? `<path d="M${100 - om + 4} 92 Q${100 - om - 12} 150 ${100 - om - 2} 196 L${100 + om + 2} 196 Q${100 + om + 12} 150 ${100 + om - 4} 92Z" fill="${e === 5 ? '#b91c1c' : e === 4 ? '#6d28d9' : '#0369a1'}"/>` : '';
  const faixa = e >= 1 ? `<path d="M73 50 Q100 42 127 50 L127 58 Q100 50 73 58Z" fill="${e >= 5 ? '#fbbf24' : '#34d399'}"/>${e >= 5 ? '' : '<path d="M127 52l13 5-11 4z" fill="#34d399"/>'}` : '';
  const faixaPulso = e >= 2 ? '<rect x="-10" y="40" width="20" height="8" rx="3" fill="#fbbf24"/>' : '';
  const braco = (x, g) => `<g transform="translate(${x} 93) rotate(${g})"><rect x="-9" y="0" width="18" height="52" rx="9" fill="${PELE}"/>${faixaPulso}<circle cx="0" cy="55" r="10.500" fill="${PELE}"/></g>`;
  const pulso = '';
  const emblema = e >= 2 ? `<path d="M104 104 92 122h8l-2 13 13-18h-8z" fill="#fff" opacity=".95"/>` : '';
  const ombreira = e >= 4 ? `<path d="M${100 - om - 5} 98a14 12 0 0 1 26-4l-4 11-18 2z" fill="#e5e7eb"/><path d="M${100 + om + 5} 98a14 12 0 0 0-26-4l4 11 18 2z" fill="#e5e7eb"/>` : '';
  const cinto = e >= 3 ? `<rect x="${100 - bw + 4}" y="150" width="${bw * 2 - 8}" height="9" rx="4" fill="#fbbf24"/><circle cx="100" cy="154.500" r="6.500" fill="#fff7d6" stroke="#b45309" stroke-width="1.500"/>` : '';
  const coroa = e >= 5 ? `<path d="M76 34l8 10 8-13 8 13 8-13 8 13 8-10-3 18H79z" fill="#fbbf24" stroke="#b45309" stroke-width="1.500" stroke-linejoin="round"/>` : '';
  return `<svg class="heroi" viewBox="0 0 200 220" role="img" aria-label="Personagem no estágio ${e + 1} de 6">
${aura}<ellipse cx="100" cy="208" rx="52" ry="8" fill="#000" opacity=".28"/>${capa}
<rect x="77" y="146" width="21" height="56" rx="9" fill="${calca}"/><rect x="102" y="146" width="21" height="56" rx="9" fill="${calca}"/>
<rect x="72" y="196" width="28" height="12" rx="6" fill="#f3f4f6"/><rect x="100" y="196" width="28" height="12" rx="6" fill="#f3f4f6"/>
${braco(100 - om - 2, 9)}${braco(100 + om + 2, -9)}
<rect x="${100 - om - 6}" y="88" width="22" height="24" rx="10" fill="${cor}"/><rect x="${100 + om - 16}" y="88" width="22" height="24" rx="10" fill="${cor}"/>
<path d="M${100 - om} 98 Q${100 - om} 86 ${100 - om + 12} 86 L${100 + om - 12} 86 Q${100 + om} 86 ${100 + om} 98 C${100 + om + b} 122 ${100 + bw + b} 144 ${100 + bw - 4} 156 Q100 ${160 + (5 - e) * 1.6} ${100 - bw + 4} 156 C${100 - bw - b} 144 ${100 - om - b} 122 ${100 - om} 98Z" fill="${cor}"/>
${emblema}${cinto}${ombreira}${pulso}
<rect x="92" y="74" width="16" height="16" rx="6" fill="${PELE}"/>
<circle cx="100" cy="56" r="27" fill="${PELE}"/>
<path d="M73 54a27 27 0 0 1 54 0c-5-9-13-13-27-13s-22 4-27 13z" fill="${CABELO}"/>
${faixa}${coroa}
<circle cx="90" cy="60" r="3.200" fill="#1f2937"/><circle cx="110" cy="60" r="3.200" fill="#1f2937"/>
<path d="M${e >= 2 ? 89 : 91} 69 Q100 ${e >= 2 ? 79 : 75} ${e >= 2 ? 111 : 109} 69" fill="none" stroke="#7c2d12" stroke-width="2.600" stroke-linecap="round"/>
</svg>`;
}
