import { CanvasElement, AnchorPosition, Point, Rect, ConnectorStyle } from '../types/canvas';

/**
 * Calculates absolute world coordinates for a node anchor
 */
export function getNodeAnchorPoint(element: CanvasElement, anchor: AnchorPosition): Point {
  const { x, y, width, height } = element;
  
  switch (anchor) {
    case 'top':
      return { x: x + width / 2, y: y };
    case 'right':
      return { x: x + width, y: y + height / 2 };
    case 'bottom':
      return { x: x + width / 2, y: y + height };
    case 'left':
      return { x: x, y: y + height / 2 };
    case 'center':
    default:
      return { x: x + width / 2, y: y + height / 2 };
  }
}

/**
 * Determines closest anchor between two elements automatically
 */
export function getClosestAnchors(
  source: CanvasElement,
  target: CanvasElement
): { fromAnchor: AnchorPosition; toAnchor: AnchorPosition } {
  const sCenter = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
  const tCenter = { x: target.x + target.width / 2, y: target.y + target.height / 2 };

  const dx = tCenter.x - sCenter.x;
  const dy = tCenter.y - sCenter.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      return { fromAnchor: 'right', toAnchor: 'left' };
    } else {
      return { fromAnchor: 'left', toAnchor: 'right' };
    }
  } else {
    if (dy > 0) {
      return { fromAnchor: 'bottom', toAnchor: 'top' };
    } else {
      return { fromAnchor: 'top', toAnchor: 'bottom' };
    }
  }
}

/**
 * Generates an SVG path string based on connector style
 */
export function generateConnectorPath(
  p1: Point,
  p2: Point,
  fromAnchor: AnchorPosition,
  toAnchor: AnchorPosition,
  style: ConnectorStyle
): { path: string; midPoint: Point } {
  if (style === 'straight') {
    const midPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    return {
      path: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`,
      midPoint,
    };
  }

  if (style === 'orthogonal') {
    // Stepped right-angle elbow routing
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    let path = `M ${p1.x} ${p1.y}`;
    let midPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

    if (fromAnchor === 'left' || fromAnchor === 'right') {
      const midX = p1.x + dx / 2;
      path += ` L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`;
      midPoint = { x: midX, y: (p1.y + p2.y) / 2 };
    } else {
      const midY = p1.y + dy / 2;
      path += ` L ${p1.x} ${midY} L ${p2.x} ${midY} L ${p2.x} ${p2.y}`;
      midPoint = { x: (p1.x + p2.x) / 2, y: midY };
    }

    return { path, midPoint };
  }

  // Smooth Bezier Curve (Default FigJam/Miro style)
  const dx = Math.abs(p2.x - p1.x);
  const dy = Math.abs(p2.y - p1.y);
  const distance = Math.sqrt(dx * dx + dy * dy);
  const curvature = Math.max(Math.min(distance * 0.45, 140), 30);

  let cp1 = { ...p1 };
  let cp2 = { ...p2 };

  switch (fromAnchor) {
    case 'top':
      cp1.y -= curvature;
      break;
    case 'bottom':
      cp1.y += curvature;
      break;
    case 'left':
      cp1.x -= curvature;
      break;
    case 'right':
      cp1.x += curvature;
      break;
    default:
      cp1.x += curvature;
  }

  switch (toAnchor) {
    case 'top':
      cp2.y -= curvature;
      break;
    case 'bottom':
      cp2.y += curvature;
      break;
    case 'left':
      cp2.x -= curvature;
      break;
    case 'right':
      cp2.x += curvature;
      break;
    default:
      cp2.x -= curvature;
  }

  // Bezier curve midpoint estimation at t = 0.5
  const midPoint = {
    x: 0.125 * p1.x + 0.375 * cp1.x + 0.375 * cp2.x + 0.125 * p2.x,
    y: 0.125 * p1.y + 0.375 * cp1.y + 0.375 * cp2.y + 0.125 * p2.y,
  };

  const path = `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
  return { path, midPoint };
}

/**
 * Checks if a point lies inside a rectangle
 */
export function isPointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Checks if two rectangles intersect (for marquee selection)
 */
export function doRectanglesIntersect(r1: Rect, r2: Rect): boolean {
  return !(
    r2.x > r1.x + r1.width ||
    r2.x + r2.width < r1.x ||
    r2.y > r1.y + r1.height ||
    r2.y + r2.height < r1.y
  );
}

/**
 * Gets bounding box of multiple elements
 */
export function getElementsBoundingBox(elements: CanvasElement[]): Rect | null {
  if (elements.length === 0) return null;

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

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Smooths an array of drawing points into an SVG path
 */
export function pointsToSvgPath(points: Array<{ x: number; y: number }>): string {
  if (!points || points.length === 0) return '';
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    path += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
  }

  path += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return path;
}
