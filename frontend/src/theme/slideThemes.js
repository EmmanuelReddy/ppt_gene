/**
 * Per-slide visual themes: distinct palettes + UI chrome (not locked to neon teal).
 * Use themePack "variety" to rotate through VARIETY_THEME_IDS.
 */

function tones(a, b, c, d, e) {
  return {
    disruptor: a,
    scaling_machine: b,
    data_pivot: c,
    roi_matrix: d,
    feature_grid: e ?? b,
  };
}

/** Dark themes: base canvas, SVG orbs, hero metric, accent, supporting UI colors */
function darkTheme({
  canvas,
  svgBase,
  orbSecondary,
  layoutTones,
  power,
  accent,
  accentRgb,
  gridRgb,
  headerPillar,
  tableHeaderBg,
  tableHeaderText,
  valueGlowRgb,
  featureGridCanvas,
}) {
  return {
    isLight: false,
    canvasBg: canvas,
    svgBase,
    orbSecondary,
    layoutTones,
    featureGridCanvas,
    power,
    accent,
    accentRgb,
    gridRgb,
    headerPillar,
    tableHeaderBg,
    tableHeaderBgRgba: tableHeaderBg,
    tableHeaderText,
    valueGlowRgb,
    titleClass: 'font-display text-white',
    bodyMuted: 'text-gray-400',
    bodyStrong: 'text-white',
    borderSubtle: 'border-white/5',
    cardBg: 'bg-white/[0.03]',
    cardHover: 'hover:bg-white/[0.06]',
  };
}

const THEME_MAP = {
  neon_vc: darkTheme({
    canvas: '#0A0A0B',
    svgBase: '#07090f',
    orbSecondary: '#0284c7',
    layoutTones: tones('#20b2aa', '#7c3aed', '#f97316', '#22d3ee'),
    power: {
      color: '#7fffd4',
      webkitTextFillColor: '#7fffd4',
      textShadow:
        '0 0 20px rgba(32,178,170,0.95), 0 0 60px rgba(32,178,170,0.55), 0 2px 0 #0d9488',
    },
    accent: '#20b2aa',
    accentRgb: '32,178,170',
    gridRgb: '32,178,170',
    headerPillar: 'linear-gradient(to bottom, #14b8a6, #f97316)',
    tableHeaderBg: 'rgba(32,178,170,0.06)',
    tableHeaderText: '#2dd4bf',
    valueGlowRgb: '32,178,170',
  }),

  ember_capital: darkTheme({
    canvas: '#0f0a08',
    svgBase: '#1c0a06',
    orbSecondary: '#ea580c',
    layoutTones: tones('#fb923c', '#f43f5e', '#fbbf24', '#f97316'),
    power: {
      color: '#fed7aa',
      webkitTextFillColor: '#fed7aa',
      textShadow:
        '0 0 24px rgba(251,146,60,0.9), 0 0 56px rgba(234,88,12,0.5), 0 2px 0 #c2410c',
    },
    accent: '#fb923c',
    accentRgb: '251,146,60',
    gridRgb: '251,146,60',
    headerPillar: 'linear-gradient(to bottom, #fb923c, #ea580c)',
    tableHeaderBg: 'rgba(251,146,60,0.12)',
    tableHeaderText: '#fdba74',
    valueGlowRgb: '251,146,60',
  }),

  midnight_data: darkTheme({
    canvas: '#0a0e18',
    svgBase: '#060b14',
    orbSecondary: '#6366f1',
    layoutTones: tones('#38bdf8', '#6366f1', '#22d3ee', '#818cf8'),
    power: {
      color: '#7dd3fc',
      webkitTextFillColor: '#7dd3fc',
      textShadow:
        '0 0 22px rgba(56,189,248,0.95), 0 0 50px rgba(99,102,241,0.45), 0 2px 0 #0284c7',
    },
    accent: '#38bdf8',
    accentRgb: '56,189,248',
    gridRgb: '56,189,248',
    headerPillar: 'linear-gradient(to bottom, #38bdf8, #6366f1)',
    tableHeaderBg: 'rgba(56,189,248,0.08)',
    tableHeaderText: '#7dd3fc',
    valueGlowRgb: '56,189,248',
  }),

  aurora_violet: darkTheme({
    canvas: '#0c0a14',
    svgBase: '#0a0812',
    orbSecondary: '#c084fc',
    layoutTones: tones('#c084fc', '#e879f9', '#a78bfa', '#f472b6'),
    power: {
      color: '#f5d0fe',
      webkitTextFillColor: '#f5d0fe',
      textShadow:
        '0 0 20px rgba(192,132,252,0.95), 0 0 55px rgba(232,121,249,0.5), 0 2px 0 #c026d3',
    },
    accent: '#c084fc',
    accentRgb: '192,132,252',
    gridRgb: '192,132,252',
    headerPillar: 'linear-gradient(to bottom, #c084fc, #e879f9)',
    tableHeaderBg: 'rgba(192,132,252,0.1)',
    tableHeaderText: '#e9d5ff',
    valueGlowRgb: '192,132,252',
  }),

  forest_gold: darkTheme({
    canvas: '#0a100c',
    svgBase: '#0b120e',
    orbSecondary: '#ca8a04',
    layoutTones: tones('#4ade80', '#22c55e', '#eab308', '#84cc16'),
    power: {
      color: '#fef08a',
      webkitTextFillColor: '#fef08a',
      textShadow:
        '0 0 22px rgba(234,179,8,0.9), 0 0 50px rgba(74,222,128,0.45), 0 2px 0 #a16207',
    },
    accent: '#4ade80',
    accentRgb: '74,222,128',
    gridRgb: '74,222,128',
    headerPillar: 'linear-gradient(to bottom, #4ade80, #eab308)',
    tableHeaderBg: 'rgba(74,222,128,0.08)',
    tableHeaderText: '#bbf7d0',
    valueGlowRgb: '234,179,8',
  }),

  sunset_rose: darkTheme({
    canvas: '#0f0a0c',
    svgBase: '#12080a',
    orbSecondary: '#fb7185',
    layoutTones: tones('#fb7185', '#f472b6', '#fbbf24', '#f43f5e'),
    power: {
      color: '#fecdd3',
      webkitTextFillColor: '#fecdd3',
      textShadow:
        '0 0 22px rgba(251,113,133,0.95), 0 0 52px rgba(244,63,94,0.45), 0 2px 0 #be123c',
    },
    accent: '#fb7185',
    accentRgb: '251,113,133',
    gridRgb: '251,113,133',
    headerPillar: 'linear-gradient(to bottom, #fb7185, #fbbf24)',
    tableHeaderBg: 'rgba(251,113,133,0.1)',
    tableHeaderText: '#fecdd3',
    valueGlowRgb: '251,113,133',
  }),

  carbon_amber: darkTheme({
    canvas: '#0c0c0e',
    svgBase: '#09090b',
    orbSecondary: '#78716c',
    layoutTones: tones('#fbbf24', '#f59e0b', '#d6d3d1', '#a8a29e'),
    power: {
      color: '#fde68a',
      webkitTextFillColor: '#fde68a',
      textShadow:
        '0 0 22px rgba(251,191,36,0.95), 0 0 48px rgba(245,158,11,0.4), 0 2px 0 #b45309',
    },
    accent: '#fbbf24',
    accentRgb: '251,191,36',
    gridRgb: '161,161,170',
    headerPillar: 'linear-gradient(to bottom, #fbbf24, #78716c)',
    tableHeaderBg: 'rgba(251,191,36,0.08)',
    tableHeaderText: '#fde68a',
    valueGlowRgb: '251,191,36',
  }),

  ocean_mint: darkTheme({
    canvas: '#0a1014',
    svgBase: '#0a1218',
    orbSecondary: '#06b6d4',
    layoutTones: tones('#2dd4bf', '#06b6d4', '#34d399', '#22d3ee'),
    power: {
      color: '#99f6e4',
      webkitTextFillColor: '#99f6e4',
      textShadow:
        '0 0 22px rgba(45,212,191,0.95), 0 0 52px rgba(6,182,212,0.45), 0 2px 0 #0f766e',
    },
    accent: '#2dd4bf',
    accentRgb: '45,212,191',
    gridRgb: '45,212,191',
    headerPillar: 'linear-gradient(to bottom, #2dd4bf, #06b6d4)',
    tableHeaderBg: 'rgba(45,212,191,0.08)',
    tableHeaderText: '#99f6e4',
    valueGlowRgb: '32,178,170',
  }),

  /** Gamma-style: diagonal warm gradient, orange ring hero, 2×2 cards */
  gamma_mosaic: darkTheme({
    canvas: '#1a1510',
    svgBase: '#120d0a',
    orbSecondary: '#ea580c',
    layoutTones: tones('#fb923c', '#f97316', '#fdba74', '#fed7aa', '#ff7a18'),
    featureGridCanvas:
      'linear-gradient(128deg, #0f0a08 0%, #2d2118 38%, #6b5340 62%, #e8dcc8 100%)',
    power: {
      color: '#fed7aa',
      webkitTextFillColor: '#fed7aa',
      textShadow:
        '0 0 24px rgba(251,146,60,0.85), 0 0 48px rgba(234,88,12,0.45), 0 2px 0 #c2410c',
    },
    accent: '#fb923c',
    accentRgb: '251,146,60',
    gridRgb: '251,146,60',
    headerPillar: 'linear-gradient(to bottom, #fb923c, #ea580c)',
    tableHeaderBg: 'rgba(251,146,60,0.1)',
    tableHeaderText: '#fdba74',
    valueGlowRgb: '251,146,60',
  }),

  /** Canva-style: light, soft shadow cards, coral / violet accents */
  canva_pop: {
    isLight: true,
    canvasBg: '#faf7ff',
    featureGridCanvas: 'linear-gradient(165deg, #faf7ff 0%, #ffffff 45%, #fff7ed 100%)',
    layoutTones: tones('#ec4899', '#a855f7', '#f472b6', '#c084fc', '#f472b6'),
    accent: '#db2777',
    accentRgb: '219,39,119',
    titleClass: 'font-bold text-gray-900',
    bodyMuted: 'text-gray-600',
    bodyStrong: 'text-gray-900',
    borderSubtle: 'border-gray-200',
    cardBg: 'bg-white',
    cardHover: 'shadow-lg',
  },

  /** Chronicle-style: newsprint cream, navy accent */
  chronicle_paper: {
    isLight: true,
    canvasBg: '#faf8f5',
    featureGridCanvas: 'linear-gradient(180deg, #faf8f5 0%, #f0ebe3 100%)',
    layoutTones: tones('#1e3a5f', '#1e40af', '#334155', '#0f172a', '#1e3a5f'),
    accent: '#1e3a5f',
    accentRgb: '30,58,95',
    titleClass: 'font-serif font-bold text-gray-900',
    bodyMuted: 'text-gray-600',
    bodyStrong: 'text-gray-900',
    borderSubtle: 'border-stone-300',
    cardBg: 'bg-white',
    cardHover: 'shadow-md',
  },

  /** Modal.app-style: dusk purple, soft glow */
  modal_dusk: darkTheme({
    canvas: '#12101a',
    svgBase: '#0c0a12',
    orbSecondary: '#a78bfa',
    layoutTones: tones('#a78bfa', '#818cf8', '#c4b5fd', '#6366f1', '#c4b5fd'),
    featureGridCanvas:
      'linear-gradient(145deg, #0f0d14 0%, #1a1625 50%, #2e1065 100%)',
    power: {
      color: '#e9d5ff',
      webkitTextFillColor: '#e9d5ff',
      textShadow:
        '0 0 22px rgba(167,139,250,0.9), 0 0 50px rgba(129,140,248,0.45), 0 2px 0 #6d28d9',
    },
    accent: '#a78bfa',
    accentRgb: '167,139,250',
    gridRgb: '167,139,250',
    headerPillar: 'linear-gradient(to bottom, #a78bfa, #6366f1)',
    tableHeaderBg: 'rgba(167,139,250,0.08)',
    tableHeaderText: '#e9d5ff',
    valueGlowRgb: '167,139,250',
  }),

  anthill_reference: {
    isLight: true,
    canvasBg: '#ebe8e4',
    layoutTones: tones('#ea580c', '#c2410c', '#ea580c', '#9a3412'),
    accent: '#ea580c',
    accentRgb: '234,88,12',
    titleClass: 'font-serif text-gray-900',
    bodyMuted: 'text-gray-600',
    bodyStrong: 'text-gray-900',
    borderSubtle: 'border-gray-200',
    cardBg: 'bg-white',
    cardHover: 'shadow-md',
  },

  /** Moda-inspired: dusk canvas, magenta/violet energy, editable-canvas feel */
  moda_canvas: darkTheme({
    canvas: '#0f0a14',
    svgBase: '#12081a',
    orbSecondary: '#e879f9',
    layoutTones: tones('#e879f9', '#a855f7', '#f472b6', '#c026d3', '#e879f9'),
    featureGridCanvas:
      'linear-gradient(155deg, #1a0a22 0%, #2d1b3d 42%, #0f172a 100%)',
    power: {
      color: '#f5d0fe',
      webkitTextFillColor: '#f5d0fe',
      textShadow:
        '0 0 22px rgba(232,121,249,0.9), 0 0 52px rgba(168,85,247,0.45), 0 2px 0 #a21caf',
    },
    accent: '#e879f9',
    accentRgb: '232,121,249',
    gridRgb: '232,121,249',
    headerPillar: 'linear-gradient(to bottom, #e879f9, #a855f7)',
    tableHeaderBg: 'rgba(232,121,249,0.1)',
    tableHeaderText: '#f5d0fe',
    valueGlowRgb: '232,121,249',
  }),

  /** Bright studio / SaaS daylight — Gamma-Chronicle landing calm */
  studio_daylight: {
    isLight: true,
    canvasBg: '#f8fafc',
    featureGridCanvas: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 55%, #e0e7ff 100%)',
    layoutTones: tones('#2563eb', '#4f46e5', '#0ea5e9', '#6366f1', '#2563eb'),
    accent: '#2563eb',
    accentRgb: '37,99,235',
    titleClass: 'font-display font-bold text-slate-900',
    bodyMuted: 'text-slate-600',
    bodyStrong: 'text-slate-900',
    borderSubtle: 'border-slate-200',
    cardBg: 'bg-white',
    cardHover: 'shadow-lg shadow-slate-200/60',
  },
};

/** Order used when themePack === "variety" */
export const VARIETY_THEME_IDS = [
  'neon_vc',
  'ember_capital',
  'midnight_data',
  'aurora_violet',
  'forest_gold',
  'sunset_rose',
  'carbon_amber',
  'ocean_mint',
  'gamma_mosaic',
  'canva_pop',
  'chronicle_paper',
  'modal_dusk',
  'moda_canvas',
  'studio_daylight',
];

export function getThemeTokens(themeId) {
  const t = THEME_MAP[themeId];
  if (!t) return getThemeTokens('neon_vc');
  return { id: themeId, ...t };
}

export function resolveSlideTheme(themePack, slideIndex) {
  if (themePack === 'variety') {
    const id = VARIETY_THEME_IDS[slideIndex % VARIETY_THEME_IDS.length];
    return getThemeTokens(id);
  }
  if (themePack === 'random') {
    return getThemeTokens('neon_vc');
  }
  return getThemeTokens(themePack);
}

function encodeSvgSeed(s) {
  return (s || '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .slice(0, 42);
}

/**
 * Data URL suitable for <img src> — html2canvas reliably paints <img>, not CSS background-image
 * for remote (Pexels) or complex SVG layers.
 */
export function getSlideBackgroundImgSrc(seed, layout, tokens) {
  const normalizedSeed = encodeSvgSeed(seed);
  const layoutTone =
    tokens.layoutTones?.[layout] ||
    tokens.layoutTones?.disruptor ||
    '#20b2aa';

  if (tokens.isLight) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="paper" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f4f2ee"/><stop offset="100%" stop-color="#e8e4de"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#paper)"/><rect x="0" y="0" width="14" height="1080" fill="#ea580c"/><rect x="40" y="80" width="400" height="4" fill="#ea580c" fill-opacity="0.35"/><circle cx="1700" cy="200" r="120" fill="${layoutTone}" fill-opacity="0.08"/><text x="60" y="1020" fill="#57524a" fill-opacity="0.35" font-size="28" font-family="Georgia, serif">${normalizedSeed}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  const base = tokens.svgBase || '#07090f';
  const orb2 = tokens.orbSecondary || '#0284c7';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="r1" cx="25%" cy="20%" r="60%"><stop offset="0%" stop-color="${layoutTone}" stop-opacity="0.42"/><stop offset="100%" stop-color="#05070d" stop-opacity="0.06"/></radialGradient><radialGradient id="r2" cx="82%" cy="70%" r="50%"><stop offset="0%" stop-color="${orb2}" stop-opacity="0.22"/><stop offset="100%" stop-color="#0b1220" stop-opacity="0.02"/></radialGradient><filter id="blur"><feGaussianBlur stdDeviation="40"/></filter></defs><rect width="1920" height="1080" fill="${base}"/><rect width="1920" height="1080" fill="url(#r1)"/><rect width="1920" height="1080" fill="url(#r2)"/><circle cx="420" cy="240" r="180" fill="${layoutTone}" fill-opacity="0.16" filter="url(#blur)"/><circle cx="1500" cy="760" r="260" fill="${orb2}" fill-opacity="0.12" filter="url(#blur)"/><text x="80" y="980" fill="white" fill-opacity="0.15" font-size="36" font-family="Inter, Arial">${normalizedSeed}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function getSlideBackgroundImage(seed, layout, tokens) {
  const src = getSlideBackgroundImgSrc(seed, layout, tokens);
  return `url("${src}")`;
}
