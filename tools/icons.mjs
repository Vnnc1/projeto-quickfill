/**
 * Ícones de cada QuickFill, desenhados em código (sem dependências) e salvos como PNG.
 * Cada perfil tem cor e símbolo próprios:
 *   QA     — azul, lupa com ✓ (validação)
 *   DEV    — verde, </> (código)
 *   SCRUM  — âmbar, quadro kanban
 *   DESIGN — rosa, paleta de pintor
 */

import { deflateSync } from "node:zlib";

/* ---------- PNG ---------- */

const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, rgba) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0; rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4); }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

/* ---------- formas (coordenadas num quadro 0..1) ---------- */

const segDist = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
};
const inPoly = (x, y, pts) => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const roundRect = (x, y, r) => { const qx = Math.abs(x - 0.5) - (0.5 - r), qy = Math.abs(y - 0.5) - (0.5 - r); return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r <= 0; };
const stroke = (pts, w) => (x, y) => { for (let i = 1; i < pts.length; i++) if (segDist(x, y, ...pts[i - 1], ...pts[i]) <= w / 2) return true; return false; };
const ring = (cx, cy, r, w, from = 0, to = 360) => (x, y) => {
  const d = Math.abs(Math.hypot(x - cx, y - cy) - r);
  if (d > w / 2) return false;
  let a = (Math.atan2(y - cy, x - cx) * 180) / Math.PI; if (a < 0) a += 360;
  return from <= to ? a >= from && a <= to : a >= from || a <= to;
};
const poly = (pts) => (x, y) => inPoly(x, y, pts);
const disc = (cx, cy, r) => (x, y) => Math.hypot(x - cx, y - cy) <= r;
/** Retângulo de cantos arredondados. */
const rbox = (x0, y0, x1, y1, r) => (x, y) => { const cx = Math.min(Math.max(x, x0 + r), x1 - r), cy = Math.min(Math.max(y, y0 + r), y1 - r); return Math.hypot(x - cx, y - cy) <= r; };
const square = (cx, cy, h) => (x, y) => Math.abs(x - cx) <= h && Math.abs(y - cy) <= h;
const bezier = (p0, p1, p2, p3, n = 40) => Array.from({ length: n + 1 }, (_, i) => {
  const t = i / n, u = 1 - t;
  return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
          u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
});

export const SHAPES = { stroke, ring, poly, disc, square, bezier };

const ICONS = {
  qa: { top: [87, 157, 255], bottom: [40, 98, 214], glyph: [
    ring(0.44, 0.43, 0.2, 0.075), stroke([[0.585, 0.585], [0.76, 0.76]], 0.1),
    stroke([[0.355, 0.435], [0.42, 0.5], [0.535, 0.37]], 0.065),
  ] },
  dev: { top: [75, 206, 151], bottom: [26, 140, 96], glyph: [
    stroke([[0.36, 0.32], [0.2, 0.5], [0.36, 0.68]], 0.085), stroke([[0.64, 0.32], [0.8, 0.5], [0.64, 0.68]], 0.085),
    stroke([[0.55, 0.26], [0.45, 0.74]], 0.075),
  ] },
  // Quadro kanban: três colunas com cards
  scrum: { top: [245, 205, 71], bottom: [214, 140, 18], glyph: [
    rbox(0.2, 0.22, 0.36, 0.42, 0.03), rbox(0.2, 0.46, 0.36, 0.62, 0.03), rbox(0.2, 0.66, 0.36, 0.78, 0.03),
    rbox(0.42, 0.22, 0.58, 0.48, 0.03), rbox(0.42, 0.52, 0.58, 0.66, 0.03),
    rbox(0.64, 0.22, 0.8, 0.36, 0.03),
  ] },
  // Paleta de pintor com as "tintas" vazadas (furos mostram o fundo rosa)
  design: { top: [231, 116, 187], bottom: [158, 60, 170], glyph: [disc(0.5, 0.5, 0.31)],
    cut: [disc(0.36, 0.39, 0.058), disc(0.52, 0.3, 0.058), disc(0.67, 0.41, 0.058), disc(0.34, 0.58, 0.058), disc(0.6, 0.65, 0.085), disc(0.75, 0.73, 0.09)] },
};

/** Desenha o ícone do perfil no tamanho pedido (4×4 amostras por pixel para suavizar as bordas). */
export function renderIcon(role, size) {
  return renderSpec(ICONS[role], size);
}

/** Desenha um ícone a partir de { top, bottom, glyph: [formas], cut: [formas que furam o desenho] }. */
export function renderSpec(ic, size) {
  const buf = Buffer.alloc(size * size * 4);
  const S = 4;
  const radius = size <= 16 ? 0.2 : 0.22;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let bg = 0, fg = 0;
      for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
        const x = (px + (sx + 0.5) / S) / size, y = (py + (sy + 0.5) / S) / size;
        if (!roundRect(x, y, radius)) continue;
        bg++;
        if (ic.glyph.some((g) => g(x, y)) && !(ic.cut || []).some((g) => g(x, y))) fg++;
      }
      const t = py / Math.max(1, size - 1);
      const base = ic.top.map((c, i) => Math.round(c + (ic.bottom[i] - c) * t));
      const a = bg / (S * S), f = bg ? fg / bg : 0;
      const o = (py * size + px) * 4;
      for (let i = 0; i < 3; i++) buf[o + i] = Math.round(base[i] + (255 - base[i]) * f);
      buf[o + 3] = Math.round(a * 255);
    }
  }
  return png(size, buf);
}

export const ICON_SIZES = [16, 32, 48, 128];
