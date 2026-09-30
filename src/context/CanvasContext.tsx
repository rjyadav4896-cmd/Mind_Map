import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  CanvasElement,
  ConnectionWire,
  Viewport,
  ToolMode,
  GridMode,
  AnchorPosition,
  ConnectingDraft,
  Point,
  ShapeType,
  WorkspaceFolder,
  BoardMetadata,
  BoardData,
  SnapGuide,
  ThemeMode,
} from '../types/canvas';
import { TEMPLATES } from '../utils/templates';
import { getElementsBoundingBox } from '../utils/geometry';
import { organizeAsKanban, organizeAsTable } from '../utils/snapping';

interface HistorySnapshot {
  elements: CanvasElement[];
  connections: ConnectionWire[];
}

interface CanvasContextType {
  // Workspaces & Boards
  workspaces: WorkspaceFolder[];
  boards: BoardMetadata[];
  activeBoardId: string;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  createWorkspace: (name: string, color?: string) => string;
  renameWorkspace: (id: string, name: string) => void;
  deleteWorkspace: (id: string) => void;
  createBoard: (workspaceId?: string, name?: string) => string;
  renameBoard: (id: string, name: string) => void;
  deleteBoard: (id: string) => void;
  duplicateBoard: (id: string) => string;
  switchBoard: (id: string) => void;
  moveBoardToWorkspace: (boardId: string, workspaceId?: string) => void;

  // Theme Changer
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDarkMode: boolean;

  // Active Board Data
  boardTitle: string;
  setBoardTitle: (title: string) => void;
  elements: CanvasElement[];
  connections: ConnectionWire[];
  selectedElementIds: string[];
  selectedConnectionId: string | null;
  activeTool: ToolMode;
  viewport: Viewport;
  gridMode: GridMode;
  snapToGrid: boolean;
  isPresentationMode: boolean;
  connectingDraft: ConnectingDraft | null;

  // Smart Snapping Guides
  activeSnapGuides: SnapGuide[];
  setActiveSnapGuides: (guides: SnapGuide[]) => void;

  // Smart Frame Presentations
  frameSlides: CanvasElement[];
  currentSlideIndex: number;
  goToSlide: (index: number) => void;
  nextSlide: () => void;
  prevSlide: () => void;
  focusOnFrame: (frameId: string) => void;

  // Smart Grid / Table Organizing
  organizeSelectionIntoKanban: () => void;
  organizeSelectionIntoTable: () => void;

  // Drag-and-drop external files / images
  handleDroppedFiles: (files: FileList | File[], worldPoint: Point) => Promise<void>;

  // History
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  // Setters
  setActiveTool: (tool: ToolMode) => void;
  setGridMode: (mode: GridMode) => void;
  setSnapToGrid: (snap: boolean) => void;
  setIsPresentationMode: (val: boolean) => void;
  setSelectedConnectionId: (id: string | null) => void;

  // Viewport navigation
  setViewport: React.Dispatch<React.SetStateAction<Viewport>>;
  panBy: (dx: number, dy: number) => void;
  zoomAtPoint: (delta: number, clientX: number, clientY: number, containerRect: DOMRect) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToView: () => void;

  // Element actions
  addElement: (el: Partial<CanvasElement>) => string;
  updateElement: (id: string, updates: Partial<CanvasElement>, recordHistory?: boolean) => void;
  updateMultipleElements: (updates: Array<{ id: string; updates: Partial<CanvasElement> }>) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  bringToFront: () => void;
  sendToBack: () => void;

  // Selection
  selectElement: (id: string, multiSelect?: boolean) => void;
  selectMultipleElements: (ids: string[]) => void;
  clearSelection: () => void;
  selectAll: () => void;

  // Connectors & Mind Map
  startConnecting: (fromNodeId: string, fromAnchor: AnchorPosition, worldPoint: Point) => void;
  updateConnecting: (worldPoint: Point, targetNodeId?: string, targetAnchor?: AnchorPosition) => void;
  finishConnecting: (toNodeId: string, toAnchor: AnchorPosition) => void;
  cancelConnecting: () => void;
  updateConnection: (id: string, updates: Partial<ConnectionWire>) => void;
  deleteConnection: (id: string) => void;
  autoBranchMindMap: (parentId: string, direction?: 'right' | 'bottom') => void;

  // Templates & Reset
  loadTemplate: (templateId: string) => void;
  clearBoard: () => void;
  importBoard: (elements: CanvasElement[], connections: ConnectionWire[], title?: string) => void;
}

const STORAGE_WORKSPACES_KEY = 'canvasflow_workspaces_v2';
const STORAGE_BOARDS_MANIFEST_KEY = 'canvasflow_boards_manifest_v2';
const STORAGE_ACTIVE_BOARD_KEY = 'canvasflow_active_board_id_v2';
const CANVAS_SNAP_SIZE = 20;

const DEFAULT_WORKSPACES: WorkspaceFolder[] = [
  { id: 'ws-design', name: 'Product Design & Strategy', color: '#3B82F6', createdAt: Date.now() - 3600000 * 24 },
  { id: 'ws-research', name: 'Research & Discovery', color: '#10B981', createdAt: Date.now() - 3600000 * 12 },
  { id: 'ws-ops', name: 'Team Sprints & Ops', color: '#8B5CF6', createdAt: Date.now() - 3600000 * 6 },
];

const DEFAULT_BOARDS: BoardMetadata[] = [
  {
    id: 'board-mindmap',
    workspaceId: 'ws-design',
    name: 'Mind Map Brainstorming Hub',
    updatedAt: Date.now(),
    elementCount: TEMPLATES[0].elements.length,
    previewColor: '#3B82F6',
  },
  {
    id: 'board-kanban',
    workspaceId: 'ws-ops',
    name: 'Agile Kanban Workflow',
    updatedAt: Date.now() - 3600000 * 2,
    elementCount: TEMPLATES[1].elements.length,
    previewColor: '#10B981',
  },
  {
    id: 'board-swot',
    workspaceId: 'ws-research',
    name: 'SWOT Strategy Matrix',
    updatedAt: Date.now() - 3600000 * 5,
    elementCount: TEMPLATES[2].elements.length,
    previewColor: '#F59E0B',
  },
  {
    id: 'board-journey',
    workspaceId: 'ws-design',
    name: 'Customer Experience Journey',
    updatedAt: Date.now() - 3600000 * 8,
    elementCount: TEMPLATES[3].elements.length,
    previewColor: '#EC4899',
  },
];

const CanvasContext = createContext<CanvasContextType | null>(null);

export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Workspaces state
  const [workspaces, setWorkspaces] = useState<WorkspaceFolder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_WORKSPACES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_WORKSPACES;
  });

  // Boards manifest
  const [boards, setBoards] = useState<BoardMetadata[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_BOARDS_MANIFEST_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_BOARDS;
  });

  // Active Board ID
  const [activeBoardId, setActiveBoardId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACTIVE_BOARD_KEY);
      if (saved) return saved;
    } catch {
      // fallback
    }
    return DEFAULT_BOARDS[0].id;
  });

  // Active board data
  const [boardTitle, setBoardTitle] = useState<string>('Mind Map Brainstorming Hub');
  const [elements, setElements] = useState<CanvasElement[]>(() => {
    try {
      const saved = localStorage.getItem(`canvasflow_board_${DEFAULT_BOARDS[0].id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.elements) return parsed.elements;
      }
    } catch {
      // fallback
    }
    return TEMPLATES[0].elements;
  });

  const [connections, setConnections] = useState<ConnectionWire[]>(() => {
    try {
      const saved = localStorage.getItem(`canvasflow_board_${DEFAULT_BOARDS[0].id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.connections) return parsed.connections;
      }
    } catch {
      // fallback
    }
    return TEMPLATES[0].connections;
  });

  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolMode>('select');
  const [viewport, setViewport] = useState<Viewport>({ x: 120, y: 80, zoom: 0.85 });
  const [gridMode, setGridMode] = useState<GridMode>('dots');
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [connectingDraft, setConnectingDraft] = useState<ConnectingDraft | null>(null);

  // Theme state & dark mode detection
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('canvasflow_theme') as ThemeMode;
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    } catch {}
    return 'light';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('canvasflow_theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('canvasflow_theme', newTheme);
    } catch {}
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateDarkClass = () => {
      const dark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      setIsDarkMode(dark);
      if (dark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    updateDarkClass();

    const listener = () => {
      if (theme === 'system') updateDarkClass();
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  // Snapping Guides
  const [activeSnapGuides, setActiveSnapGuides] = useState<SnapGuide[]>([]);

  // Presentation Slide Navigation
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  // Undo / Redo history
  const [historyPast, setHistoryPast] = useState<HistorySnapshot[]>([]);
  const [historyFuture, setHistoryFuture] = useState<HistorySnapshot[]>([]);

  // Ref tracking current board state
  const stateRef = useRef({ elements, connections, boardTitle, viewport, activeBoardId });
  stateRef.current = { elements, connections, boardTitle, viewport, activeBoardId };

  // Sync workspaces & manifest to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_WORKSPACES_KEY, JSON.stringify(workspaces));
    } catch {}
  }, [workspaces]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BOARDS_MANIFEST_KEY, JSON.stringify(boards));
    } catch {}
  }, [boards]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVE_BOARD_KEY, activeBoardId);
    } catch {}
  }, [activeBoardId]);

  // Save current active board content to storage with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const boardData: BoardData = {
          id: activeBoardId,
          name: boardTitle,
          updatedAt: Date.now(),
          elements,
          connections,
          viewport,
        };
        localStorage.setItem(`canvasflow_board_${activeBoardId}`, JSON.stringify(boardData));

        // Update manifest elementCount and updatedAt
        setBoards((prev) =>
          prev.map((b) =>
            b.id === activeBoardId
              ? { ...b, name: boardTitle, elementCount: elements.length, updatedAt: Date.now() }
              : b
          )
        );
      } catch {}
    }, 500);

    return () => clearTimeout(timer);
  }, [elements, connections, boardTitle, viewport, activeBoardId]);

  // Frames detection for slide presentations
  const frameSlides = elements
    .filter((e) => e.type === 'frame')
    .sort((a, b) => a.x - b.x);

  const pushHistory = useCallback(() => {
    setHistoryPast((past) => [
      ...past.slice(-25),
      { elements: stateRef.current.elements, connections: stateRef.current.connections },
    ]);
    setHistoryFuture([]);
  }, []);

  const undo = useCallback(() => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast((past) => past.slice(0, past.length - 1));
    setHistoryFuture((future) => [
      { elements: stateRef.current.elements, connections: stateRef.current.connections },
      ...future,
    ]);
    setElements(previous.elements);
    setConnections(previous.connections);
    setSelectedElementIds([]);
  }, [historyPast]);

  const redo = useCallback(() => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryFuture((future) => future.slice(1));
    setHistoryPast((past) => [
      ...past,
      { elements: stateRef.current.elements, connections: stateRef.current.connections },
    ]);
    setElements(next.elements);
    setConnections(next.connections);
    setSelectedElementIds([]);
  }, [historyFuture]);

  // Board management
  const saveCurrentBoardState = useCallback(() => {
    const { elements: curElements, connections: curConnections, boardTitle: curTitle, viewport: curViewport, activeBoardId: curId } = stateRef.current;
    try {
      const boardData: BoardData = {
        id: curId,
        name: curTitle,
        updatedAt: Date.now(),
        elements: curElements,
        connections: curConnections,
        viewport: curViewport,
      };
      localStorage.setItem(`canvasflow_board_${curId}`, JSON.stringify(boardData));
    } catch {}
  }, []);

  const switchBoard = useCallback(
    (targetBoardId: string) => {
      if (targetBoardId === activeBoardId) return;

      // 1. Save current board
      saveCurrentBoardState();

      // 2. Load target board
      let targetData: BoardData | null = null;
      try {
        const saved = localStorage.getItem(`canvasflow_board_${targetBoardId}`);
        if (saved) {
          targetData = JSON.parse(saved);
        }
      } catch {}

      // Fallback template mapping if board is one of defaults
      if (!targetData) {
        if (targetBoardId === 'board-kanban') {
          targetData = {
            id: 'board-kanban',
            name: 'Agile Kanban Workflow',
            updatedAt: Date.now(),
            elements: TEMPLATES[1].elements,
            connections: TEMPLATES[1].connections,
            viewport: { x: 100, y: 80, zoom: 0.8 },
          };
        } else if (targetBoardId === 'board-swot') {
          targetData = {
            id: 'board-swot',
            name: 'SWOT Strategy Matrix',
            updatedAt: Date.now(),
            elements: TEMPLATES[2].elements,
            connections: TEMPLATES[2].connections,
            viewport: { x: 100, y: 80, zoom: 0.8 },
          };
        } else if (targetBoardId === 'board-journey') {
          targetData = {
            id: 'board-journey',
            name: 'Customer Experience Journey',
            updatedAt: Date.now(),
            elements: TEMPLATES[3].elements,
            connections: TEMPLATES[3].connections,
            viewport: { x: 100, y: 80, zoom: 0.8 },
          };
        } else {
          targetData = {
            id: targetBoardId,
            name: 'Untitled Board',
            updatedAt: Date.now(),
            elements: [],
            connections: [],
            viewport: { x: 200, y: 150, zoom: 1.0 },
          };
        }
      }

      setActiveBoardId(targetBoardId);
      setBoardTitle(targetData.name);
      setElements(targetData.elements || []);
      setConnections(targetData.connections || []);
      setViewport(targetData.viewport || { x: 100, y: 100, zoom: 1.0 });
      setSelectedElementIds([]);
      setSelectedConnectionId(null);
      setHistoryPast([]);
      setHistoryFuture([]);
      setCurrentSlideIndex(0);
    },
    [activeBoardId, saveCurrentBoardState]
  );

  const createBoard = useCallback(
    (workspaceId?: string, name?: string): string => {
      saveCurrentBoardState();
      const newId = `board-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const boardName = name || 'New Idea Board';

      const newMeta: BoardMetadata = {
        id: newId,
        workspaceId,
        name: boardName,
        updatedAt: Date.now(),
        elementCount: 0,
        previewColor: '#3B82F6',
      };

      setBoards((prev) => [newMeta, ...prev]);

      // Switch to new board
      setActiveBoardId(newId);
      setBoardTitle(boardName);
      setElements([]);
      setConnections([]);
      setViewport({ x: 200, y: 150, zoom: 1.0 });
      setSelectedElementIds([]);
      setSelectedConnectionId(null);
      setHistoryPast([]);
      setHistoryFuture([]);

      return newId;
    },
    [saveCurrentBoardState]
  );

  const renameBoard = useCallback((id: string, name: string) => {
    setBoards((prev) =>
      prev.map((b) => (b.id === id ? { ...b, name, updatedAt: Date.now() } : b))
    );
    if (stateRef.current.activeBoardId === id) {
      setBoardTitle(name);
    }
  }, []);

  const deleteBoard = useCallback(
    (id: string) => {
      if (boards.length <= 1) {
        alert('You must keep at least one whiteboard in your workspace.');
        return;
      }
      try {
        localStorage.removeItem(`canvasflow_board_${id}`);
      } catch {}

      const remaining = boards.filter((b) => b.id !== id);
      setBoards(remaining);

      if (activeBoardId === id) {
        switchBoard(remaining[0].id);
      }
    },
    [boards, activeBoardId, switchBoard]
  );

  const duplicateBoard = useCallback(
    (sourceId: string): string => {
      saveCurrentBoardState();
      const sourceMeta = boards.find((b) => b.id === sourceId);
      let sourceElements = elements;
      let sourceConnections = connections;
      let sourceViewport = viewport;

      if (sourceId !== activeBoardId) {
        try {
          const saved = localStorage.getItem(`canvasflow_board_${sourceId}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            sourceElements = parsed.elements || [];
            sourceConnections = parsed.connections || [];
            sourceViewport = parsed.viewport || { x: 100, y: 100, zoom: 1.0 };
          }
        } catch {}
      }

      const newId = `board-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newName = `${sourceMeta?.name || 'Board'} (Copy)`;

      const newMeta: BoardMetadata = {
        id: newId,
        workspaceId: sourceMeta?.workspaceId,
        name: newName,
        updatedAt: Date.now(),
        elementCount: sourceElements.length,
        previewColor: sourceMeta?.previewColor || '#3B82F6',
      };

      setBoards((prev) => [newMeta, ...prev]);

      try {
        const boardData: BoardData = {
          id: newId,
          workspaceId: sourceMeta?.workspaceId,
          name: newName,
          updatedAt: Date.now(),
          elements: sourceElements,
          connections: sourceConnections,
          viewport: sourceViewport,
        };
        localStorage.setItem(`canvasflow_board_${newId}`, JSON.stringify(boardData));
      } catch {}

      switchBoard(newId);
      return newId;
    },
    [activeBoardId, boards, connections, elements, saveCurrentBoardState, switchBoard, viewport]
  );

  const moveBoardToWorkspace = useCallback((boardId: string, workspaceId?: string) => {
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, workspaceId, updatedAt: Date.now() } : b))
    );
  }, []);

  // Workspaces CRUD
  const createWorkspace = useCallback((name: string, color?: string): string => {
    const newWs: WorkspaceFolder = {
      id: `ws-${Date.now()}`,
      name: name.trim() || 'New Folder',
      color: color || '#3B82F6',
      createdAt: Date.now(),
    };
    setWorkspaces((prev) => [...prev, newWs]);
    return newWs.id;
  }, []);

  const renameWorkspace = useCallback((id: string, name: string) => {
    setWorkspaces((prev) =>
      prev.map((ws) => (ws.id === id ? { ...ws, name: name.trim() } : ws))
    );
  }, []);

  const deleteWorkspace = useCallback((id: string) => {
    // Unassign boards inside this workspace to root
    setBoards((prev) =>
      prev.map((b) => (b.workspaceId === id ? { ...b, workspaceId: undefined } : b))
    );
    setWorkspaces((prev) => prev.filter((ws) => ws.id !== id));
  }, []);

  // Viewport navigation
  const panBy = useCallback((dx: number, dy: number) => {
    setViewport((prev) => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  }, []);

  const zoomAtPoint = useCallback(
    (delta: number, clientX: number, clientY: number, containerRect: DOMRect) => {
      setViewport((prev) => {
        const mouseX = clientX - containerRect.left;
        const mouseY = clientY - containerRect.top;

        // Smooth zoom step
        const zoomFactor = delta < 0 ? 1.12 : 0.88;
        const newZoom = Math.min(Math.max(prev.zoom * zoomFactor, 0.1), 5.0);

        // Zoom centered around exact cursor point
        const worldX = (mouseX - prev.x) / prev.zoom;
        const worldY = (mouseY - prev.y) / prev.zoom;

        const newX = mouseX - worldX * newZoom;
        const newY = mouseY - worldY * newZoom;

        return {
          x: Math.round(newX),
          y: Math.round(newY),
          zoom: parseFloat(newZoom.toFixed(3)),
        };
      });
    },
    []
  );

  const zoomIn = useCallback(() => {
    setViewport((prev) => {
      const newZoom = Math.min(prev.zoom * 1.25, 5.0);
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const worldX = (cx - prev.x) / prev.zoom;
      const worldY = (cy - prev.y) / prev.zoom;
      return {
        x: Math.round(cx - worldX * newZoom),
        y: Math.round(cy - worldY * newZoom),
        zoom: parseFloat(newZoom.toFixed(2)),
      };
    });
  }, []);

  const zoomOut = useCallback(() => {
    setViewport((prev) => {
      const newZoom = Math.max(prev.zoom * 0.8, 0.1);
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const worldX = (cx - prev.x) / prev.zoom;
      const worldY = (cy - prev.y) / prev.zoom;
      return {
        x: Math.round(cx - worldX * newZoom),
        y: Math.round(cy - worldY * newZoom),
        zoom: parseFloat(newZoom.toFixed(2)),
      };
    });
  }, []);

  const resetZoom = useCallback(() => {
    setViewport((prev) => ({ ...prev, zoom: 1.0 }));
  }, []);

  const fitToView = useCallback(() => {
    if (elements.length === 0) {
      setViewport({ x: 100, y: 100, zoom: 1.0 });
      return;
    }
    const bbox = getElementsBoundingBox(elements);
    if (!bbox) return;

    const padding = 120;
    const viewWidth = window.innerWidth;
    const viewHeight = window.innerHeight;

    const scaleX = (viewWidth - padding * 2) / bbox.width;
    const scaleY = (viewHeight - padding * 2) / bbox.height;
    const targetZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.2), 1.2);

    const targetX = (viewWidth - bbox.width * targetZoom) / 2 - bbox.x * targetZoom;
    const targetY = (viewHeight - bbox.height * targetZoom) / 2 - bbox.y * targetZoom;

    setViewport({
      x: Math.round(targetX),
      y: Math.round(targetY),
      zoom: parseFloat(targetZoom.toFixed(2)),
    });
  }, [elements]);

  // Frame Slide Presentation
  const focusOnFrame = useCallback(
    (frameId: string) => {
      const frame = elements.find((e) => e.id === frameId && e.type === 'frame');
      if (!frame) return;

      const padding = 80;
      const viewWidth = window.innerWidth;
      const viewHeight = window.innerHeight;

      const scaleX = (viewWidth - padding * 2) / frame.width;
      const scaleY = (viewHeight - padding * 2) / frame.height;
      const targetZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.3), 1.6);

      const targetX = (viewWidth - frame.width * targetZoom) / 2 - frame.x * targetZoom;
      const targetY = (viewHeight - frame.height * targetZoom) / 2 - frame.y * targetZoom;

      setViewport({
        x: Math.round(targetX),
        y: Math.round(targetY),
        zoom: parseFloat(targetZoom.toFixed(2)),
      });
    },
    [elements]
  );

  const goToSlide = useCallback(
    (index: number) => {
      if (frameSlides.length === 0) return;
      const safeIndex = Math.max(0, Math.min(index, frameSlides.length - 1));
      setCurrentSlideIndex(safeIndex);
      focusOnFrame(frameSlides[safeIndex].id);
    },
    [frameSlides, focusOnFrame]
  );

  const nextSlide = useCallback(() => {
    if (frameSlides.length === 0) return;
    const nextIdx = (currentSlideIndex + 1) % frameSlides.length;
    goToSlide(nextIdx);
  }, [currentSlideIndex, frameSlides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    if (frameSlides.length === 0) return;
    const prevIdx = (currentSlideIndex - 1 + frameSlides.length) % frameSlides.length;
    goToSlide(prevIdx);
  }, [currentSlideIndex, frameSlides.length, goToSlide]);

  // Smart Grid / Table Organizing
  const organizeSelectionIntoKanban = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    pushHistory();
    const selected = elements.filter((e) => selectedElementIds.includes(e.id));
    const otherElements = elements.filter((e) => !selectedElementIds.includes(e.id));

    const { arranged, frame } = organizeAsKanban(selected);
    setElements([...otherElements, frame, ...arranged]);
    setSelectedElementIds([frame.id]);
    setTimeout(() => fitToView(), 50);
  }, [elements, selectedElementIds, pushHistory, fitToView]);

  const organizeSelectionIntoTable = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    pushHistory();
    const selected = elements.filter((e) => selectedElementIds.includes(e.id));
    const otherElements = elements.filter((e) => !selectedElementIds.includes(e.id));

    const { arranged, frame } = organizeAsTable(selected);
    setElements([...otherElements, frame, ...arranged]);
    setSelectedElementIds([frame.id]);
    setTimeout(() => fitToView(), 50);
  }, [elements, selectedElementIds, pushHistory, fitToView]);

  // Drag-and-drop external file handler
  const handleDroppedFiles = useCallback(
    async (files: FileList | File[], worldPoint: Point) => {
      const fileList = Array.from(files);
      if (fileList.length === 0) return;
      pushHistory();

      let currentX = worldPoint.x;
      let currentY = worldPoint.y;

      for (const file of fileList) {
        if (file.type.startsWith('image/')) {
          // Process image
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            const img = new Image();
            img.onload = () => {
              const maxDim = 380;
              let w = img.width;
              let h = img.height;
              if (w > maxDim || h > maxDim) {
                if (w > h) {
                  h = Math.round((h * maxDim) / w);
                  w = maxDim;
                } else {
                  w = Math.round((w * maxDim) / h);
                  h = maxDim;
                }
              }

              const newId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
              const maxZ = elements.reduce((max, el) => Math.max(max, el.zIndex || 0), 1);

              const imageElement: CanvasElement = {
                id: newId,
                type: 'image',
                src: dataUrl,
                x: currentX,
                y: currentY,
                width: Math.max(w, 160),
                height: Math.max(h, 120),
                zIndex: maxZ + 1,
                label: file.name,
              };

              setElements((prev) => [...prev, imageElement]);
              setSelectedElementIds([newId]);
            };
            img.src = dataUrl;
          };
          reader.readAsDataURL(file);
          currentX += 30;
          currentY += 30;
        } else {
          // Process document / text file (.txt, .md, .csv, .json)
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = (e.target?.result as string) || '';
            const maxZ = elements.reduce((max, el) => Math.max(max, el.zIndex || 0), 1);
            const newId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

            const docElement: CanvasElement = {
              id: newId,
              type: 'sticky',
              color: 'sky',
              x: currentX,
              y: currentY,
              width: 280,
              height: 200,
              zIndex: maxZ + 1,
              text: `📄 ${file.name}\n\n${content.slice(0, 500)}${content.length > 500 ? '...' : ''}`,
              tags: ['Doc', file.name.split('.').pop() || 'file'],
            };

            setElements((prev) => [...prev, docElement]);
            setSelectedElementIds([newId]);
          };
          reader.readAsText(file);
          currentX += 40;
          currentY += 40;
        }
      }
    },
    [elements, pushHistory]
  );

  // Element CRUD
  const addElement = useCallback(
    (elData: Partial<CanvasElement>): string => {
      pushHistory();
      const id = `node-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const maxZ = elements.reduce((max, el) => Math.max(max, el.zIndex || 0), 1);

      let snapX = elData.x ?? 400;
      let snapY = elData.y ?? 300;
      if (snapToGrid) {
        snapX = Math.round(snapX / CANVAS_SNAP_SIZE) * CANVAS_SNAP_SIZE;
        snapY = Math.round(snapY / CANVAS_SNAP_SIZE) * CANVAS_SNAP_SIZE;
      }

      const newElement: CanvasElement = {
        id,
        type: elData.type || 'sticky',
        x: snapX,
        y: snapY,
        width: elData.width || (elData.type === 'shape' ? 180 : elData.type === 'frame' ? 360 : 220),
        height: elData.height || (elData.type === 'shape' ? 80 : elData.type === 'frame' ? 420 : 160),
        zIndex: maxZ + 1,
        rotation: 0,
        color: elData.color || 'yellow',
        text: elData.text ?? 'New Idea',
        tags: elData.tags || [],
        priority: elData.priority || 'none',
        shapeType: (elData.shapeType as ShapeType) || 'rounded-rectangle',
        fill: elData.fill || '#EFF6FF',
        stroke: elData.stroke || '#60A5FA',
        strokeWidth: elData.strokeWidth || 2,
        strokeStyle: elData.strokeStyle || 'solid',
        label: elData.label || 'Node Title',
        title: elData.title || (elData.type === 'frame' ? 'Section Frame' : undefined),
        ...elData,
      };

      setElements((prev) => [...prev, newElement]);
      setSelectedElementIds([id]);
      setSelectedConnectionId(null);
      return id;
    },
    [elements, pushHistory, snapToGrid]
  );

  const updateElement = useCallback(
    (id: string, updates: Partial<CanvasElement>, recordHistory = false) => {
      if (recordHistory) {
        pushHistory();
      }
      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== id) return el;
          return { ...el, ...updates };
        })
      );
    },
    [pushHistory]
  );

  const updateMultipleElements = useCallback(
    (updatesList: Array<{ id: string; updates: Partial<CanvasElement> }>) => {
      const updateMap = new Map(updatesList.map((u) => [u.id, u.updates]));
      setElements((prev) =>
        prev.map((el) => {
          const u = updateMap.get(el.id);
          return u ? { ...el, ...u } : el;
        })
      );
    },
    []
  );

  const deleteSelected = useCallback(() => {
    if (selectedElementIds.length === 0 && !selectedConnectionId) return;
    pushHistory();

    if (selectedConnectionId) {
      setConnections((prev) => prev.filter((c) => c.id !== selectedConnectionId));
      setSelectedConnectionId(null);
    }

    if (selectedElementIds.length > 0) {
      const idsSet = new Set(selectedElementIds);
      setElements((prev) => prev.filter((el) => !idsSet.has(el.id)));
      setConnections((prev) =>
        prev.filter((c) => !idsSet.has(c.fromId) && !idsSet.has(c.toId))
      );
      setSelectedElementIds([]);
    }
  }, [selectedElementIds, selectedConnectionId, pushHistory]);

  const duplicateSelected = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    pushHistory();

    const selected = elements.filter((el) => selectedElementIds.includes(el.id));
    const newSelectedIds: string[] = [];
    const idMapping = new Map<string, string>();

    const duplicates: CanvasElement[] = selected.map((el) => {
      const newId = `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      idMapping.set(el.id, newId);
      newSelectedIds.push(newId);
      return {
        ...el,
        id: newId,
        x: el.x + 40,
        y: el.y + 40,
        zIndex: el.zIndex + 1,
      };
    });

    const newWires: ConnectionWire[] = [];
    for (const wire of connections) {
      if (idMapping.has(wire.fromId) && idMapping.has(wire.toId)) {
        newWires.push({
          ...wire,
          id: `wire-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          fromId: idMapping.get(wire.fromId)!,
          toId: idMapping.get(wire.toId)!,
        });
      }
    }

    setElements((prev) => [...prev, ...duplicates]);
    setConnections((prev) => [...prev, ...newWires]);
    setSelectedElementIds(newSelectedIds);
  }, [elements, connections, selectedElementIds, pushHistory]);

  const bringToFront = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    pushHistory();
    const maxZ = elements.reduce((max, el) => Math.max(max, el.zIndex || 0), 1);
    setElements((prev) =>
      prev.map((el) =>
        selectedElementIds.includes(el.id) ? { ...el, zIndex: maxZ + 1 } : el
      )
    );
  }, [elements, selectedElementIds, pushHistory]);

  const sendToBack = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    pushHistory();
    const minZ = elements.reduce((min, el) => Math.min(min, el.zIndex || 1), 1);
    const newZ = Math.max(minZ - 1, 1);
    setElements((prev) =>
      prev.map((el) =>
        selectedElementIds.includes(el.id) ? { ...el, zIndex: newZ } : el
      )
    );
  }, [elements, selectedElementIds, pushHistory]);

  // Selection
  const selectElement = useCallback((id: string, multiSelect = false) => {
    setSelectedConnectionId(null);
    setSelectedElementIds((prev) => {
      if (multiSelect) {
        return prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      }
      return [id];
    });
  }, []);

  const selectMultipleElements = useCallback((ids: string[]) => {
    setSelectedElementIds(ids);
    setSelectedConnectionId(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedElementIds([]);
    setSelectedConnectionId(null);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedElementIds(elements.map((e) => e.id));
    setSelectedConnectionId(null);
  }, [elements]);

  // Wire Connection & Mind Map
  const startConnecting = useCallback(
    (fromNodeId: string, fromAnchor: AnchorPosition, worldPoint: Point) => {
      setConnectingDraft({
        fromNodeId,
        fromAnchor,
        currentWorldPoint: worldPoint,
      });
    },
    []
  );

  const updateConnecting = useCallback(
    (worldPoint: Point, targetNodeId?: string, targetAnchor?: AnchorPosition) => {
      setConnectingDraft((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentWorldPoint: worldPoint,
          targetNodeId,
          targetAnchor,
        };
      });
    },
    []
  );

  const finishConnecting = useCallback(
    (toNodeId: string, toAnchor: AnchorPosition) => {
      if (!connectingDraft || connectingDraft.fromNodeId === toNodeId) {
        setConnectingDraft(null);
        return;
      }

      pushHistory();
      const newWire: ConnectionWire = {
        id: `wire-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        fromId: connectingDraft.fromNodeId,
        fromAnchor: connectingDraft.fromAnchor,
        toId: toNodeId,
        toAnchor,
        style: 'curved',
        color: '#64748B',
        strokeWidth: 2,
        endArrow: true,
      };

      setConnections((prev) => [...prev, newWire]);
      setConnectingDraft(null);
      setActiveTool('select');
    },
    [connectingDraft, pushHistory]
  );

  const cancelConnecting = useCallback(() => {
    setConnectingDraft(null);
  }, []);

  const updateConnection = useCallback(
    (id: string, updates: Partial<ConnectionWire>) => {
      pushHistory();
      setConnections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    },
    [pushHistory]
  );

  const deleteConnection = useCallback(
    (id: string) => {
      pushHistory();
      setConnections((prev) => prev.filter((c) => c.id !== id));
      if (selectedConnectionId === id) setSelectedConnectionId(null);
    },
    [selectedConnectionId, pushHistory]
  );

  const autoBranchMindMap = useCallback(
    (parentId: string, direction: 'right' | 'bottom' = 'right') => {
      const parent = elements.find((e) => e.id === parentId);
      if (!parent) return;

      pushHistory();
      const newId = `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const childX = direction === 'right' ? parent.x + parent.width + 120 : parent.x;
      const childY =
        direction === 'bottom'
          ? parent.y + parent.height + 100
          : parent.y + (Math.random() * 80 - 40);

      const isParentSticky = parent.type === 'sticky';
      const childElement: CanvasElement = {
        id: newId,
        type: isParentSticky ? 'sticky' : 'shape',
        shapeType: 'rounded-rectangle',
        x: childX,
        y: childY,
        width: isParentSticky ? 200 : 160,
        height: isParentSticky ? 130 : 60,
        zIndex: parent.zIndex + 1,
        color: isParentSticky ? (parent.color === 'yellow' ? 'mint' : 'sky') : undefined,
        fill: '#EFF6FF',
        stroke: '#60A5FA',
        strokeWidth: 2,
        label: 'Sub-topic',
        text: 'New thought / Action',
        textColor: '#1E3A8A',
        fontSize: 14,
      };

      const newWire: ConnectionWire = {
        id: `wire-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        fromId: parentId,
        fromAnchor: direction === 'right' ? 'right' : 'bottom',
        toId: newId,
        toAnchor: direction === 'right' ? 'left' : 'top',
        style: 'curved',
        color: '#64748B',
        strokeWidth: 2,
        endArrow: true,
      };

      setElements((prev) => [...prev, childElement]);
      setConnections((prev) => [...prev, newWire]);
      setSelectedElementIds([newId]);
    },
    [elements, pushHistory]
  );

  const loadTemplate = useCallback(
    (templateId: string) => {
      const template = TEMPLATES.find((t) => t.id === templateId);
      if (!template) return;
      pushHistory();
      setElements(template.elements);
      setConnections(template.connections);
      setBoardTitle(template.name);
      setSelectedElementIds([]);
      setTimeout(() => fitToView(), 50);
    },
    [fitToView, pushHistory]
  );

  const clearBoard = useCallback(() => {
    pushHistory();
    setElements([]);
    setConnections([]);
    setSelectedElementIds([]);
    setSelectedConnectionId(null);
  }, [pushHistory]);

  const importBoard = useCallback(
    (newElements: CanvasElement[], newConnections: ConnectionWire[], title?: string) => {
      pushHistory();
      setElements(newElements);
      setConnections(newConnections);
      if (title) setBoardTitle(title);
      setSelectedElementIds([]);
      setTimeout(() => fitToView(), 50);
    },
    [fitToView, pushHistory]
  );

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      if (cmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      if (cmdOrCtrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelected();
        return;
      }

      if (cmdOrCtrl && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAll();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
        return;
      }

      if (e.key === 'Escape') {
        if (isPresentationMode) {
          setIsPresentationMode(false);
          return;
        }
        clearSelection();
        cancelConnecting();
        setActiveTool('select');
        return;
      }

      // Slide arrow navigation in Presentation Mode
      if (isPresentationMode) {
        if (e.key === 'ArrowRight' || e.key === 'Space') {
          e.preventDefault();
          nextSlide();
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          prevSlide();
          return;
        }
      }

      // Tool shortcuts
      if (!cmdOrCtrl && !e.altKey && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            setActiveTool('select');
            break;
          case 'h':
            setActiveTool('hand');
            break;
          case 's':
            setActiveTool('sticky');
            break;
          case 'r':
            setActiveTool('shape');
            break;
          case 'c':
            setActiveTool('connector');
            break;
          case 'p':
            setActiveTool('draw');
            break;
          case 't':
            setActiveTool('text');
            break;
          case 'f':
            if (selectedElementIds.length > 0 && elements.find(el => el.id === selectedElementIds[0])?.type === 'frame') {
              focusOnFrame(selectedElementIds[0]);
            } else {
              fitToView();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    undo,
    redo,
    duplicateSelected,
    selectAll,
    deleteSelected,
    clearSelection,
    cancelConnecting,
    fitToView,
    isPresentationMode,
    nextSlide,
    prevSlide,
    selectedElementIds,
    elements,
    focusOnFrame,
  ]);

  return (
    <CanvasContext.Provider
      value={{
        workspaces,
        boards,
        activeBoardId,
        isSidebarOpen,
        setIsSidebarOpen,
        createWorkspace,
        renameWorkspace,
        deleteWorkspace,
        createBoard,
        renameBoard,
        deleteBoard,
        duplicateBoard,
        switchBoard,
        moveBoardToWorkspace,
        theme,
        setTheme,
        isDarkMode,
        boardTitle,
        setBoardTitle,
        elements,
        connections,
        selectedElementIds,
        selectedConnectionId,
        activeTool,
        viewport,
        gridMode,
        snapToGrid,
        isPresentationMode,
        connectingDraft,
        activeSnapGuides,
        setActiveSnapGuides,
        frameSlides,
        currentSlideIndex,
        goToSlide,
        nextSlide,
        prevSlide,
        focusOnFrame,
        organizeSelectionIntoKanban,
        organizeSelectionIntoTable,
        handleDroppedFiles,
        canUndo: historyPast.length > 0,
        canRedo: historyFuture.length > 0,
        undo,
        redo,
        setActiveTool,
        setGridMode,
        setSnapToGrid,
        setIsPresentationMode,
        setSelectedConnectionId,
        setViewport,
        panBy,
        zoomAtPoint,
        zoomIn,
        zoomOut,
        resetZoom,
        fitToView,
        addElement,
        updateElement,
        updateMultipleElements,
        deleteSelected,
        duplicateSelected,
        bringToFront,
        sendToBack,
        selectElement,
        selectMultipleElements,
        clearSelection,
        selectAll,
        startConnecting,
        updateConnecting,
        finishConnecting,
        cancelConnecting,
        updateConnection,
        deleteConnection,
        autoBranchMindMap,
        loadTemplate,
        clearBoard,
        importBoard,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within CanvasProvider');
  }
  return context;
};
