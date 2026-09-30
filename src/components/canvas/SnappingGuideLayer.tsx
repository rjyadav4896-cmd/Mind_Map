import React from 'react';
import { SnapGuide, Viewport } from '../../types/canvas';

interface SnappingGuideLayerProps {
  guides: SnapGuide[];
  viewport: Viewport;
}

export const SnappingGuideLayer: React.FC<SnappingGuideLayerProps> = ({ guides }) => {
  if (!guides || guides.length === 0) return null;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-50 overflow-visible">
      {guides.map((guide, idx) => {
        if (guide.type === 'x') {
          return (
            <g key={`snap-x-${idx}`}>
              <line
                x1={guide.position}
                y1={guide.start}
                x2={guide.position}
                y2={guide.end}
                stroke="#EC4899"
                strokeWidth={1.5}
                strokeDasharray="4,4"
              />
              {/* Endpoint markers */}
              <circle cx={guide.position} cy={guide.start} r={3} fill="#EC4899" />
              <circle cx={guide.position} cy={guide.end} r={3} fill="#EC4899" />
            </g>
          );
        } else {
          return (
            <g key={`snap-y-${idx}`}>
              <line
                x1={guide.start}
                y1={guide.position}
                x2={guide.end}
                y2={guide.position}
                stroke="#EC4899"
                strokeWidth={1.5}
                strokeDasharray="4,4"
              />
              <circle cx={guide.start} cy={guide.position} r={3} fill="#EC4899" />
              <circle cx={guide.end} cy={guide.position} r={3} fill="#EC4899" />
            </g>
          );
        }
      })}
    </svg>
  );
};
