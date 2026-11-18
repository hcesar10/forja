// Ícones em SVG, no mesmo traço (BAR 5.2: nada de emoji como ícone). Personagem em imagem.
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

// Personagem: 6 estágios em anime (imagens geradas no Gemini em 18/11/2026, fundo recortado;
// ver runs/2026-11-18-heroi). A barriga diminui e a roupa evolui; a aura dos estágios 5 e 6 é CSS.
const ROTULO = ['de moletom, com sono', 'de faixa na testa', 'de camiseta com chama', 'de capa e cinto', 'de uniforme azul e ombreiras', 'de uniforme preto e dourado'];
export function heroi(est = 0) {
  const e = Math.max(0, Math.min(5, est));
  return `<span class="heroi-box e${e}"><img class="heroi" src="img/heroi-${e}.webp" width="414" height="720" decoding="async" alt="Seu personagem no estágio ${e + 1} de 6, ${ROTULO[e]}"></span>`;
}
