import React, { useRef, useState } from 'react';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { useCanvas } from '../../context/CanvasContext';
import { STICKY_PALETTES } from '../../utils/colors';

export const Minimap: React.FC = () => {
  const { elements, viewport, setViewport, isDarkMode } = useCanvas();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const minimapRef = useRef<HTMLDivElement>(null);

  const minimapWidth = 190;
  const minimapHeight = 120;

  // Compute total world bounds including elements and viewport
  const viewWidth = window.innerWidth / viewport.zoom;
  const viewHeight = window.innerHeight / viewport.zoom;
  const viewLeft = -viewport.x / viewport.zoom;
  const viewTop = -viewport.y / viewport.zoom;

  let minX = Math.min(viewLeft, ...elements.map((e) => e.x));
  let minY = Math.min(viewTop, ...elements.map((e) => e.y));
  let maxX = Math.max(viewLeft + viewWidth, ...elements.map((e) => e.x + e.width));
  let maxY = Math.max(viewTop + viewHeight, ...elements.map((e) => e.y + e.height));

  // Add padding
  const padding = 200;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const totalWorldWidth = Math.max(maxX - minX, 1000);
  const totalWorldHeight = Math.max(maxY - minY, 800);

  const scaleX = minimapWidth / totalWorldWidth;
  const scaleY = minimapHeight / totalWorldHeight;
  const scale = Math.min(scaleX, scaleY);

  const worldToMini = (x: number, y: number) => ({
    x: (x - minX) * scale,
    y: (y - minY) * scale,
  });

  const miniViewport = {
    x: (viewLeft - minX) * scale,
    y: (viewTop - minY) * scale,
    width: Math.max(viewWidth * scale, 12),
    height: Math.max(viewHeight * scale, 8),
  };

  const handleMinimapPointerDown = (e: React.PointerEvent) => {
    if (!minimapRef.current) return;
    const rect = minimapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert click position to world center
    const targetWorldX = minX + clickX / scale;
    const targetWorldY = minY + clickY / scale;

    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;

    setViewport((prev) => ({
      ...prev,
      x: screenCenterX - targetWorldX * prev.zoom,
      y: screenCenterY - targetWorldY * prev.zoom,
    }));
  };

  return (
    <div className="flex flex-col items-end">
      {/* Collapse button */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="mb-1.5 px-2 py-1 bg-card/90 dark:bg-zinc-900/90 backdrop-blur-md border border-border text-muted-foreground hover:text-foreground rounded-lg text-xs font-medium shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
      >
        <MapPin className="w-3 h-3 text-primary" />
        <span>Navigator</span>
        {isCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {!isCollapsed && (
        <div
          ref={minimapRef}
          onPointerDown={handleMinimapPointerDown}
          className="relative rounded-xl border border-border bg-card/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-xl overflow-hidden cursor-crosshair select-none transition-colors"
          style={{ width: `${minimapWidth}px`, height: `${minimapHeight}px` }}
        >
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: isDarkMode
                ? 'radial-gradient(circle, #a1a1aa 1px, transparent 1px)'
                : 'radial-gradient(circle, #64748b 1px, transparent 1px)',
              backgroundSize: '12px 12px',
            }}
          />

          {/* Render miniature nodes */}
          {elements.map((el) => {
            const { x, y } = worldToMini(el.x, el.y);
            const w = Math.max(el.width * scale, 3);
            const h = Math.max(el.height * scale, 2);

            let bg = '#94a3b8';
            if (el.type === 'sticky') {
              bg = STICKY_PALETTES[el.color || 'yellow']?.bg || '#FEF08A';
            } else if (el.type === 'shape') {
              bg = el.fill && el.fill !== 'transparent' ? el.fill : isDarkMode ? '#3f3f46' : '#cbd5e1';
            } else if (el.type === 'frame') {
              bg = isDarkMode ? 'rgba(63, 63, 70, 0.4)' : 'rgba(203, 213, 225, 0.4)';
            }

            return (
              <div
                key={el.id}
                className="absolute rounded-xs pointer-events-none transition-transform"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  width: `${w}px`,
                  height: `${h}px`,
                  backgroundColor: bg,
                  border: isDarkMode ? '0.5px solid rgba(255,255,255,0.1)' : '0.5px solid rgba(0,0,0,0.15)',
                }}
              />
            );
          })}

          {/* Visible Viewport Camera Box */}
          <div
            className="absolute border-2 border-primary bg-primary/20 rounded-xs pointer-events-none shadow-xs transition-[transform]"
            style={{
              left: `${miniViewport.x}px`,
              top: `${miniViewport.y}px`,
              width: `${miniViewport.width}px`,
              height: `${miniViewport.height}px`,
            }}
          />
        </div>
      )}
    </div>
  );
};
