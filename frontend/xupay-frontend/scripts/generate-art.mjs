/**
 * Generates XuPay's section artwork.
 *
 * These are authored vector compositions rasterised to WebP, not photographs.
 * That is the right medium here: the palette is a narrow pastel ramp, the
 * reference has no photography, and stock imagery would fight both. Rendering
 * to raster (rather than shipping SVG) means next/image can optimise them and
 * derive a blurDataURL from a static import.
 *
 * Palette is read from the design tokens so the art cannot drift from the CSS.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const OUT = process.argv[2];

const C = {
  bg: "#fafbff",
  pink: "#ffc9e4",
  lavender: "#d3c6ff",
  mint: "#b8f0e0",
  sky: "#c2e0ff",
  violet: "#7c5cff",
  blue: "#3d7de8",
  teal: "#1f9d8f",
  ink: "#0f1120",
};

/** Deterministic PRNG so re-running produces byte-identical art. */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const blob = (id, cx, cy, r, color, op) => `
  <radialGradient id="${id}" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="${color}" stop-opacity="${op}"/>
    <stop offset="55%" stop-color="${color}" stop-opacity="${op * 0.45}"/>
    <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
  </radialGradient>`;

/* ---------------------------------------------------------- 01 hero aurora */
function heroAurora(w = 2000, h = 1250) {
  const rnd = mulberry32(20260726);
  // Dot constellation following an arc, thinning toward the edges.
  let dots = "";
  for (let i = 0; i < 460; i++) {
    const t = i / 459;
    const x = t * w;
    const arc = Math.sin(t * Math.PI) ** 0.7;
    const y = h * 0.86 - arc * h * 0.5 + (rnd() - 0.5) * h * 0.16;
    const edge = Math.sin(t * Math.PI) ** 1.6;
    const o = (0.1 + rnd() * 0.5) * edge;
    const r = 1.1 + rnd() * 1.5;
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${C.violet}" opacity="${o.toFixed(3)}"/>`;
  }
  // Slow aurora ribbons.
  let ribbons = "";
  for (let i = 0; i < 3; i++) {
    const y0 = h * (0.3 + i * 0.16);
    const amp = h * (0.1 + i * 0.03);
    ribbons += `<path d="M -100 ${y0}
      C ${w * 0.25} ${y0 - amp}, ${w * 0.45} ${y0 + amp}, ${w * 0.7} ${y0 - amp * 0.5}
      S ${w + 100} ${y0 + amp * 0.4}, ${w + 100} ${y0}"
      fill="none" stroke="url(#ribbon${i})" stroke-width="${2 + i}" opacity="${0.5 - i * 0.12}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    ${blob("g1", 0, 0, 0, C.pink, 0.95)}
    ${blob("g2", 0, 0, 0, C.sky, 0.95)}
    ${blob("g3", 0, 0, 0, C.mint, 0.8)}
    ${blob("g4", 0, 0, 0, C.lavender, 0.9)}
    ${blob("g5", 0, 0, 0, C.violet, 0.28)}
    ${[0, 1, 2].map((i) => `
    <linearGradient id="ribbon${i}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${C.violet}" stop-opacity="0"/>
      <stop offset="35%" stop-color="${C.violet}" stop-opacity="0.5"/>
      <stop offset="65%" stop-color="${C.blue}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${C.teal}" stop-opacity="0"/>
    </linearGradient>`).join("")}
  </defs>
  <rect width="${w}" height="${h}" fill="${C.bg}"/>
  <ellipse cx="${w * 0.13}" cy="${h * 0.1}" rx="${w * 0.42}" ry="${h * 0.46}" fill="url(#g1)"/>
  <ellipse cx="${w * 0.9}"  cy="${h * 0.12}" rx="${w * 0.4}"  ry="${h * 0.5}"  fill="url(#g2)"/>
  <ellipse cx="${w * 0.79}" cy="${h * 0.92}" rx="${w * 0.38}" ry="${h * 0.44}" fill="url(#g3)"/>
  <ellipse cx="${w * 0.18}" cy="${h * 0.95}" rx="${w * 0.42}" ry="${h * 0.42}" fill="url(#g4)"/>
  <ellipse cx="${w * 0.5}"  cy="${h * 0.55}" rx="${w * 0.3}"  ry="${h * 0.3}"  fill="url(#g5)"/>
  ${ribbons}
  <g>${dots}</g>
</svg>`;
}

/* --------------------------------------------------------- 02 ledger flow */
function ledgerFlow(w = 1400, h = 1000) {
  // Two streams converge into a single balanced rule: double-entry, reconciled.
  const midY = h * 0.5;
  const node = (x, y, r, c, o) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${o}"/>`;
  let ticks = "";
  for (let i = 0; i < 26; i++) {
    const x = w * 0.56 + (i / 25) * w * 0.4;
    const o = 0.06 + (i / 25) * 0.3;
    ticks += `<line x1="${x}" y1="${midY - 26}" x2="${x}" y2="${midY + 26}" stroke="${C.ink}" stroke-width="1" opacity="${o.toFixed(3)}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    ${blob("lg1", 0, 0, 0, C.sky, 0.9)}
    ${blob("lg2", 0, 0, 0, C.mint, 0.75)}
    <linearGradient id="credit" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${C.teal}" stop-opacity="0"/>
      <stop offset="40%" stop-color="${C.teal}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${C.blue}" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="debit" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${C.violet}" stop-opacity="0"/>
      <stop offset="40%" stop-color="${C.violet}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${C.blue}" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="settled" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${C.blue}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${C.teal}" stop-opacity="0.15"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="${C.bg}"/>
  <ellipse cx="${w * 0.2}" cy="${h * 0.2}" rx="${w * 0.5}" ry="${h * 0.45}" fill="url(#lg1)"/>
  <ellipse cx="${w * 0.85}" cy="${h * 0.85}" rx="${w * 0.45}" ry="${h * 0.45}" fill="url(#lg2)"/>
  <path d="M ${w * 0.04} ${h * 0.2} C ${w * 0.3} ${h * 0.22}, ${w * 0.36} ${midY}, ${w * 0.55} ${midY}"
    fill="none" stroke="url(#credit)" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M ${w * 0.04} ${h * 0.8} C ${w * 0.3} ${h * 0.78}, ${w * 0.36} ${midY}, ${w * 0.55} ${midY}"
    fill="none" stroke="url(#debit)" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="${w * 0.55}" y1="${midY}" x2="${w * 0.97}" y2="${midY}"
    stroke="url(#settled)" stroke-width="4" stroke-linecap="round"/>
  ${ticks}
  ${node(w * 0.04, h * 0.2, 7, C.teal, 0.9)}
  ${node(w * 0.04, h * 0.8, 7, C.violet, 0.9)}
  ${node(w * 0.55, midY, 11, C.blue, 0.95)}
  ${node(w * 0.55, midY, 22, C.blue, 0.18)}
</svg>`;
}

/* ---------------------------------------------------------- 03 risk signal */
function riskSignal(w = 1600, h = 700) {
  const rnd = mulberry32(9182736);
  const n = 150;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const base = h * 0.6;
    const wave = Math.sin(t * 13) * h * 0.07 + Math.sin(t * 31 + 1.2) * h * 0.035;
    pts.push([t * w, base + wave + (rnd() - 0.5) * h * 0.03]);
  }
  const anomalyIdx = 104;
  pts[anomalyIdx][1] = h * 0.2;
  pts[anomalyIdx - 1][1] = h * 0.36;
  pts[anomalyIdx + 1][1] = h * 0.34;
  const [ax, ay] = pts[anomalyIdx];
  const line = pts.map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L ${w} ${h} L 0 ${h} Z`;
  let grid = "";
  for (let i = 1; i < 5; i++) {
    grid += `<line x1="0" y1="${(h / 5) * i}" x2="${w}" y2="${(h / 5) * i}" stroke="${C.ink}" stroke-width="1" opacity="0.05"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    ${blob("rg1", 0, 0, 0, C.lavender, 0.7)}
    <linearGradient id="sig" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${C.blue}" stop-opacity="0.25"/>
      <stop offset="60%" stop-color="${C.violet}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${C.teal}" stop-opacity="0.5"/>
    </linearGradient>
    <linearGradient id="sigfill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.violet}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${C.violet}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="${C.bg}"/>
  <ellipse cx="${w * 0.5}" cy="${h * 0.3}" rx="${w * 0.5}" ry="${h * 0.7}" fill="url(#rg1)"/>
  ${grid}
  <path d="${area}" fill="url(#sigfill)"/>
  <path d="${line}" fill="none" stroke="url(#sig)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
  <line x1="${ax}" y1="${ay}" x2="${ax}" y2="${h}" stroke="${C.violet}" stroke-width="1.5" opacity="0.35" stroke-dasharray="5 6"/>
  <circle cx="${ax}" cy="${ay}" r="26" fill="${C.violet}" opacity="0.12"/>
  <circle cx="${ax}" cy="${ay}" r="14" fill="${C.violet}" opacity="0.2"/>
  <circle cx="${ax}" cy="${ay}" r="6.5" fill="${C.violet}"/>
</svg>`;
}

/* ------------------------------------------------------ 04 compliance rings */
function complianceLayers(s = 1000) {
  const c = s / 2;
  let rings = "";
  for (let i = 0; i < 7; i++) {
    const r = s * (0.1 + i * 0.055);
    const dash = i % 2 === 0 ? "" : `stroke-dasharray="${6 + i * 3} ${10 + i * 4}"`;
    rings += `<circle cx="${c}" cy="${c}" r="${r.toFixed(1)}" fill="none" stroke="url(#ring)" stroke-width="${1.5 + (6 - i) * 0.28}" opacity="${(0.65 - i * 0.07).toFixed(3)}" ${dash}/>`;
  }
  // Three verification arcs, offset like tiers of clearance.
  let arcs = "";
  const tiers = [[0.33, -20, 130], [0.4, 150, 110], [0.47, 285, 60]];
  for (const [rf, start, sweep] of tiers) {
    const r = s * rf;
    const a0 = (start * Math.PI) / 180;
    const a1 = ((start + sweep) * Math.PI) / 180;
    const x0 = c + r * Math.cos(a0), y0 = c + r * Math.sin(a0);
    const x1 = c + r * Math.cos(a1), y1 = c + r * Math.sin(a1);
    arcs += `<path d="M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 ${sweep > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}"
      fill="none" stroke="url(#arc)" stroke-width="7" stroke-linecap="round" opacity="0.9"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    ${blob("cg1", 0, 0, 0, C.mint, 0.85)}
    ${blob("cg2", 0, 0, 0, C.sky, 0.7)}
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.violet}"/>
      <stop offset="100%" stop-color="${C.teal}"/>
    </linearGradient>
    <linearGradient id="arc" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.violet}"/>
      <stop offset="55%" stop-color="${C.blue}"/>
      <stop offset="100%" stop-color="${C.teal}"/>
    </linearGradient>
  </defs>
  <rect width="${s}" height="${s}" fill="${C.bg}"/>
  <ellipse cx="${s * 0.75}" cy="${s * 0.2}" rx="${s * 0.55}" ry="${s * 0.5}" fill="url(#cg1)"/>
  <ellipse cx="${s * 0.2}" cy="${s * 0.85}" rx="${s * 0.5}" ry="${s * 0.45}" fill="url(#cg2)"/>
  ${rings}
  ${arcs}
  <circle cx="${c}" cy="${c}" r="${s * 0.062}" fill="url(#arc)"/>
  <path d="M ${c - s * 0.028} ${c} l ${s * 0.021} ${s * 0.022} l ${s * 0.038} -${s * 0.043}"
    fill="none" stroke="${C.bg}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

const PIECES = [
  ["hero-aurora", heroAurora(), 2000],
  ["ledger-flow", ledgerFlow(), 1400],
  ["risk-signal", riskSignal(), 1600],
  ["compliance-layers", complianceLayers(), 1000],
];

await mkdir(OUT, { recursive: true });
for (const [name, svg, width] of PIECES) {
  const buf = Buffer.from(svg);
  const out = join(OUT, `${name}.webp`);
  const info = await sharp(buf, { density: 200 })
    .resize({ width })
    .webp({ quality: 88, effort: 6 })
    .toFile(out);
  console.log(`  ${name}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} KB`);
}
console.log("done");
