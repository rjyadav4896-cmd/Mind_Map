import React, { useState } from 'react';
import {
  Download,
  Play,
  Grid,
  Magnet,
  LayoutTemplate,
  RotateCcw,
  EyeOff,
  PanelLeft,
  Share2,
} from 'lucide-react';
import { useCanvas } from '../../context/CanvasContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ThemeToggle } from '../ui/theme-toggle';
import { Separator } from '../ui/separator';
import { cn } from '../../lib/utils';

interface TopNavbarProps {
  onOpenTemplates: () => void;
  onOpenExport: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onOpenTemplates,
  onOpenExport,
}) => {
  const {
    boardTitle,
    setBoardTitle,
    elements,
    gridMode,
    setGridMode,
    snapToGrid,
    setSnapToGrid,
    isPresentationMode,
    setIsPresentationMode,
    clearBoard,
    isSidebarOpen,
    setIsSidebarOpen,
    frameSlides,
  } = useCanvas();

  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // If in Presentation / Focus mode, show only a floating minimal escape button
  if (isPresentationMode) {
    return (
      <div className="fixed top-4 right-4 z-50 pointer-events-auto">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsPresentationMode(false)}
          className="shadow-xl bg-background/90 backdrop-blur-md border border-border text-foreground hover:bg-background"
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>Exit Presentation (Esc)</span>
        </Button>
      </div>
    );
  }

  const handleCycleGrid = () => {
    if (gridMode === 'dots') setGridMode('grid');
    else if (gridMode === 'grid') setGridMode('blank');
    else setGridMode('dots');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-card/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-border px-3 sm:px-5 flex items-center justify-between z-30 pointer-events-auto select-none transition-colors">
      {/* Zone 1: Sidebar Toggle, Brand & Board Title */}
      <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
        <Button
          variant={isSidebarOpen ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title="Toggle Workspaces & Boards Sidebar (Cmd+\)"
        >
          <PanelLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs tracking-tight shadow-xs">
            CF
          </div>
          <span className="hidden sm:inline font-bold text-sm tracking-tight text-foreground">
            CanvasFlow
          </span>
        </div>

        <Separator orientation="vertical" className="hidden sm:block h-4" />

        {/* Editable Board Title */}
        <div className="flex items-center gap-2 min-w-0">
          {isEditingTitle ? (
            <input
              autoFocus
              type="text"
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingTitle(false);
              }}
              className="text-xs sm:text-sm font-medium text-foreground border border-primary rounded-md px-2 py-0.5 focus:outline-none bg-background max-w-[140px] sm:max-w-[220px]"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="text-xs sm:text-sm font-semibold text-foreground/90 hover:text-foreground hover:bg-muted/70 rounded-md px-2 py-1 transition-colors cursor-pointer text-left truncate max-w-[130px] sm:max-w-[200px]"
              title="Click to rename board"
            >
              {boardTitle}
            </button>
          )}

          {/* Badges for items and slides */}
          <div className="hidden lg:flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className="text-[10px] font-mono font-normal text-muted-foreground">
              {elements.length} items
            </Badge>
            {frameSlides.length > 0 && (
              <Badge variant="success" className="text-[10px] font-medium">
                {frameSlides.length} slides
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Zone 2: Navigation & Canvas Preferences */}
      <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
        {/* Templates link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenTemplates}
          className="text-muted-foreground hover:text-foreground"
        >
          <LayoutTemplate className="w-3.5 h-3.5" />
          <span>Templates</span>
        </Button>

        {/* Grid Mode toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCycleGrid}
          className="text-muted-foreground hover:text-foreground capitalize"
          title="Toggle Canvas Grid (Dots / Squares / Blank)"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Grid: {gridMode}</span>
        </Button>

        {/* Snap to grid toggle */}
        <Button
          variant={snapToGrid ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={cn(
            'transition-colors',
            snapToGrid
              ? 'text-primary bg-primary/10 hover:bg-primary/20 font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
          title="Snap nodes to 20px grid"
        >
          <Magnet className="w-3.5 h-3.5" />
          <span>Snap: {snapToGrid ? 'On' : 'Off'}</span>
        </Button>

        {/* Reset / Clear */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (window.confirm('Clear all elements and wires on this canvas?')) {
              clearBoard();
            }
          }}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Clear entire canvas"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </Button>
      </nav>

      {/* Zone 3: Theme Changer, Present & Export */}
      <div className="flex items-center gap-2">
        {/* Theme Changer */}
        <ThemeToggle />

        {/* Presentation Mode */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsPresentationMode(true)}
          className="hidden sm:inline-flex font-medium text-xs"
          title="Presentation Mode (Focussed full-canvas review)"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Present</span>
        </Button>

        {/* Export Button */}
        <Button
          variant="default"
          size="sm"
          onClick={onOpenExport}
          className="font-semibold text-xs shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </Button>
      </div>
    </header>
  );
};
