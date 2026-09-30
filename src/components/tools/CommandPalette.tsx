import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  StickyNote,
  Square,
  Circle,
  Diamond,
  GitBranch,
  Play,
  Grid,
  Maximize2,
  LayoutTemplate,
  Download,
  PenTool,
} from 'lucide-react';
import { useCanvas } from '../../context/CanvasContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTemplates: () => void;
  onOpenExport: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenTemplates,
  onOpenExport,
}) => {
  const {
    addElement,
    setActiveTool,
    resetZoom,
    fitToView,
    setIsPresentationMode,
    setGridMode,
    gridMode,
    selectedElementIds,
    autoBranchMindMap,
    organizeSelectionIntoKanban,
    organizeSelectionIntoTable,
    createBoard,
  } = useCanvas();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global listener for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      if (cmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or toggle
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands: CommandItem[] = [
    {
      id: 'organize-kanban',
      title: 'Arrange Selected into Kanban Grid',
      category: 'Organize',
      icon: <LayoutTemplate className="w-4 h-4 text-blue-600" />,
      action: () => {
        organizeSelectionIntoKanban();
      },
    },
    {
      id: 'organize-table',
      title: 'Arrange Selected into Table Matrix',
      category: 'Organize',
      icon: <Grid className="w-4 h-4 text-blue-600" />,
      action: () => {
        organizeSelectionIntoTable();
      },
    },
    {
      id: 'new-board-cmd',
      title: 'Create New Whiteboard',
      category: 'Boards',
      icon: <Square className="w-4 h-4 text-emerald-600" />,
      action: () => {
        createBoard();
      },
    },
    {
      id: 'frame-section',
      title: 'Draw Slide Presentation Frame',
      category: 'Frames',
      icon: <Square className="w-4 h-4 text-purple-600" />,
      action: () => {
        setActiveTool('frame');
      },
      shortcut: 'F',
    },
    {
      id: 'sticky-yellow',
      title: 'Add Yellow Sticky Note',
      category: 'Notes',
      icon: <StickyNote className="w-4 h-4 text-amber-500" />,
      action: () => {
        addElement({
          type: 'sticky',
          color: 'yellow',
          x: window.innerWidth / 2 - 110,
          y: window.innerHeight / 2 - 80,
          text: '',
        });
      },
      shortcut: 'S',
    },
    {
      id: 'sticky-mint',
      title: 'Add Mint Green Sticky Note',
      category: 'Notes',
      icon: <StickyNote className="w-4 h-4 text-emerald-500" />,
      action: () => {
        addElement({
          type: 'sticky',
          color: 'mint',
          x: window.innerWidth / 2 - 110,
          y: window.innerHeight / 2 - 80,
          text: '',
        });
      },
    },
    {
      id: 'sticky-rose',
      title: 'Add Rose Pink Sticky Note',
      category: 'Notes',
      icon: <StickyNote className="w-4 h-4 text-rose-500" />,
      action: () => {
        addElement({
          type: 'sticky',
          color: 'rose',
          x: window.innerWidth / 2 - 110,
          y: window.innerHeight / 2 - 80,
          text: '',
        });
      },
    },
    {
      id: 'sticky-lavender',
      title: 'Add Lavender Sticky Note',
      category: 'Notes',
      icon: <StickyNote className="w-4 h-4 text-purple-500" />,
      action: () => {
        addElement({
          type: 'sticky',
          color: 'lavender',
          x: window.innerWidth / 2 - 110,
          y: window.innerHeight / 2 - 80,
          text: '',
        });
      },
    },
    {
      id: 'shape-box',
      title: 'Add Process Card Shape',
      category: 'Shapes',
      icon: <Square className="w-4 h-4 text-blue-500" />,
      action: () => {
        addElement({
          type: 'shape',
          shapeType: 'rounded-rectangle',
          x: window.innerWidth / 2 - 90,
          y: window.innerHeight / 2 - 50,
          label: 'Process Node',
        });
      },
      shortcut: 'R',
    },
    {
      id: 'shape-diamond',
      title: 'Add Decision Diamond',
      category: 'Shapes',
      icon: <Diamond className="w-4 h-4 text-amber-600" />,
      action: () => {
        addElement({
          type: 'shape',
          shapeType: 'diamond',
          x: window.innerWidth / 2 - 60,
          y: window.innerHeight / 2 - 60,
          width: 120,
          height: 120,
          label: 'Decision?',
        });
      },
    },
    {
      id: 'shape-circle',
      title: 'Add Circle Node',
      category: 'Shapes',
      icon: <Circle className="w-4 h-4 text-emerald-500" />,
      action: () => {
        addElement({
          type: 'shape',
          shapeType: 'circle',
          x: window.innerWidth / 2 - 60,
          y: window.innerHeight / 2 - 60,
          width: 120,
          height: 120,
          label: 'Goal',
        });
      },
    },
    {
      id: 'mind-branch',
      title: 'Auto-branch Mind Map Idea',
      category: 'Mind Mapping',
      icon: <GitBranch className="w-4 h-4 text-purple-600" />,
      action: () => {
        if (selectedElementIds.length > 0) {
          autoBranchMindMap(selectedElementIds[0], 'right');
        } else {
          setActiveTool('connector');
        }
      },
      shortcut: 'C',
    },
    {
      id: 'pen-tool',
      title: 'Freehand Pen Tool',
      category: 'Drawing',
      icon: <PenTool className="w-4 h-4 text-slate-700" />,
      action: () => {
        setActiveTool('draw');
      },
      shortcut: 'P',
    },
    {
      id: 'templates-open',
      title: 'Browse Whiteboard Templates',
      category: 'Templates',
      icon: <LayoutTemplate className="w-4 h-4 text-blue-600" />,
      action: () => {
        onOpenTemplates();
      },
    },
    {
      id: 'view-fit',
      title: 'Fit Canvas to View',
      category: 'View',
      icon: <Maximize2 className="w-4 h-4 text-slate-600" />,
      action: () => {
        fitToView();
      },
      shortcut: 'F',
    },
    {
      id: 'view-reset',
      title: 'Reset Zoom (100%)',
      category: 'View',
      icon: <Maximize2 className="w-4 h-4 text-slate-600" />,
      action: () => {
        resetZoom();
      },
    },
    {
      id: 'mode-present',
      title: 'Enter Presentation / Focus Mode',
      category: 'View',
      icon: <Play className="w-4 h-4 text-slate-800" />,
      action: () => {
        setIsPresentationMode(true);
      },
    },
    {
      id: 'grid-toggle',
      title: 'Cycle Grid Background',
      category: 'View',
      icon: <Grid className="w-4 h-4 text-slate-600" />,
      action: () => {
        if (gridMode === 'dots') setGridMode('grid');
        else if (gridMode === 'grid') setGridMode('blank');
        else setGridMode('dots');
      },
    },
    {
      id: 'export-board',
      title: 'Export Canvas (PNG / SVG / JSON)',
      category: 'Export',
      icon: <Download className="w-4 h-4 text-blue-600" />,
      action: () => {
        onOpenExport();
      },
    },
  ];

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (cmd: CommandItem) => {
    cmd.action();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-background/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-popover text-popover-foreground rounded-2xl border border-border shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search actions..."
            className="w-full text-sm font-medium text-foreground bg-transparent placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground bg-muted rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching commands found
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <button
                key={cmd.id}
                type="button"
                onClick={() => handleSelect(cmd)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left cursor-pointer transition-colors ${
                  selectedIndex === idx
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-foreground/90 hover:bg-muted/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-1 rounded-lg bg-card border border-border shadow-2xs">
                    {cmd.icon}
                  </div>
                  <div>
                    <span className="text-xs font-semibold">{cmd.title}</span>
                    <span className="text-[10px] text-muted-foreground ml-2 font-normal">
                      in {cmd.category}
                    </span>
                  </div>
                </div>

                {cmd.shortcut && (
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted rounded border border-border">
                    {cmd.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
