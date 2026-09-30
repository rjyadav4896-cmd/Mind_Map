import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useCanvas } from '../../context/CanvasContext';
import { GridBackground } from './GridBackground';
import { SvgConnectorLayer } from './SvgConnectorLayer';
import { NodeRenderer } from './NodeRenderer';
import { SelectionBox } from './SelectionBox';
import { SnappingGuideLayer } from './SnappingGuideLayer';
import { PresentationControls } from './PresentationControls';
import { CanvasElement, Point, SelectionState, AnchorPosition } from '../../types/canvas';
import { doRectanglesIntersect } from '../../utils/geometry';
import { findSnappingGuides } from '../../utils/snapping';
import { UploadCloud } from 'lucide-react';

interface InfiniteCanvasProps {
  currentDrawingColor: string;
  currentDrawingWidth: number;
}

export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({
  currentDrawingColor,
  currentDrawingWidth,
}) => {
  const {
    elements,
    selectedElementIds,
    viewport,
    gridMode,
    activeTool,
    snapToGrid,
    panBy,
    zoomAtPoint,
    selectElement,
    selectMultipleElements,
    clearSelection,
    addElement,
    updateMultipleElements,
    updateElement,
    connectingDraft,
    updateConnecting,
    finishConnecting,
    cancelConnecting,
    setActiveTool,
    activeSnapGuides,
    setActiveSnapGuides,
    handleDroppedFiles,
    isPresentationMode,
  } = useCanvas();

  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction State
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node Dragging State
  const [draggingNodes, setDraggingNodes] = useState<{
    initialElements: Array<{ id: string; x: number; y: number; width: number; height: number }>;
    startWorldPoint: Point;
  } | null>(null);

  // Node Resizing State
  const [resizingNode, setResizingNode] = useState<{
    elementId: string;
    initialWidth: number;
    initialHeight: number;
    startWorldPoint: Point;
    direction: string;
  } | null>(null);

  // Frame creation drag tool
  const [drawingFrame, setDrawingFrame] = useState<{
    startWorldPoint: Point;
    currentWorldPoint: Point;
  } | null>(null);

  // Marquee Selection State
  const [selectionBox, setSelectionBox] = useState<SelectionState>({
    isSelecting: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  // Freehand Drawing State
  const [drawingPoints, setDrawingPoints] = useState<Point[] | null>(null);

  // External Drag & Drop visual feedback
  const [isDragOver, setIsDragOver] = useState(false);

  // Mobile / Tablet Multi-touch Gesture tracking
  const touchStateRef = useRef<{
    initialDistance: number;
    initialMidpoint: Point;
    lastMidpoint: Point;
  } | null>(null);

  // Keyboard spacebar detection for pan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Screen to World Coordinates converter
  const screenToWorld = useCallback(
    (clientX: number, clientY: number): Point => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;
      return {
        x: (screenX - viewport.x) / viewport.zoom,
        y: (screenY - viewport.y) / viewport.zoom,
      };
    },
    [viewport]
  );

  // Wheel handling: desktop zoom relative to cursor position or trackpad pan
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // If Ctrl/Meta is pressed or if deltaMode indicates mouse wheel step, zoom around cursor!
    if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) > 50) {
      zoomAtPoint(e.deltaY, e.clientX, e.clientY, rect);
    } else {
      // Smooth 2-finger pan
      panBy(-e.deltaX, -e.deltaY);
    }
  };

  // Touch handlers for mobile & tablet (Pinch to zoom + 2-finger drag to pan)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midpoint = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
      touchStateRef.current = {
        initialDistance: distance,
        initialMidpoint: midpoint,
        lastMidpoint: midpoint,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStateRef.current && containerRef.current) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const currentMidpoint = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };

      const rect = containerRef.current.getBoundingClientRect();

      // Pan movement from midpoint shift
      const dx = currentMidpoint.x - touchStateRef.current.lastMidpoint.x;
      const dy = currentMidpoint.y - touchStateRef.current.lastMidpoint.y;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        panBy(dx, dy);
      }

      // Pinch zoom factor
      const distDelta = currentDistance - touchStateRef.current.initialDistance;
      if (Math.abs(distDelta) > 4) {
        const zoomDelta = distDelta > 0 ? -15 : 15;
        zoomAtPoint(zoomDelta, currentMidpoint.x, currentMidpoint.y, rect);
        touchStateRef.current.initialDistance = currentDistance;
      }

      touchStateRef.current.lastMidpoint = currentMidpoint;
    }
  };

  const handleTouchEnd = () => {
    touchStateRef.current = null;
  };

  // Start dragging a node
  const handleStartNodeDrag = (e: React.PointerEvent, element: CanvasElement) => {
    if (element.locked) return;

    let targetIds = selectedElementIds;
    if (!selectedElementIds.includes(element.id)) {
      if (e.shiftKey) {
        targetIds = [...selectedElementIds, element.id];
      } else {
        targetIds = [element.id];
      }
      selectElement(element.id, e.shiftKey);
    }

    const worldP = screenToWorld(e.clientX, e.clientY);
    const initialElements = elements
      .filter((el) => targetIds.includes(el.id))
      .map((el) => ({ id: el.id, x: el.x, y: el.y, width: el.width, height: el.height }));

    setDraggingNodes({
      initialElements,
      startWorldPoint: worldP,
    });
  };

  // Start resizing a node
  const handleStartNodeResize = (
    e: React.PointerEvent,
    element: CanvasElement,
    direction: string
  ) => {
    e.stopPropagation();
    const worldP = screenToWorld(e.clientX, e.clientY);
    setResizingNode({
      elementId: element.id,
      initialWidth: element.width,
      initialHeight: element.height,
      startWorldPoint: worldP,
      direction,
    });
  };

  // Canvas pointer down
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPoint = screenToWorld(e.clientX, e.clientY);

    // 1. Pan handling (Middle mouse button || Spacebar || Hand tool)
    if (e.button === 1 || isSpacePressed || activeTool === 'hand') {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (e.button !== 0) return; // Only primary button for drawing / selecting

    // 2. Freehand Drawing tool
    if (activeTool === 'draw') {
      setDrawingPoints([worldPoint]);
      return;
    }

    // 3. Draw Frame Tool
    if (activeTool === 'frame') {
      setDrawingFrame({
        startWorldPoint: worldPoint,
        currentWorldPoint: worldPoint,
      });
      return;
    }

    // 4. Click-to-place tools (Sticky, Shape, Text)
    if (activeTool === 'sticky') {
      addElement({
        type: 'sticky',
        x: worldPoint.x - 110,
        y: worldPoint.y - 80,
        text: '',
        color: 'yellow',
      });
      setActiveTool('select');
      return;
    }

    if (activeTool === 'shape') {
      addElement({
        type: 'shape',
        shapeType: 'rounded-rectangle',
        x: worldPoint.x - 90,
        y: worldPoint.y - 40,
        label: 'Process Node',
      });
      setActiveTool('select');
      return;
    }

    if (activeTool === 'text') {
      addElement({
        type: 'text',
        x: worldPoint.x - 60,
        y: worldPoint.y - 20,
        text: 'Heading or idea...',
      });
      setActiveTool('select');
      return;
    }

    // 5. Marquee selection on background
    const clickedElement = (e.target as HTMLElement).closest('[data-element-id]');
    if (!clickedElement) {
      clearSelection();
      setSelectionBox({
        isSelecting: true,
        startX: screenX,
        startY: screenY,
        currentX: screenX,
        currentY: screenY,
      });
    }
  };

  // Canvas pointer move
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPoint = screenToWorld(e.clientX, e.clientY);

    // 1. Panning
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPanStart({ x: e.clientX, y: e.clientY });
      panBy(dx, dy);
      return;
    }

    // 2. Wire connecting draft
    if (connectingDraft) {
      const targetAnchorEl = (e.target as HTMLElement).closest('[data-anchor]');
      if (targetAnchorEl) {
        const nodeId = targetAnchorEl.getAttribute('data-node-id');
        const anchor = targetAnchorEl.getAttribute('data-anchor') as AnchorPosition;
        if (nodeId && nodeId !== connectingDraft.fromNodeId) {
          updateConnecting(worldPoint, nodeId, anchor);
          return;
        }
      }
      updateConnecting(worldPoint);
      return;
    }

    // 3. Freehand drawing
    if (drawingPoints && activeTool === 'draw') {
      setDrawingPoints((prev) => (prev ? [...prev, worldPoint] : [worldPoint]));
      return;
    }

    // 4. Drawing Frame Box
    if (drawingFrame && activeTool === 'frame') {
      setDrawingFrame((prev) => (prev ? { ...prev, currentWorldPoint: worldPoint } : null));
      return;
    }

    // 5. Dragging elements with smart snapping guides
    if (draggingNodes) {
      const deltaX = worldPoint.x - draggingNodes.startWorldPoint.x;
      const deltaY = worldPoint.y - draggingNodes.startWorldPoint.y;

      // Smart Snapping when dragging a single node
      let snapOffsetX = 0;
      let snapOffsetY = 0;

      if (draggingNodes.initialElements.length === 1) {
        const targetInit = draggingNodes.initialElements[0];
        const rawTargetX = targetInit.x + deltaX;
        const rawTargetY = targetInit.y + deltaY;

        const snapResult = findSnappingGuides(
          {
            id: targetInit.id,
            x: rawTargetX,
            y: rawTargetY,
            width: targetInit.width,
            height: targetInit.height,
          },
          elements,
          8
        );

        snapOffsetX = snapResult.snappedX - rawTargetX;
        snapOffsetY = snapResult.snappedY - rawTargetY;
        setActiveSnapGuides(snapResult.guides);
      } else {
        setActiveSnapGuides([]);
      }

      const updates = draggingNodes.initialElements.map((init) => {
        let newX = init.x + deltaX + snapOffsetX;
        let newY = init.y + deltaY + snapOffsetY;
        if (snapToGrid && activeSnapGuides.length === 0) {
          newX = Math.round(newX / 20) * 20;
          newY = Math.round(newY / 20) * 20;
        }
        return {
          id: init.id,
          updates: { x: newX, y: newY },
        };
      });

      updateMultipleElements(updates);
      return;
    }

    // 6. Resizing element
    if (resizingNode) {
      const deltaX = worldPoint.x - resizingNode.startWorldPoint.x;
      const deltaY = worldPoint.y - resizingNode.startWorldPoint.y;

      let newWidth = Math.max(resizingNode.initialWidth + deltaX, 80);
      let newHeight = Math.max(resizingNode.initialHeight + deltaY, 50);

      if (snapToGrid) {
        newWidth = Math.round(newWidth / 20) * 20;
        newHeight = Math.round(newHeight / 20) * 20;
      }

      updateElement(resizingNode.elementId, { width: newWidth, height: newHeight });
      return;
    }

    // 7. Marquee selection
    if (selectionBox.isSelecting) {
      setSelectionBox((prev) => ({
        ...prev,
        currentX: screenX,
        currentY: screenY,
      }));

      const minScreenX = Math.min(selectionBox.startX, screenX);
      const minScreenY = Math.min(selectionBox.startY, screenY);
      const maxScreenX = Math.max(selectionBox.startX, screenX);
      const maxScreenY = Math.max(selectionBox.startY, screenY);

      const worldSelectionRect = {
        x: (minScreenX - viewport.x) / viewport.zoom,
        y: (minScreenY - viewport.y) / viewport.zoom,
        width: (maxScreenX - minScreenX) / viewport.zoom,
        height: (maxScreenY - minScreenY) / viewport.zoom,
      };

      const intersectingIds = elements
        .filter((el) =>
          doRectanglesIntersect(worldSelectionRect, {
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
          })
        )
        .map((el) => el.id);

      selectMultipleElements(intersectingIds);
    }
  };

  // Canvas pointer up
  const handlePointerUp = (e: React.PointerEvent) => {
    // 1. End Pan
    if (isPanning) {
      setIsPanning(false);
    }

    // 2. End Connecting wire
    if (connectingDraft) {
      if (connectingDraft.targetNodeId && connectingDraft.targetAnchor) {
        finishConnecting(connectingDraft.targetNodeId, connectingDraft.targetAnchor);
      } else {
        const targetElement = (e.target as HTMLElement).closest('[data-element-id]');
        const targetId = targetElement?.getAttribute('data-element-id');
        if (targetId && targetId !== connectingDraft.fromNodeId) {
          finishConnecting(targetId, 'left');
        } else {
          cancelConnecting();
        }
      }
    }

    // 3. End Drawing
    if (drawingPoints && drawingPoints.length > 1) {
      addElement({
        type: 'drawing',
        points: drawingPoints,
        stroke: currentDrawingColor,
        strokeWidth: currentDrawingWidth,
      });
      setDrawingPoints(null);
    } else {
      setDrawingPoints(null);
    }

    // 4. End Drawing Frame Box
    if (drawingFrame && activeTool === 'frame') {
      const x = Math.min(drawingFrame.startWorldPoint.x, drawingFrame.currentWorldPoint.x);
      const y = Math.min(drawingFrame.startWorldPoint.y, drawingFrame.currentWorldPoint.y);
      const width = Math.max(Math.abs(drawingFrame.currentWorldPoint.x - drawingFrame.startWorldPoint.x), 240);
      const height = Math.max(Math.abs(drawingFrame.currentWorldPoint.y - drawingFrame.startWorldPoint.y), 180);

      addElement({
        type: 'frame',
        title: 'Section Presentation Frame',
        x,
        y,
        width,
        height,
      });
      setDrawingFrame(null);
      setActiveTool('select');
    }

    // 5. End Dragging Nodes & clear snap guides
    if (draggingNodes) {
      setDraggingNodes(null);
      setActiveSnapGuides([]);
    }

    // 6. End Resizing
    if (resizingNode) {
      setResizingNode(null);
    }

    // 7. End Marquee
    if (selectionBox.isSelecting) {
      setSelectionBox((prev) => ({ ...prev, isSelecting: false }));
    }
  };

  // Viewport Culling: calculate visible bounding box with generous padding buffer (maintains pure 60fps)
  const visibleElements = useMemo(() => {
    if (typeof window === 'undefined') return elements;
    const padding = 280 / viewport.zoom;
    const minX = -viewport.x / viewport.zoom - padding;
    const minY = -viewport.y / viewport.zoom - padding;
    const maxX = (window.innerWidth - viewport.x) / viewport.zoom + padding;
    const maxY = (window.innerHeight - viewport.y) / viewport.zoom + padding;

    return elements.filter((el) => {
      // Always render selected items
      if (selectedElementIds.includes(el.id)) return true;
      // Drawing stroke test
      if (el.type === 'drawing' && el.points && el.points.length > 0) {
        return el.points.some((p) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY);
      }
      // Bounding box overlap test
      return !(
        el.x + el.width < minX ||
        el.x > maxX ||
        el.y + el.height < minY ||
        el.y > maxY
      );
    });
  }, [elements, viewport, selectedElementIds]);

  const getCursorClass = () => {
    if (isPanning || isSpacePressed || activeTool === 'hand') return 'cursor-grab active:cursor-grabbing';
    if (activeTool === 'draw') return 'cursor-crosshair';
    if (activeTool === 'frame') return 'cursor-crosshair';
    if (activeTool === 'sticky' || activeTool === 'shape' || activeTool === 'text') return 'cursor-cell';
    if (connectingDraft) return 'cursor-crosshair';
    return 'cursor-default';
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none touch-none ${getCursorClass()}`}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const worldPoint = screenToWorld(e.clientX, e.clientY);
          handleDroppedFiles(e.dataTransfer.files, worldPoint);
        }
      }}
    >
      {/* Background Dots / Grid */}
      <GridBackground viewport={viewport} gridMode={gridMode} />

      {/* Infinite Scaled & Translated World Container */}
      <div
        className="absolute origin-top-left will-change-transform"
        style={{
          transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0px) scale(${viewport.zoom})`,
          width: '100%',
          height: '100%',
        }}
      >
        {/* SVG Connectors & Drawing Strokes Layer */}
        <SvgConnectorLayer
          currentDrawingPoints={drawingPoints}
          drawingColor={currentDrawingColor}
          drawingWidth={currentDrawingWidth}
        />

        {/* Smart Snapping Guides Layer */}
        <SnappingGuideLayer guides={activeSnapGuides} viewport={viewport} />

        {/* Visible Culled DOM Node Elements */}
        {visibleElements.map((element) => (
          <NodeRenderer
            key={element.id}
            element={element}
            isSelected={selectedElementIds.includes(element.id)}
            onStartDrag={handleStartNodeDrag}
            onStartResize={handleStartNodeResize}
          />
        ))}

        {/* Interactive Frame creation box draft */}
        {drawingFrame && activeTool === 'frame' && (() => {
          const fx = Math.min(drawingFrame.startWorldPoint.x, drawingFrame.currentWorldPoint.x);
          const fy = Math.min(drawingFrame.startWorldPoint.y, drawingFrame.currentWorldPoint.y);
          const fw = Math.abs(drawingFrame.currentWorldPoint.x - drawingFrame.startWorldPoint.x);
          const fh = Math.abs(drawingFrame.currentWorldPoint.y - drawingFrame.startWorldPoint.y);
          return (
            <div
              className="absolute border-2 border-dashed border-blue-500 bg-blue-500/10 rounded-xl pointer-events-none z-40 flex items-center justify-center text-blue-600 font-semibold text-xs"
              style={{
                left: `${fx}px`,
                top: `${fy}px`,
                width: `${fw}px`,
                height: `${fh}px`,
              }}
            >
              <span>Slide Presentation Frame</span>
            </div>
          );
        })()}
      </div>

      {/* Screen-Space Marquee Selection Box */}
      <SelectionBox selectionState={selectionBox} />

      {/* Visual File Dropzone Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-600/10 border-4 border-dashed border-blue-500 backdrop-blur-2xs flex flex-col items-center justify-center text-blue-700 pointer-events-none z-50 animate-in fade-in duration-100">
          <UploadCloud className="w-16 h-16 animate-bounce mb-3" />
          <h2 className="text-xl font-bold">Drop files to place on canvas</h2>
          <p className="text-xs text-blue-600/80 font-medium mt-1">
            Images (.png, .jpg, .svg) & Documents (.txt, .md, .csv)
          </p>
        </div>
      )}

      {/* Presentation Mode Slide Deck Floating Bar */}
      <PresentationControls />
    </div>
  );
};
