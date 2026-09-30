import React, { useState, useEffect } from 'react';
import { CanvasProvider, useCanvas } from './context/CanvasContext';
import { InfiniteCanvas } from './components/canvas/InfiniteCanvas';
import { TopNavbar } from './components/header/TopNavbar';
import { MainToolbar } from './components/tools/MainToolbar';
import { PropertyBar } from './components/tools/PropertyBar';
import { NavigationControls } from './components/tools/NavigationControls';
import { TemplatesModal } from './components/modals/TemplatesModal';
import { ExportModal } from './components/modals/ExportModal';
import { CommandPalette } from './components/tools/CommandPalette';
import { WorkspaceSidebar } from './components/sidebar/WorkspaceSidebar';

function CanvasApp() {
  const { isSidebarOpen, setIsSidebarOpen, isPresentationMode } = useCanvas();

  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Pen tool drawing settings
  const [drawingColor, setDrawingColor] = useState<string>('#1E293B');
  const [drawingWidth, setDrawingWidth] = useState<number>(3);

  // Keyboard shortcut for Cmd+K / Ctrl+K and Cmd+\ for sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (cmdOrCtrl && e.key === '\\') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSidebarOpen]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background text-foreground select-none font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <TopNavbar
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Left Collapsible Multi-folder Workspace Sidebar */}
      <WorkspaceSidebar onOpenTemplates={() => setIsTemplatesOpen(true)} />

      {/* Main Infinite Canvas Viewport */}
      <main
        className={`w-full h-full pt-14 transition-all duration-300 ${
          isSidebarOpen && !isPresentationMode ? 'md:pl-72' : 'pl-0'
        }`}
      >
        <InfiniteCanvas
          currentDrawingColor={drawingColor}
          currentDrawingWidth={drawingWidth}
        />
      </main>

      {/* Contextual Selection Property Bar */}
      <PropertyBar />

      {/* Main Bottom Tool Dock (FigJam / Miro Style) */}
      <MainToolbar
        currentDrawingColor={drawingColor}
        setCurrentDrawingColor={setDrawingColor}
        currentDrawingWidth={drawingWidth}
        setCurrentDrawingWidth={setDrawingWidth}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Bottom Right: Minimap & Navigation / Zoom Controls */}
      <NavigationControls />

      {/* Modals & Overlays */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenTemplates={() => {
          setIsCommandPaletteOpen(false);
          setIsTemplatesOpen(true);
        }}
        onOpenExport={() => {
          setIsCommandPaletteOpen(false);
          setIsExportOpen(true);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <CanvasProvider>
      <CanvasApp />
    </CanvasProvider>
  );
}
