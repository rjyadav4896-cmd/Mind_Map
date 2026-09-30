import React, { useState } from 'react';
import { useCanvas } from '../../context/CanvasContext';
import {
  generateConnectorPath,
  pointsToSvgPath,
  getNodeAnchorPoint,
} from '../../utils/geometry';
import { ConnectionWire, Point } from '../../types/canvas';

interface SvgConnectorLayerProps {
  currentDrawingPoints: Point[] | null;
  drawingColor: string;
  drawingWidth: number;
}

export const SvgConnectorLayer: React.FC<SvgConnectorLayerProps> = ({
  currentDrawingPoints,
  drawingColor,
  drawingWidth,
}) => {
  const {
    elements,
    connections,
    selectedConnectionId,
    setSelectedConnectionId,
    connectingDraft,
    updateConnection,
    deleteConnection,
    selectElement,
    selectedElementIds,
  } = useCanvas();

  const [editingWireId, setEditingWireId] = useState<string | null>(null);
  const [wireLabelInput, setWireLabelInput] = useState<string>('');

  const elementMap = new Map(elements.map((el) => [el.id, el]));

  const handleWireDoubleClick = (wire: ConnectionWire) => {
    setEditingWireId(wire.id);
    setWireLabelInput(wire.label || '');
  };

  const handleSaveWireLabel = (wireId: string) => {
    updateConnection(wireId, { label: wireLabelInput.trim() || undefined });
    setEditingWireId(null);
  };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      <defs>
        {/* Arrowheads in various colors */}
        <marker
          id="arrow-default"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748B" />
        </marker>
        <marker
          id="arrow-selected"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2563EB" />
        </marker>
        <marker
          id="arrow-blue"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#3B82F6" />
        </marker>
      </defs>

      {/* Freehand Drawing Elements */}
      {elements
        .filter((el) => el.type === 'drawing' && el.points && el.points.length > 0)
        .map((el) => {
          const isSelected = selectedElementIds.includes(el.id);
          const path = pointsToSvgPath(el.points || []);
          return (
            <g
              key={el.id}
              className="pointer-events-auto cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                selectElement(el.id);
              }}
            >
              {isSelected && (
                <path
                  d={path}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth={(el.strokeWidth || 3) + 8}
                  strokeOpacity={0.3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              <path
                d={path}
                fill="none"
                stroke={el.stroke || '#1E293B'}
                strokeWidth={el.strokeWidth || 3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}

      {/* Active Pen Drawing in Progress */}
      {currentDrawingPoints && currentDrawingPoints.length > 0 && (
        <path
          d={pointsToSvgPath(currentDrawingPoints)}
          fill="none"
          stroke={drawingColor}
          strokeWidth={drawingWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />
      )}

      {/* Existing Connection Wires */}
      {connections.map((wire) => {
        const fromEl = elementMap.get(wire.fromId);
        const toEl = elementMap.get(wire.toId);
        if (!fromEl || !toEl) return null;

        const p1 = getNodeAnchorPoint(fromEl, wire.fromAnchor);
        const p2 = getNodeAnchorPoint(toEl, wire.toAnchor);
        const isSelected = selectedConnectionId === wire.id;

        const { path, midPoint } = generateConnectorPath(
          p1,
          p2,
          wire.fromAnchor,
          wire.toAnchor,
          wire.style || 'curved'
        );

        return (
          <g key={wire.id} className="pointer-events-auto group/wire">
            {/* Wider transparent hit-area for easy clicking */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth={16}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedConnectionId(wire.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleWireDoubleClick(wire);
              }}
            />

            {/* Selection highlight glow */}
            {isSelected && (
              <path
                d={path}
                fill="none"
                stroke="#60A5FA"
                strokeWidth={(wire.strokeWidth || 2) + 6}
                strokeOpacity={0.4}
                strokeLinecap="round"
              />
            )}

            {/* Visible Wire Line */}
            <path
              d={path}
              fill="none"
              stroke={isSelected ? '#2563EB' : wire.color || '#64748B'}
              strokeWidth={isSelected ? (wire.strokeWidth || 2) + 1 : wire.strokeWidth || 2}
              strokeDasharray={wire.dashed ? '6,5' : 'none'}
              strokeLinecap="round"
              markerEnd={isSelected ? 'url(#arrow-selected)' : 'url(#arrow-default)'}
              className="transition-colors"
            />

            {/* Wire Label or Double-Click Placeholder */}
            {(wire.label || editingWireId === wire.id || isSelected) && (
              <foreignObject
                x={midPoint.x - 60}
                y={midPoint.y - 14}
                width={120}
                height={32}
                className="overflow-visible pointer-events-auto"
              >
                <div className="flex items-center justify-center w-full h-full">
                  {editingWireId === wire.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={wireLabelInput}
                      onChange={(e) => setWireLabelInput(e.target.value)}
                      onBlur={() => handleSaveWireLabel(wire.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveWireLabel(wire.id);
                        if (e.key === 'Escape') setEditingWireId(null);
                      }}
                      className="bg-white px-2 py-0.5 text-xs font-semibold border border-blue-500 rounded-full shadow-md text-slate-800 text-center focus:outline-none w-28"
                    />
                  ) : wire.label ? (
                    <div
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleWireDoubleClick(wire);
                      }}
                      className="bg-card text-card-foreground border border-border hover:border-primary/50 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shadow-xs cursor-text transition-colors select-none"
                    >
                      {wire.label}
                    </div>
                  ) : isSelected ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWireDoubleClick(wire);
                      }}
                      className="bg-card border border-primary/40 text-primary hover:bg-primary/10 px-2 py-0.5 rounded-full text-[10px] font-medium shadow-xs cursor-pointer"
                    >
                      + Add label
                    </button>
                  ) : null}
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}

      {/* Live Connecting Wire Draft (While dragging from anchor) */}
      {connectingDraft && (() => {
        const fromEl = elementMap.get(connectingDraft.fromNodeId);
        if (!fromEl) return null;

        const p1 = getNodeAnchorPoint(fromEl, connectingDraft.fromAnchor);
        const p2 = connectingDraft.currentWorldPoint;

        const { path } = generateConnectorPath(
          p1,
          p2,
          connectingDraft.fromAnchor,
          connectingDraft.targetAnchor || 'left',
          'curved'
        );

        return (
          <g>
            <path
              d={path}
              fill="none"
              stroke="#3B82F6"
              strokeWidth={2.5}
              strokeDasharray="6,4"
              strokeLinecap="round"
              markerEnd="url(#arrow-blue)"
            />
            {/* Dragging endpoint dot */}
            <circle
              cx={p2.x}
              cy={p2.y}
              r={5}
              fill="#2563EB"
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          </g>
        );
      })()}
    </svg>
  );
};
