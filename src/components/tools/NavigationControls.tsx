import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2 } from 'lucide-react';
import { useCanvas } from '../../context/CanvasContext';
import { Minimap } from './Minimap';
import { Separator } from '../ui/separator';

export const NavigationControls: React.FC = () => {
  const {
    viewport,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToView,
    canUndo,
    canRedo,
    undo,
    redo,
    isPresentationMode,
  } = useCanvas();

  if (isPresentationMode) return null;

  const zoomPercent = Math.round(viewport.zoom * 100);

  return (
    <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-2.5 pointer-events-auto select-none">
      {/* Minimap preview */}
      <Minimap />

      {/* Floating Zoom & History Toolbar */}
      <div className="flex items-center gap-0.5 p-1 bg-card/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-xl border border-border shadow-xl text-foreground transition-colors">
        {/* Undo */}
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Undo (Cmd+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* Redo */}
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Redo (Cmd+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <Separator orientation="vertical" className="h-4 mx-0.5" />

        {/* Zoom Out */}
        <button
          type="button"
          onClick={zoomOut}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Zoom Percentage */}
        <button
          type="button"
          onClick={resetZoom}
          className="px-2 py-1 rounded-md text-xs font-mono font-medium tabular-nums hover:bg-muted text-foreground transition-colors cursor-pointer min-w-12 text-center"
          title="Click to reset zoom (100%)"
        >
          {zoomPercent}%
        </button>

        {/* Zoom In */}
        <button
          type="button"
          onClick={zoomIn}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <Separator orientation="vertical" className="h-4 mx-0.5" />

        {/* Fit to Content */}
        <button
          type="button"
          onClick={fitToView}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          title="Fit view to all elements (F)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
