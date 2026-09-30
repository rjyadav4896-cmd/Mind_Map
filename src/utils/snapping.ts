import { CanvasElement, SnapGuide } from '../types/canvas';

interface Box {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SnapResult {
  snappedX: number;
  snappedY: number;
  guides: SnapGuide[];
}

export function findSnappingGuides(
  target: Box,
  elements: CanvasElement[],
  threshold = 6
): SnapResult {
  let snappedX = target.x;
  let snappedY = target.y;
  const guides: SnapGuide[] = [];

  const targetCenterX = target.x + target.width / 2;
  const targetRight = target.x + target.width;

  const targetCenterY = target.y + target.height / 2;
  const targetBottom = target.y + target.height;

  let minDeltaX = threshold + 1;
  let minDeltaY = threshold + 1;

  for (const el of elements) {
    if (el.id === target.id || el.type === 'drawing') continue;

    const elCenterX = el.x + el.width / 2;
    const elRight = el.x + el.width;

    const elCenterY = el.y + el.height / 2;
    const elBottom = el.y + el.height;

    // Check X alignments:
    // Left-Left
    let delta = Math.abs(target.x - el.x);
    if (delta < threshold && delta < minDeltaX) {
      minDeltaX = delta;
      snappedX = el.x;
      guides.push({
        type: 'x',
        position: el.x,
        start: Math.min(target.y, el.y) - 20,
        end: Math.max(targetBottom, elBottom) + 20,
      });
    }

    // Center-Center X
    delta = Math.abs(targetCenterX - elCenterX);
    if (delta < threshold && delta < minDeltaX) {
      minDeltaX = delta;
      snappedX = elCenterX - target.width / 2;
      guides.push({
        type: 'x',
        position: elCenterX,
        start: Math.min(target.y, el.y) - 20,
        end: Math.max(targetBottom, elBottom) + 20,
      });
    }

    // Right-Right
    delta = Math.abs(targetRight - elRight);
    if (delta < threshold && delta < minDeltaX) {
      minDeltaX = delta;
      snappedX = elRight - target.width;
      guides.push({
        type: 'x',
        position: elRight,
        start: Math.min(target.y, el.y) - 20,
        end: Math.max(targetBottom, elBottom) + 20,
      });
    }

    // Check Y alignments:
    // Top-Top
    delta = Math.abs(target.y - el.y);
    if (delta < threshold && delta < minDeltaY) {
      minDeltaY = delta;
      snappedY = el.y;
      guides.push({
        type: 'y',
        position: el.y,
        start: Math.min(target.x, el.x) - 20,
        end: Math.max(targetRight, elRight) + 20,
      });
    }

    // Center-Center Y
    delta = Math.abs(targetCenterY - elCenterY);
    if (delta < threshold && delta < minDeltaY) {
      minDeltaY = delta;
      snappedY = elCenterY - target.height / 2;
      guides.push({
        type: 'y',
        position: elCenterY,
        start: Math.min(target.x, el.x) - 20,
        end: Math.max(targetRight, elRight) + 20,
      });
    }

    // Bottom-Bottom
    delta = Math.abs(targetBottom - elBottom);
    if (delta < threshold && delta < minDeltaY) {
      minDeltaY = delta;
      snappedY = elBottom - target.height;
      guides.push({
        type: 'y',
        position: elBottom,
        start: Math.min(target.x, el.x) - 20,
        end: Math.max(targetRight, elRight) + 20,
      });
    }
  }

  // Filter to keep the strongest 1-2 guides
  const xGuides = guides.filter((g) => g.type === 'x').slice(-1);
  const yGuides = guides.filter((g) => g.type === 'y').slice(-1);

  return {
    snappedX,
    snappedY,
    guides: [...xGuides, ...yGuides],
  };
}

/**
 * Arranges selected sticky notes into a structured Kanban board inside a Frame
 */
export function organizeAsKanban(selectedNotes: CanvasElement[]): {
  arranged: CanvasElement[];
  frame: CanvasElement;
} {
  if (selectedNotes.length === 0) {
    throw new Error('No elements selected');
  }

  // Find minX, minY as origin
  const minX = Math.min(...selectedNotes.map((n) => n.x));
  const minY = Math.min(...selectedNotes.map((n) => n.y));

  // Determine categories (by priority or tags or split into 3 columns: To Do, In Progress, Done)
  const columns = ['📋 Backlog', '⚡ In Progress', '✅ Done'];
  const columnWidth = 260;
  const colGap = 20;
  const cardGap = 16;
  const headerHeight = 70;

  const colBuckets: CanvasElement[][] = [[], [], []];

  selectedNotes.forEach((note, index) => {
    if (note.priority === 'urgent' || note.priority === 'high') {
      colBuckets[0].push(note);
    } else if (note.priority === 'normal') {
      colBuckets[1].push(note);
    } else if (note.priority === 'low' || (note.isChecklist && note.checklistItems?.every(i => i.completed))) {
      colBuckets[2].push(note);
    } else {
      // Distribute evenly across 3 columns
      colBuckets[index % 3].push(note);
    }
  });

  const arranged: CanvasElement[] = [];
  let maxColHeight = 0;

  colBuckets.forEach((bucket, colIdx) => {
    let currentY = minY + headerHeight;
    const colX = minX + 24 + colIdx * (columnWidth + colGap);

    bucket.forEach((item) => {
      const standardHeight = Math.max(item.height, 120);
      arranged.push({
        ...item,
        x: colX,
        y: currentY,
        width: columnWidth,
        height: standardHeight,
        zIndex: 10,
      });
      currentY += standardHeight + cardGap;
    });

    const totalHeight = currentY - minY;
    if (totalHeight > maxColHeight) {
      maxColHeight = totalHeight;
    }
  });

  const totalWidth = 24 * 2 + 3 * columnWidth + 2 * colGap;
  const finalFrameHeight = Math.max(maxColHeight + 30, 480);

  const frame: CanvasElement = {
    id: `frame-kanban-${Date.now()}`,
    type: 'frame',
    title: '⚡ Kanban Grid Workflow',
    x: minX,
    y: minY,
    width: totalWidth,
    height: finalFrameHeight,
    zIndex: 1,
    frameTheme: 'blue',
  };

  return { arranged, frame };
}

/**
 * Arranges selected elements into a structured 2D table matrix
 */
export function organizeAsTable(selectedElements: CanvasElement[]): {
  arranged: CanvasElement[];
  frame: CanvasElement;
} {
  if (selectedElements.length === 0) {
    throw new Error('No elements selected');
  }

  const minX = Math.min(...selectedElements.map((n) => n.x));
  const minY = Math.min(...selectedElements.map((n) => n.y));

  const count = selectedElements.length;
  const cols = count <= 4 ? 2 : count <= 9 ? 3 : 4;
  const cardWidth = 240;
  const cardHeight = 140;
  const gap = 20;
  const padding = 24;
  const headerHeight = 60;

  const arranged: CanvasElement[] = selectedElements.map((item, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    return {
      ...item,
      x: minX + padding + col * (cardWidth + gap),
      y: minY + headerHeight + row * (cardHeight + gap),
      width: cardWidth,
      height: cardHeight,
      zIndex: 10,
    };
  });

  const rows = Math.ceil(count / cols);
  const totalWidth = padding * 2 + cols * cardWidth + (cols - 1) * gap;
  const totalHeight = headerHeight + rows * cardHeight + (rows - 1) * gap + padding;

  const frame: CanvasElement = {
    id: `frame-table-${Date.now()}`,
    type: 'frame',
    title: `📊 Structured Table Matrix (${rows}x${cols})`,
    x: minX,
    y: minY,
    width: totalWidth,
    height: totalHeight,
    zIndex: 1,
    frameTheme: 'slate',
  };

  return { arranged, frame };
}
