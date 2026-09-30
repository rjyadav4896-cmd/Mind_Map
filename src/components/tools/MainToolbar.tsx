import React, { useState, useRef, useEffect } from 'react';
import {
  MousePointer,
  Hand,
  StickyNote,
  Square,
  Circle,
  Diamond,
  GitBranch,
  PenTool,
  Type,
  LayoutTemplate,
  Layers,
  ChevronUp,
  Sparkles,
  Command,
  Upload,
  Database,
  Cloud,
  Triangle,
  Plus,
} from 'lucide-react';
import { ToolMode, ShapeType } from '../../types/canvas';
import { useCanvas } from '../../context/CanvasContext';
import { STICKY_PALETTES, PEN_COLORS } from '../../utils/colors';
import { cn } from '../../lib/utils';
import { Separator } from '../ui/separator';

interface MainToolbarProps {
  currentDrawingColor: string;
  setCurrentDrawingColor: (color: string) => void;
  currentDrawingWidth: number;
  setCurrentDrawingWidth: (width: number) => void;
  onOpenTemplates: () => void;
  onOpenCommandPalette: () => void;
}

export const MainToolbar: React.FC<MainToolbarProps> = ({
  currentDrawingColor,
  setCurrentDrawingColor,
  currentDrawingWidth,
  setCurrentDrawingWidth,
  onOpenTemplates,
  onOpenCommandPalette,
}) => {
  const {
    activeTool,
    setActiveTool,
    addElement,
    handleDroppedFiles,
    isPresentationMode,
    viewport,
  } = useCanvas();

  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [penMenuOpen, setPenMenuOpen] = useState(false);
  const [stickyMenuOpen, setStickyMenuOpen] = useState(false);

  const stickyBtnRef = useRef<HTMLDivElement>(null);
  const shapeBtnRef = useRef<HTMLDivElement>(null);
  const penBtnRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close submenus when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (stickyBtnRef.current && !stickyBtnRef.current.contains(target)) {
        setStickyMenuOpen(false);
      }
      if (shapeBtnRef.current && !shapeBtnRef.current.contains(target)) {
        setShapeMenuOpen(false);
      }
      if (penBtnRef.current && !penBtnRef.current.contains(target)) {
        setPenMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setStickyMenuOpen(false);
        setShapeMenuOpen(false);
        setPenMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (isPresentationMode) return null;

  // Calculate world center point for spawning new elements neatly in current view
  const getWorldCenter = () => {
    const cx = (window.innerWidth / 2 - viewport.x) / viewport.zoom;
    const cy = (window.innerHeight / 2 - viewport.y) / viewport.zoom;
    return { x: cx, y: cy };
  };

  const handleSelectShape = (shapeType: ShapeType) => {
    const center = getWorldCenter();
    addElement({
      type: 'shape',
      shapeType,
      x: center.x - 90,
      y: center.y - 50,
      label: shapeType.charAt(0).toUpperCase() + shapeType.slice(1).replace('-', ' '),
    });
    setShapeMenuOpen(false);
    setActiveTool('select');
  };

  const handleAddStickyWithColor = (colorKey: string) => {
    const center = getWorldCenter();
    addElement({
      type: 'sticky',
      color: colorKey,
      x: center.x - 100,
      y: center.y - 75,
      text: '',
    });
    setStickyMenuOpen(false);
    setActiveTool('select');
  };

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const center = getWorldCenter();
      handleDroppedFiles(e.target.files, {
        x: center.x - 100,
        y: center.y - 100,
      });
      e.target.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.txt,.md,.json,.csv"
        className="hidden"
        onChange={handleFilePicked}
      />

      {/* Floating Toolbar Container - overflow-visible ensures drop-ups are never clipped */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto overflow-visible">
        <div className="flex items-center gap-1 sm:gap-1.5 p-1.5 bg-card/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl border border-border shadow-xl dark:shadow-2xl dark:shadow-black/50 overflow-visible transition-colors">
          
          {/* Select Tool (V) */}
          <button
            type="button"
            onClick={() => {
              setActiveTool('select');
              setStickyMenuOpen(false);
              setShapeMenuOpen(false);
              setPenMenuOpen(false);
            }}
            className={cn(
              'p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0',
              activeTool === 'select'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            title="Select tool (V)"
          >
            <MousePointer className="w-4 h-4" />
          </button>

          {/* Hand Pan Tool (H) */}
          <button
            type="button"
            onClick={() => {
              setActiveTool('hand');
              setStickyMenuOpen(false);
              setShapeMenuOpen(false);
              setPenMenuOpen(false);
            }}
            className={cn(
              'p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0',
              activeTool === 'hand'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            title="Hand pan tool (H or Space+Drag)"
          >
            <Hand className="w-4 h-4" />
          </button>

          <Separator orientation="vertical" className="h-5 mx-0.5" />

          {/* Sticky Note Tool (S) with WORKING DROP-UP MENU */}
          <div ref={stickyBtnRef} className="relative shrink-0 overflow-visible">
            <button
              type="button"
              onClick={() => {
                setActiveTool('sticky');
                setStickyMenuOpen((prev) => !prev);
                setShapeMenuOpen(false);
                setPenMenuOpen(false);
              }}
              className={cn(
                'p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0',
                activeTool === 'sticky' || stickyMenuOpen
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              title="Sticky Note (S) - Click to drop or open color palette"
            >
              <StickyNote className="w-4 h-4 text-amber-500 fill-amber-400" />
              <ChevronUp
                className={cn(
                  'w-3 h-3 transition-transform opacity-70',
                  stickyMenuOpen && 'rotate-180'
                )}
              />
            </button>

            {/* Drop-Up Menu for Sticky Notes */}
            {stickyMenuOpen && (
              <div
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 bg-popover text-popover-foreground border border-border shadow-2xl rounded-xl p-3 flex flex-col gap-2 min-w-[210px] animate-in fade-in-0 zoom-in-95 pointer-events-auto"
                style={{ filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.2))' }}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground px-0.5">
                  <span>Sticky Note Colors</span>
                  <span className="text-[10px] text-muted-foreground/70">Click to place</span>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  {Object.entries(STICKY_PALETTES).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleAddStickyWithColor(key)}
                      className="group relative flex flex-col items-center justify-center p-1.5 rounded-lg border border-border hover:border-primary/50 hover:scale-105 transition-all cursor-pointer"
                      style={{ backgroundColor: config.bg }}
                      title={`Add ${config.name} Note`}
                    >
                      <div className="w-5 h-5 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-3.5 h-3.5 text-slate-800" />
                      </div>
                      <span className="text-[9px] font-medium text-slate-800 truncate w-full text-center mt-0.5">
                        {config.name}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleAddStickyWithColor('yellow')}
                    className="w-full py-1 text-center text-xs font-medium text-primary hover:bg-muted rounded-md transition-colors cursor-pointer"
                  >
                    Quick Add Default Note
                  </button>
                </div>

                {/* Drop-up arrow marker */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-popover border-r border-b border-border pointer-events-none" />
              </div>
            )}
          </div>

          {/* Shapes Menu Tool (R) with WORKING DROP-UP MENU */}
          <div ref={shapeBtnRef} className="relative shrink-0 overflow-visible">
            <button
              type="button"
              onClick={() => {
                setActiveTool('shape');
                setShapeMenuOpen((prev) => !prev);
                setStickyMenuOpen(false);
                setPenMenuOpen(false);
              }}
              className={cn(
                'p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0',
                activeTool === 'shape' || shapeMenuOpen
                  ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              title="Shapes (R) - Click to open shapes library"
            >
              <Square className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <ChevronUp
                className={cn(
                  'w-3 h-3 transition-transform opacity-70',
                  shapeMenuOpen && 'rotate-180'
                )}
              />
            </button>

            {/* Drop-Up Menu for Shapes */}
            {shapeMenuOpen && (
              <div
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 bg-popover text-popover-foreground border border-border shadow-2xl rounded-xl p-3 w-68 animate-in fade-in-0 zoom-in-95 pointer-events-auto"
                style={{ filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.2))' }}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground mb-2 px-0.5">
                  <span>Geometric Shapes</span>
                  <span className="text-[10px] text-muted-foreground/70">Click to place</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {/* Rounded Rectangle */}
                  <button
                    type="button"
                    onClick={() => handleSelectShape('rounded-rectangle')}
                    className="p-2 rounded-lg hover:bg-accent flex flex-col items-center gap-1.5 text-foreground cursor-pointer transition-colors border border-transparent hover:border-border"
                    title="Rounded Card / Container"
                  >
                    <div className="w-6 h-4.5 border-2 border-foreground/80 rounded-md" />
                    <span className="text-[10px] font-medium">Card</span>
                  </button>

                  {/* Sharp Rectangle */}
                  <button
                    type="button"
                    onClick={() => handleSelectShape('rectangle')}
                    className="p-2 rounded-lg hover:bg-accent flex flex-col items-center gap-1.5 text-foreground cursor-pointer transition-colors border border-transparent hover:border-border"
                    title="Sharp Box"
                  >
                    <div className="w-6 h-4.5 border-2 border-foreground/80" />
                    <span className="text-[10px] font-medium">Box</span>
                  </button>

                  {/* Circle */}
                  <button
                    type="button"
                    onClick={() => handleSelectShape('circle')}
                    className="p-2 rounded-lg hover:bg-accent flex flex-col items-center gap-1.5 text-foreground cursor-pointer transition-colors border border-transparent hover:border-border"
                    title="Circle / Node"
                  >
                    <Circle className="w-5 h-5 text-foreground/80" />
                    <span className="text-[10px] font-medium">Circle</span>
                  </button>

                  {/* Diamond / Decision */}
                  <button
                    type="button"
                    onClick={() => handleSelectShape('diamond')}
                    className="p-2 rounded-lg hover:bg-accent flex flex-col items-center gap-1.5 text-foreground cursor-pointer transition-colors border border-transparent hover:border-border"
                    title="Diamond (Decision Branch)"
                  >
                    <div className="w-4 h-4 border-2 border-foreground/80 rotate-45 my-0.5" />
                    <span className="text-[10px] font-medium">Decision</span>
                  </button>

                  {/* Cylinder / Database */}
                  <button
                    type="button"
                    onClick={() => handleSelectShape('cylinder')}
                    className="p-2 rounded-lg hover:bg-accent flex flex-col items-center gap-1.5 text-foreground cursor-pointer transition-colors border border-transparent hover:border-border"
                    title="Cylinder (Database / Storage)"
                  >
                    <Database className="w-5 h-5 text-foreground/80" />
                    <span className="text-[10px] font-medium">Database</span>
                  </button>

                  {/* Starburst */}
                  <button
                    type="button"
                    onClick={() => handleSelectShape('star')}
                    className="p-2 rounded-lg hover:bg-accent flex flex-col items-center gap-1.5 text-foreground cursor-pointer transition-colors border border-transparent hover:border-border"
                    title="Starburst (Highlight / Idea)"
                  >
                    <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
                    <span className="text-[10px] font-medium">Star</span>
                  </button>

                  {/* Cloud */}
                  <button
                    type="button"
                    onClick={() => handleSelectShape('cloud')}
                    className="p-2 rounded-lg hover:bg-accent flex flex-col items-center gap-1.5 text-foreground cursor-pointer transition-colors border border-transparent hover:border-border"
                    title="Cloud (Service / Architecture)"
                  >
                    <Cloud className="w-5 h-5 text-foreground/80" />
                    <span className="text-[10px] font-medium">Cloud</span>
                  </button>

                  {/* Triangle */}
                  <button
                    type="button"
                    onClick={() => handleSelectShape('triangle')}
                    className="p-2 rounded-lg hover:bg-accent flex flex-col items-center gap-1.5 text-foreground cursor-pointer transition-colors border border-transparent hover:border-border"
                    title="Triangle (Warning / Process)"
                  >
                    <Triangle className="w-5 h-5 text-foreground/80" />
                    <span className="text-[10px] font-medium">Triangle</span>
                  </button>
                </div>

                {/* Drop-up arrow marker */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-popover border-r border-b border-border pointer-events-none" />
              </div>
            )}
          </div>

          {/* Wire / Connect Tool (C) */}
          <button
            type="button"
            onClick={() => {
              setActiveTool('connector');
              setStickyMenuOpen(false);
              setShapeMenuOpen(false);
              setPenMenuOpen(false);
            }}
            className={cn(
              'p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0',
              activeTool === 'connector'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            title="Connector Wire tool (C) - Drag between node anchors to link"
          >
            <GitBranch className="w-4 h-4" />
          </button>

          {/* Freehand Pen (P) with WORKING DROP-UP MENU */}
          <div ref={penBtnRef} className="relative shrink-0 overflow-visible">
            <button
              type="button"
              onClick={() => {
                setActiveTool('draw');
                setPenMenuOpen((prev) => !prev);
                setStickyMenuOpen(false);
                setShapeMenuOpen(false);
              }}
              className={cn(
                'p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0',
                activeTool === 'draw' || penMenuOpen
                  ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400 ring-2 ring-purple-500/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              title="Freehand Pen tool (P) - Click to draw or choose stroke"
            >
              <PenTool className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <ChevronUp
                className={cn(
                  'w-3 h-3 transition-transform opacity-70',
                  penMenuOpen && 'rotate-180'
                )}
              />
            </button>

            {/* Drop-Up Menu for Pen */}
            {penMenuOpen && (
              <div
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 bg-popover text-popover-foreground border border-border shadow-2xl rounded-xl p-3 flex flex-col gap-2.5 w-48 animate-in fade-in-0 zoom-in-95 pointer-events-auto"
                style={{ filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.2))' }}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground px-0.5">
                  <span>Pen Ink Color</span>
                </div>

                {/* Color swatches */}
                <div className="flex items-center justify-between">
                  {PEN_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCurrentDrawingColor(c.color)}
                      className={cn(
                        'w-5 h-5 rounded-full border cursor-pointer transition-transform',
                        currentDrawingColor === c.color
                          ? 'scale-125 ring-2 ring-primary ring-offset-2 ring-offset-popover shadow-sm'
                          : 'hover:scale-110 opacity-80 hover:opacity-100'
                      )}
                      style={{ backgroundColor: c.color }}
                      title={c.id}
                    />
                  ))}
                </div>

                <div className="pt-2 border-t border-border flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground px-0.5">
                    Stroke Width
                  </span>
                  <div className="flex items-center justify-between gap-1">
                    {[
                      { width: 2, label: 'Fine' },
                      { width: 4, label: 'Med' },
                      { width: 8, label: 'Thick' },
                    ].map(({ width, label }) => (
                      <button
                        key={width}
                        type="button"
                        onClick={() => setCurrentDrawingWidth(width)}
                        className={cn(
                          'flex-1 flex flex-col items-center py-1 px-1 rounded-md text-xs font-medium cursor-pointer transition-colors',
                          currentDrawingWidth === width
                            ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <div
                          className="w-4 rounded-full bg-current my-1"
                          style={{ height: `${Math.max(width / 2, 1.5)}px` }}
                        />
                        <span className="text-[10px]">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Drop-up arrow marker */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-popover border-r border-b border-border pointer-events-none" />
              </div>
            )}
          </div>

          {/* Text Tool (T) */}
          <button
            type="button"
            onClick={() => {
              setActiveTool('text');
              setStickyMenuOpen(false);
              setShapeMenuOpen(false);
              setPenMenuOpen(false);
            }}
            className={cn(
              'p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0',
              activeTool === 'text'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            title="Text block (T) - Click canvas to type"
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Frame / Slide Section Tool */}
          <button
            type="button"
            onClick={() => {
              if (activeTool === 'frame') {
                setActiveTool('select');
              } else {
                setActiveTool('frame');
              }
              setStickyMenuOpen(false);
              setShapeMenuOpen(false);
              setPenMenuOpen(false);
            }}
            className={cn(
              'p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0',
              activeTool === 'frame'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            title="Frame / Slide Section Tool (Drag to create presentation frame)"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Upload Image / Document */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
            title="Embed Image or Document onto Canvas"
          >
            <Upload className="w-4 h-4" />
          </button>

          <Separator orientation="vertical" className="h-5 mx-0.5" />

          {/* Templates Button */}
          <button
            type="button"
            onClick={onOpenTemplates}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 transition-colors text-xs font-semibold cursor-pointer shrink-0"
            title="Browse whiteboard templates"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>Templates</span>
          </button>

          {/* Command Palette Trigger */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
            title="Command Palette (Cmd+K)"
          >
            <Command className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
};
