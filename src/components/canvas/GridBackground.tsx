import React from 'react';
import { Viewport, GridMode } from '../../types/canvas';
import { useCanvas } from '../../context/CanvasContext';

interface GridBackgroundProps {
  viewport: Viewport;
  gridMode: GridMode;
}

export const GridBackground: React.FC<GridBackgroundProps> = ({ viewport, gridMode }) => {
  const { isDarkMode } = useCanvas();

  const bgColor = isDarkMode ? '#09090B' : '#F8F9FA';
  const dotColor = isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1';
  const gridLineColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(203, 213, 225, 0.5)';

  if (gridMode === 'blank') {
    return <div className="absolute inset-0 pointer-events-none transition-colors duration-200" style={{ backgroundColor: bgColor }} />;
  }

  const baseSize = 24;
  const scaledSize = baseSize * viewport.zoom;
  
  // Calculate modulo offsets so dots/lines line up accurately with the infinite canvas transform
  const offsetX = ((viewport.x % scaledSize) + scaledSize) % scaledSize;
  const offsetY = ((viewport.y % scaledSize) + scaledSize) % scaledSize;

  if (gridMode === 'dots') {
    return (
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-200"
        style={{
          backgroundColor: bgColor,
          backgroundImage: `radial-gradient(circle, ${dotColor} ${Math.max(1 * viewport.zoom, 1)}px, transparent ${Math.max(1 * viewport.zoom, 1)}px)`,
          backgroundSize: `${scaledSize}px ${scaledSize}px`,
          backgroundPosition: `${offsetX}px ${offsetY}px`,
        }}
      />
    );
  }

  // Squares / Grid Lines
  return (
    <div
      className="absolute inset-0 pointer-events-none transition-colors duration-200"
      style={{
        backgroundColor: bgColor,
        backgroundImage: `
          linear-gradient(to right, ${gridLineColor} 1px, transparent 1px),
          linear-gradient(to bottom, ${gridLineColor} 1px, transparent 1px)
        `,
        backgroundSize: `${scaledSize}px ${scaledSize}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
      }}
    />
  );
};
