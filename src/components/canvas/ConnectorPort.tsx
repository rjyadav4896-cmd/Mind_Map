import React from 'react';
import { Plus } from 'lucide-react';
import { AnchorPosition, CanvasElement } from '../../types/canvas';
import { useCanvas } from '../../context/CanvasContext';

interface ConnectorPortProps {
  element: CanvasElement;
  isSelected: boolean;
  isHovered: boolean;
}

export const ConnectorPort: React.FC<ConnectorPortProps> = ({ element, isSelected, isHovered }) => {
  const { startConnecting, connectingDraft, autoBranchMindMap, activeTool } = useCanvas();

  const showPorts = isSelected || isHovered || activeTool === 'connector' || Boolean(connectingDraft);

  if (!showPorts) return null;

  const anchors: Array<{ position: AnchorPosition; className: string }> = [
    { position: 'top', className: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' },
    { position: 'right', className: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2' },
    { position: 'bottom', className: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' },
    { position: 'left', className: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2' },
  ];

  const handlePointerDown = (e: React.PointerEvent, position: AnchorPosition) => {
    e.stopPropagation();
    // Anchor center world position
    let x = element.x + element.width / 2;
    let y = element.y + element.height / 2;
    if (position === 'top') y = element.y;
    if (position === 'bottom') y = element.y + element.height;
    if (position === 'left') x = element.x;
    if (position === 'right') x = element.x + element.width;

    startConnecting(element.id, position, { x, y });
  };

  return (
    <>
      {anchors.map(({ position, className }) => {
        const isTarget =
          connectingDraft?.targetNodeId === element.id &&
          connectingDraft?.targetAnchor === position;

        return (
          <div
            key={position}
            className={`absolute z-30 flex items-center justify-center pointer-events-auto ${className}`}
            onPointerDown={(e) => handlePointerDown(e, position)}
            data-node-id={element.id}
            data-anchor={position}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 cursor-crosshair ${
                isTarget
                  ? 'scale-150 bg-blue-500 border-white shadow-lg ring-4 ring-blue-300'
                  : 'bg-white border-blue-500 hover:scale-130 hover:bg-blue-600 hover:border-white shadow-sm'
              }`}
              title={`Drag wire from ${position} anchor`}
            />
          </div>
        );
      })}

      {/* Auto-Branch [+] Quick Mind Map Buttons on Right and Bottom */}
      {isSelected && (
        <>
          <button
            type="button"
            className="absolute top-1/2 -right-8 -translate-y-1/2 z-30 w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-600 hover:text-blue-600 hover:border-blue-400 hover:scale-110 shadow-sm flex items-center justify-center transition-all cursor-pointer pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              autoBranchMindMap(element.id, 'right');
            }}
            title="Auto-branch child idea (Right)"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-30 w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-600 hover:text-blue-600 hover:border-blue-400 hover:scale-110 shadow-sm flex items-center justify-center transition-all cursor-pointer pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              autoBranchMindMap(element.id, 'bottom');
            }}
            title="Auto-branch child idea (Bottom)"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </>
  );
};
