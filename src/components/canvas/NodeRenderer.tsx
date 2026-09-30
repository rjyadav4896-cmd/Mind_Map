import React, { useState, useRef } from 'react';
import { CanvasElement } from '../../types/canvas';
import { useCanvas } from '../../context/CanvasContext';
import { StickyNoteNode } from './StickyNoteNode';
import { ShapeNode } from './ShapeNode';
import { FrameNode } from './FrameNode';
import { ConnectorPort } from './ConnectorPort';

interface NodeRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  onStartDrag: (e: React.PointerEvent, element: CanvasElement) => void;
  onStartResize: (e: React.PointerEvent, element: CanvasElement, direction: string) => void;
}

export const NodeRenderer: React.FC<NodeRendererProps> = ({
  element,
  isSelected,
  onStartDrag,
  onStartResize,
}) => {
  const { activeTool, updateElement } = useCanvas();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);

  // If drawing type, it is rendered in SVG layer, not as DOM node
  if (element.type === 'drawing') return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    // If user clicked an interactive input inside sticky note or button, don't initiate drag
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.closest('button') ||
      target.closest('[data-anchor]')
    ) {
      return;
    }

    if (activeTool === 'select') {
      onStartDrag(e, element);
    }
  };

  const renderContent = () => {
    switch (element.type) {
      case 'sticky':
        return <StickyNoteNode element={element} isSelected={isSelected} />;
      case 'shape':
        return <ShapeNode element={element} isSelected={isSelected} />;
      case 'frame':
        return <FrameNode element={element} isSelected={isSelected} />;
      case 'text':
        return (
          <div
            className={`w-full h-full p-2 select-none flex items-center ${
              isSelected ? 'ring-2 ring-blue-500 rounded' : ''
            }`}
            onDoubleClick={() => setIsEditingText(true)}
          >
            {isEditingText ? (
              <textarea
                autoFocus
                value={element.text || ''}
                onChange={(e) => updateElement(element.id, { text: e.target.value })}
                onBlur={() => setIsEditingText(false)}
                className="w-full bg-white/95 rounded p-1 text-sm border border-blue-400 focus:outline-none"
              />
            ) : (
              <div
                className="w-full leading-snug cursor-text"
                style={{
                  fontSize: `${element.fontSize || 18}px`,
                  color: element.textColor || '#0F172A',
                  fontWeight: element.fontWeight === 'bold' ? 700 : 500,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {element.text || 'Double click to edit text'}
              </div>
            )}
          </div>
        );
      case 'image':
        return (
          <div className={`w-full h-full rounded-xl overflow-hidden border border-slate-200 bg-white ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
            {element.src ? (
              <img
                src={element.src}
                alt={element.label || 'Canvas image'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
                No image data
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`absolute transition-[border-color,box-shadow] pointer-events-auto ${
        activeTool === 'select' ? 'cursor-move' : ''
      }`}
      style={{
        transform: `translate3d(${element.x}px, ${element.y}px, 0px) rotate(${element.rotation || 0}deg)`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        zIndex: element.zIndex,
      }}
      onPointerDown={handlePointerDown}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      data-element-id={element.id}
    >
      {renderContent()}

      {/* 4 Connection Ports (top, right, bottom, left) */}
      <ConnectorPort
        element={element}
        isSelected={isSelected}
        isHovered={isHovered}
      />

      {/* Resize Handle (Bottom-Right) when selected and not locked */}
      {isSelected && !element.locked && (
        <div
          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-blue-600 rounded-sm shadow-xs cursor-nwse-resize z-40 hover:scale-125 transition-transform"
          onPointerDown={(e) => {
            e.stopPropagation();
            onStartResize(e, element, 'bottom-right');
          }}
          title="Drag to resize"
        />
      )}
    </div>
  );
};
