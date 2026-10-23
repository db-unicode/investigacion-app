// Helpers para construir el documento Word con docx-js.
const fs = require('fs');
const {
  Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  ImageRun, HeadingLevel, AlignmentType, LevelFormat,
} = require('docx');

const NAVY = '1F3864';
const PAGE_W = 12240, MARGIN = 1134;
const CONTENT_W = PAGE_W - 2 * MARGIN; // 9972 DXA
const FONT = 'Calibri';

// --- CSV ---
function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => x !== ''));
}
function readCSV(path) {
  const rows = parseCSV(fs.readFileSync(path, 'utf8'));
  const header = rows[0];
  return { header, rows: rows.slice(1), objs: rows.slice(1).map(r => Object.fromEntries(header.map((h, i) => [h, r[i] ?? '']))) };
}

// --- Texto con **negrita** y `código` ---
function runs(text, opts = {}) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...opts }));
    const t = m[0];
    if (t.startsWith('**')) out.push(new TextRun({ text: t.slice(2, -2), bold: true, ...opts }));
    else out.push(new TextRun({ text: t.slice(1, -1), font: 'Consolas', ...opts, size: (opts.size || 21) - 2 }));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...opts }));
  return out;
}
const P = (text, o = {}) => new Paragraph({ children: runs(text, o.run || {}), spacing: { after: 100, line: 264 }, alignment: o.align || AlignmentType.JUSTIFIED, ...(o.para || {}) });
const H1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)], spacing: { before: 280, after: 120 } });
const H2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)], spacing: { before: 200, after: 100 } });
const H3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)], spacing: { before: 140, after: 80 } });
const B = (text, level = 0) => new Paragraph({ numbering: { reference: 'bullets', level }, children: runs(text), spacing: { after: 60, line: 252 } });
const N = (text, ref = 'nums') => new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs(text), spacing: { after: 60, line: 252 } });
const Caption = t => new Paragraph({ children: [new TextRun({ text: t, italics: true, size: 18, color: '404040' })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 160 } });

const thin = { style: BorderStyle.SINGLE, size: 4, color: '8EA9DB' };
const borders = { top: thin, bottom: thin, left: thin, right: thin };

function table(header, rows, widthsPct, o = {}) {
  const size = o.size || 16;
  const total = CONTENT_W;
  let widths = widthsPct.map(p => Math.round(total * p / widthsPct.reduce((a, b) => a + b, 0)));
  widths[widths.length - 1] += total - widths.reduce((a, b) => a + b, 0);
  const mk = (text, w, isHead, fill) => new TableCell({
    width: { size: w, type: WidthType.DXA }, borders,
    shading: isHead ? { fill: NAVY, type: ShadingType.CLEAR, color: 'auto' } : (fill ? { fill, type: ShadingType.CLEAR, color: 'auto' } : undefined),
    margins: { top: 40, bottom: 40, left: 70, right: 70 },
    children: String(text ?? '').split('\n').map(line => new Paragraph({
      children: runs(line, { size, bold: isHead || undefined, color: isHead ? 'FFFFFF' : undefined }),
      spacing: { after: 0, line: 240 },
    })),
  });
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: header.map((h, i) => mk(h, widths[i], true)) }),
      ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((c, i) => mk(c, widths[i], false, o.zebra !== false && ri % 2 ? 'F2F5FB' : null)) })),
    ],
  });
}

// Recuadro de una celda (texto monoespaciado o aviso).
function box(lines, o = {}) {
  const dashed = { style: o.dashed ? BorderStyle.DASHED : BorderStyle.SINGLE, size: 6, color: o.border || '8EA9DB' };
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [CONTENT_W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      borders: { top: dashed, bottom: dashed, left: dashed, right: dashed },
      shading: { fill: o.fill || 'F7F7F7', type: ShadingType.CLEAR, color: 'auto' },
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      children: lines.map(l => new Paragraph({
        alignment: o.center ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { after: 0, line: o.mono ? 220 : 252 },
        children: o.mono ? [new TextRun({ text: l || ' ', font: 'Consolas', size: o.size || 15 })] : runs(l, { size: o.size || 19, italics: o.italic, color: o.color }),
      })),
    })] })],
  });
}

function pngSize(path) {
  const b = fs.readFileSync(path);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
// Imagen ajustada al ancho (px a 96 dpi) con altura máxima.
function image(path, o = {}) {
  const { w, h } = pngSize(path);
  const maxW = o.maxW || 660, maxH = o.maxH || 820;
  let width = maxW, height = Math.round(h * maxW / w);
  if (height > maxH) { height = maxH; width = Math.round(w * maxH / h); }
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 40 },
    children: [new ImageRun({ type: 'png', data: fs.readFileSync(path), transformation: { width, height } })] });
}

const numbering = { config: [
  { reference: 'bullets', levels: [
    { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 260 } } } },
    { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 900, hanging: 260 } } } } ] },
  ...['nums', 'nums2', 'nums3', 'nums4', 'nums5'].map(reference => ({ reference, levels: [
    { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 300 } } } } ] })),
] };

const styles = {
  default: { document: { run: { font: FONT, size: 21 } } },
  paragraphStyles: [
    { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, color: NAVY, font: FONT }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 0 } },
    { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, color: NAVY, font: FONT }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } },
    { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 21, bold: true, color: '2F5496', font: FONT }, paragraph: { spacing: { before: 140, after: 80 }, outlineLevel: 2 } },
  ],
};

module.exports = { readCSV, P, H1, H2, H3, B, N, Caption, table, box, image, numbering, styles, NAVY, CONTENT_W, MARGIN, PAGE_W, runs };
