import { CanvasElement, ConnectionWire, Viewport } from '../types/canvas';
import { generateConnectorPath, pointsToSvgPath } from './geometry';
import { STICKY_PALETTES } from './colors';

export function exportBoardAsJson(
  title: string,
  elements: CanvasElement[],
  connections: ConnectionWire[],
  viewport: Viewport
) {
  const data = {
    version: '1.0',
    app: 'CanvasFlow',
    exportedAt: new Date().toISOString(),
    title,
    viewport,
    elements,
    connections,
  };

  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '-')}-board.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function generateSvgString(
  elements: CanvasElement[],
  connections: ConnectionWire[],
  padding = 40
): { svg: string; width: number; height: number } {
  if (elements.length === 0) {
    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#f8f9fa"/><text x="400" y="300" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="20">Empty Board</text></svg>`,
      width: 800,
      height: 600,
    };
  }

  // Calculate bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  }

  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const width = Math.max(maxX - minX, 400);
  const height = Math.max(maxY - minY, 300);

  const elementMap = new Map(elements.map((e) => [e.id, e]));

  let wiresSvg = '';
  for (const wire of connections) {
    const fromEl = elementMap.get(wire.fromId);
    const toEl = elementMap.get(wire.toId);
    if (!fromEl || !toEl) continue;

    // Relative points
    const p1 = {
      x: fromEl.x + (wire.fromAnchor === 'right' ? fromEl.width : wire.fromAnchor === 'left' ? 0 : fromEl.width / 2) - minX,
      y: fromEl.y + (wire.fromAnchor === 'bottom' ? fromEl.height : wire.fromAnchor === 'top' ? 0 : fromEl.height / 2) - minY,
    };
    const p2 = {
      x: toEl.x + (wire.toAnchor === 'right' ? toEl.width : wire.toAnchor === 'left' ? 0 : toEl.width / 2) - minX,
      y: toEl.y + (wire.toAnchor === 'bottom' ? toEl.height : wire.toAnchor === 'top' ? 0 : toEl.height / 2) - minY,
    };

    const { path, midPoint } = generateConnectorPath(p1, p2, wire.fromAnchor, wire.toAnchor, wire.style);
    wiresSvg += `
      <g>
        <path d="${path}" fill="none" stroke="${wire.color || '#64748B'}" stroke-width="${wire.strokeWidth || 2}" ${wire.dashed ? 'stroke-dasharray="6,4"' : ''} stroke-linecap="round" />
        ${wire.label ? `
          <rect x="${midPoint.x - 35}" y="${midPoint.y - 12}" width="70" height="24" rx="12" fill="#FFFFFF" stroke="${wire.color || '#64748B'}" stroke-width="1"/>
          <text x="${midPoint.x}" y="${midPoint.y + 4}" text-anchor="middle" font-size="11" font-weight="500" fill="#334155" font-family="sans-serif">${escapeXml(wire.label)}</text>
        ` : ''}
      </g>
    `;
  }

  let nodesSvg = '';
  for (const el of elements) {
    const rx = el.x - minX;
    const ry = el.y - minY;

    if (el.type === 'sticky') {
      const palette = STICKY_PALETTES[el.color || 'yellow'] || STICKY_PALETTES.yellow;
      const lines = (el.text || '').split('\n');
      
      nodesSvg += `
        <g transform="translate(${rx}, ${ry})">
          <rect width="${el.width}" height="${el.height}" rx="14" fill="${palette.bg}" stroke="${palette.border}" stroke-width="1.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"/>
          <text x="16" y="28" font-size="14" font-weight="500" fill="${palette.text}" font-family="sans-serif">
            ${lines.map((line, idx) => `<tspan x="16" dy="${idx === 0 ? 0 : 20}">${escapeXml(line)}</tspan>`).join('')}
          </text>
          ${el.tags && el.tags.length > 0 ? `
            <text x="16" y="${el.height - 14}" font-size="11" font-weight="600" fill="${palette.text}" opacity="0.75" font-family="sans-serif">
              #${escapeXml(el.tags.join(' #'))}
            </text>
          ` : ''}
        </g>
      `;
    } else if (el.type === 'shape') {
      const fill = el.fill || '#F1F5F9';
      const stroke = el.stroke || '#94A3B8';
      const strokeWidth = el.strokeWidth || 2;
      const label = el.label || '';
      const textColor = el.textColor || '#0F172A';

      if (el.shapeType === 'circle') {
        nodesSvg += `
          <g transform="translate(${rx}, ${ry})">
            <ellipse cx="${el.width / 2}" cy="${el.height / 2}" rx="${el.width / 2}" ry="${el.height / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
            <text x="${el.width / 2}" y="${el.height / 2 + 5}" text-anchor="middle" font-size="14" font-weight="600" fill="${textColor}" font-family="sans-serif">${escapeXml(label)}</text>
          </g>
        `;
      } else if (el.shapeType === 'diamond') {
        const d = `M ${el.width / 2} 0 L ${el.width} ${el.height / 2} L ${el.width / 2} ${el.height} L 0 ${el.height / 2} Z`;
        nodesSvg += `
          <g transform="translate(${rx}, ${ry})">
            <path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
            <text x="${el.width / 2}" y="${el.height / 2 + 5}" text-anchor="middle" font-size="14" font-weight="600" fill="${textColor}" font-family="sans-serif">${escapeXml(label)}</text>
          </g>
        `;
      } else {
        nodesSvg += `
          <g transform="translate(${rx}, ${ry})">
            <rect width="${el.width}" height="${el.height}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
            <text x="${el.width / 2}" y="${el.height / 2 + 5}" text-anchor="middle" font-size="14" font-weight="600" fill="${textColor}" font-family="sans-serif">${escapeXml(label)}</text>
          </g>
        `;
      }
    } else if (el.type === 'drawing' && el.points) {
      const pathStr = pointsToSvgPath(el.points.map(p => ({ x: p.x - minX, y: p.y - minY })));
      nodesSvg += `
        <path d="${pathStr}" fill="none" stroke="${el.stroke || '#1E293B'}" stroke-width="${el.strokeWidth || 3}" stroke-linecap="round" stroke-linejoin="round" />
      `;
    } else if (el.type === 'frame') {
      nodesSvg += `
        <g transform="translate(${rx}, ${ry})">
          <rect width="${el.width}" height="${el.height}" rx="12" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="4,4"/>
          <text x="16" y="28" font-size="14" font-weight="600" fill="#334155" font-family="sans-serif">${escapeXml(el.title || 'Frame')}</text>
        </g>
      `;
    }
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <pattern id="grid-dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="1.2" fill="#CBD5E1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="#F8F9FA"/>
      <rect width="100%" height="100%" fill="url(#grid-dots)" opacity="0.6"/>
      ${wiresSvg}
      ${nodesSvg}
    </svg>
  `;

  return { svg, width, height };
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function exportBoardAsSvg(title: string, elements: CanvasElement[], connections: ConnectionWire[]) {
  const { svg } = generateSvgString(elements, connections);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', url);
  downloadAnchor.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '-')}.svg`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
}

export function exportBoardAsPng(
  title: string,
  elements: CanvasElement[],
  connections: ConnectionWire[],
  scale = 2
) {
  const { svg, width, height } = generateSvgString(elements, connections);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();

  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#F8F9FA';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);

    const pngUrl = canvas.toDataURL('image/png');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', pngUrl);
    downloadAnchor.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '-')}.png`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  img.src = url;
}
