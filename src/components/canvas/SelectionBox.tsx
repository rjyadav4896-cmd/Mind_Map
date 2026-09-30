import React from 'react';
import { SelectionState, Rect } from '../../types/canvas';

interface SelectionBoxProps {
  selectionState: SelectionState;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({ selectionState }) => {
  if (!selectionState.isSelecting) return null;

  const left = Math.min(selectionState.startX, selectionState.currentX);
  const top = Math.min(selectionState.startY, selectionState.currentY);
  const width = Math.abs(selectionState.currentX - selectionState.startX);
  const height = Math.abs(selectionState.currentY - selectionState.startY);

  if (width < 3 && height < 3) return null;

  return (
    <div
      className="absolute border border-blue-500 bg-blue-500/10 pointer-events-none z-50 rounded-sm"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
  );
};
