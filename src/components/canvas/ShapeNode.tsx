import React, { useState } from 'react';
import { CanvasElement } from '../../types/canvas';
import { useCanvas } from '../../context/CanvasContext';

interface ShapeNodeProps {
  element: CanvasElement;
  isSelected: boolean;
}

export const ShapeNode: React.FC<ShapeNodeProps> = ({ element, isSelected }) => {
  const { updateElement } = useCanvas();
  const [isEditing, setIsEditing] = useState(false);

  const {
    width,
    height,
    shapeType = 'rounded-rectangle',
    fill = '#EFF6FF',
    stroke = '#60A5FA',
    strokeWidth = 2,
    strokeStyle = 'solid',
    opacity = 1,
    label = '',
    textColor = '#0F172A',
    fontWeight = 'medium',
    fontSize = 14,
  } = element;

  const strokeDash =
    strokeStyle === 'dashed' ? '6,4' : strokeStyle === 'dotted' ? '2,4' : 'none';

  const renderShapeSvg = () => {
    switch (shapeType) {
      case 'circle':
        return (
          <ellipse
            cx={width / 2}
            cy={height / 2}
            rx={width / 2 - strokeWidth}
            ry={height / 2 - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );

      case 'diamond': {
        const d = `M ${width / 2} ${strokeWidth} L ${width - strokeWidth} ${height / 2} L ${width / 2} ${height - strokeWidth} L ${strokeWidth} ${height / 2} Z`;
        return (
          <path
            d={d}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );
      }

      case 'triangle': {
        const d = `M ${width / 2} ${strokeWidth} L ${width - strokeWidth} ${height - strokeWidth} L ${strokeWidth} ${height - strokeWidth} Z`;
        return (
          <path
            d={d}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );
      }

      case 'cylinder': {
        const capH = Math.min(height * 0.25, 24);
        const d = `
          M ${strokeWidth} ${capH}
          C ${strokeWidth} ${capH / 3}, ${width - strokeWidth} ${capH / 3}, ${width - strokeWidth} ${capH}
          L ${width - strokeWidth} ${height - capH}
          C ${width - strokeWidth} ${height}, ${strokeWidth} ${height}, ${strokeWidth} ${height - capH}
          Z
        `;
        return (
          <g>
            <path
              d={d}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDash}
            />
            {/* Top ellipse */}
            <ellipse
              cx={width / 2}
              cy={capH}
              rx={width / 2 - strokeWidth}
              ry={capH * 0.6}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </g>
        );
      }

      case 'star': {
        const cx = width / 2;
        const cy = height / 2;
        const spikes = 5;
        const outerRadius = Math.min(width, height) / 2 - strokeWidth;
        const innerRadius = outerRadius * 0.45;
        let rot = (Math.PI / 2) * 3;
        const step = Math.PI / spikes;
        let path = '';

        for (let i = 0; i < spikes; i++) {
          const x = cx + Math.cos(rot) * outerRadius;
          const y = cy + Math.sin(rot) * outerRadius;
          path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
          rot += step;

          const ix = cx + Math.cos(rot) * innerRadius;
          const iy = cy + Math.sin(rot) * innerRadius;
          path += ` L ${ix} ${iy}`;
          rot += step;
        }
        path += ' Z';
        return (
          <path
            d={path}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );
      }

      case 'cloud': {
        // Organic cloud shape
        const w = width - strokeWidth * 2;
        const h = height - strokeWidth * 2;
        const d = `
          M ${strokeWidth + w * 0.25} ${strokeWidth + h * 0.75}
          A ${w * 0.2} ${h * 0.25} 0 0 1 ${strokeWidth + w * 0.2} ${strokeWidth + h * 0.35}
          A ${w * 0.25} ${h * 0.3} 0 0 1 ${strokeWidth + w * 0.55} ${strokeWidth + h * 0.2}
          A ${w * 0.25} ${h * 0.3} 0 0 1 ${strokeWidth + w * 0.85} ${strokeWidth + h * 0.35}
          A ${w * 0.2} ${h * 0.25} 0 0 1 ${strokeWidth + w * 0.8} ${strokeWidth + h * 0.75}
          Z
        `;
        return (
          <path
            d={d}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );
      }

      case 'rectangle':
        return (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );

      case 'rounded-rectangle':
      default:
        return (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            rx={12}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );
    }
  };

  return (
    <div
      className={`w-full h-full relative flex items-center justify-center select-none ${
        isSelected ? 'ring-2 ring-blue-500 rounded-lg' : ''
      }`}
      style={{ opacity }}
      onDoubleClick={() => setIsEditing(true)}
    >
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        width={width}
        height={height}
      >
        {renderShapeSvg()}
      </svg>

      {/* Centered editable label */}
      <div className="relative z-10 px-4 py-2 w-full text-center flex items-center justify-center">
        {isEditing ? (
          <textarea
            autoFocus
            value={label}
            onChange={(e) => updateElement(element.id, { label: e.target.value })}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsEditing(false);
            }}
            className="w-full bg-background text-foreground text-center resize-none border border-primary rounded p-1 text-xs focus:outline-none shadow-xs"
            rows={2}
          />
        ) : (
          <div
            className="w-full text-center leading-snug cursor-text"
            style={{
              color: textColor,
              fontWeight: fontWeight === 'bold' ? 700 : fontWeight === 'semibold' ? 600 : 500,
              fontSize: `${fontSize}px`,
              whiteSpace: 'pre-wrap',
            }}
          >
            {label || <span className="opacity-30 italic text-xs">Double click to label</span>}
          </div>
        )}
      </div>
    </div>
  );
};
