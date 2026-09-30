import React, { useRef, useState } from 'react';
import { X, Image, FileCode, Database, Upload, Check } from 'lucide-react';
import { useCanvas } from '../../context/CanvasContext';
import { exportBoardAsPng, exportBoardAsSvg, exportBoardAsJson } from '../../utils/export';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const {
    boardTitle,
    elements,
    connections,
    viewport,
    importBoard,
  } = useCanvas();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportPng = () => {
    exportBoardAsPng(boardTitle, elements, connections, 2);
    onClose();
  };

  const handleExportSvg = () => {
    exportBoardAsSvg(boardTitle, elements, connections);
    onClose();
  };

  const handleExportJson = () => {
    exportBoardAsJson(boardTitle, elements, connections, viewport);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.elements && Array.isArray(json.elements)) {
          importBoard(json.elements, json.connections || [], json.title);
          setImportStatus('Board imported successfully!');
          setTimeout(() => {
            onClose();
          }, 600);
        } else {
          setImportStatus('Invalid board file format');
        }
      } catch {
        setImportStatus('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-xs select-none">
      <div className="bg-popover text-popover-foreground rounded-2xl border border-border shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Export & Share</h2>
            <p className="text-xs text-muted-foreground">Save your canvas locally or backup state</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 gap-2.5">
            {/* PNG */}
            <button
              type="button"
              onClick={handleExportPng}
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/60 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                  <Image className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">PNG Image (2x Retina)</h3>
                  <p className="text-[11px] text-muted-foreground">High-res pixel graphic for presentations</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">PNG</Badge>
            </button>

            {/* SVG */}
            <button
              type="button"
              onClick={handleExportSvg}
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/60 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">SVG Vector Graphic</h3>
                  <p className="text-[11px] text-muted-foreground">Scalable vector nodes for Illustrator / Figma</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">SVG</Badge>
            </button>

            {/* JSON Backup */}
            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/60 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">JSON Backup Archive</h3>
                  <p className="text-[11px] text-muted-foreground">Portable archive to restore this whiteboard</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">JSON</Badge>
            </button>
          </div>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-semibold text-muted-foreground">
              <span className="bg-popover px-2">Or Restore Board</span>
            </div>
          </div>

          {/* Import JSON */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full text-xs font-semibold py-2.5 h-auto"
          >
            <Upload className="w-4 h-4 mr-2" />
            <span>Restore from JSON File</span>
          </Button>

          {importStatus && (
            <p className="text-center text-xs font-medium text-primary animate-in fade-in">
              {importStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
