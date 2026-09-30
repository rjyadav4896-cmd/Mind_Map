export type ElementType = 'sticky' | 'shape' | 'text' | 'frame' | 'drawing' | 'image';

export type ShapeType =
  | 'rectangle'
  | 'rounded-rectangle'
  | 'circle'
  | 'diamond'
  | 'cylinder'
  | 'star'
  | 'triangle'
  | 'cloud';

export type ToolMode =
  | 'select'
  | 'hand'
  | 'sticky'
  | 'shape'
  | 'connector'
  | 'draw'
  | 'text'
  | 'eraser'
  | 'frame';

export type GridMode = 'dots' | 'grid' | 'blank';

export type PriorityLevel = 'urgent' | 'high' | 'normal' | 'low' | 'none';

export type ConnectorStyle = 'curved' | 'straight' | 'orthogonal';

export type AnchorPosition = 'top' | 'right' | 'bottom' | 'left' | 'center';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface StickyColorConfig {
  id: string;
  name: string;
  bg: string;
  border: string;
  text: string;
  tagBg: string;
  tagText: string;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // in degrees
  zIndex: number;
  locked?: boolean;
  groupId?: string;

  // Sticky Note specific
  text?: string;
  color?: string; // color ID e.g. 'yellow', 'mint', 'rose', 'lavender', 'sky', 'peach', 'dark'
  fontSize?: number;
  tags?: string[];
  priority?: PriorityLevel;
  isChecklist?: boolean;
  checklistItems?: ChecklistItem[];
  author?: string;

  // Shape specific
  shapeType?: ShapeType;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  opacity?: number;
  label?: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';

  // Text specific
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';

  // Frame / Grouping specific
  title?: string;
  frameTheme?: 'slate' | 'blue' | 'emerald' | 'amber' | 'purple' | 'rose';

  // Drawing specific
  points?: Array<{ x: number; y: number }>;

  // Image specific
  src?: string;
  aspectRatio?: number;
}

export interface ConnectionWire {
  id: string;
  fromId: string;
  fromAnchor: AnchorPosition;
  toId: string;
  toAnchor: AnchorPosition;
  style: ConnectorStyle;
  color: string;
  strokeWidth: number;
  dashed?: boolean;
  label?: string;
  startArrow?: boolean;
  endArrow?: boolean;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectionState {
  isSelecting: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface ConnectingDraft {
  fromNodeId: string;
  fromAnchor: AnchorPosition;
  currentWorldPoint: Point;
  targetNodeId?: string;
  targetAnchor?: AnchorPosition;
}

export interface BoardMetadata {
  id: string;
  workspaceId?: string; // If undefined, root workspace
  name: string;
  updatedAt: number;
  elementCount: number;
  previewColor?: string;
}

export interface WorkspaceFolder {
  id: string;
  name: string;
  color?: string;
  createdAt: number;
}

export interface BoardData {
  id: string;
  workspaceId?: string;
  name: string;
  updatedAt: number;
  elements: CanvasElement[];
  connections: ConnectionWire[];
  viewport: Viewport;
}

export interface SnapGuide {
  type: 'x' | 'y';
  position: number;
  start: number;
  end: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';

