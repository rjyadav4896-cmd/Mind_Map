import React, { useState } from 'react';
import { CanvasElement } from '../../types/canvas';
import { useCanvas } from '../../context/CanvasContext';

interface FrameNodeProps {
  element: CanvasElement;
  isSelected: boolean;
}

const THEME_STYLES: Record<string, { bg: string; border: string; header: string; text: string }> = {
  slate: {
    bg: 'bg-slate-50/60 dark:bg-zinc-900/40',
    border: 'border-slate-200 dark:border-zinc-800',
    header: 'bg-slate-100/90 dark:bg-zinc-800/80 text-slate-800 dark:text-zinc-200',
    text: 'text-slate-700 dark:text-zinc-300',
  },
  blue: {
    bg: 'bg-blue-50/50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-900/60',
    header: 'bg-blue-100/90 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200',
    text: 'text-blue-800 dark:text-blue-300',
  },
  emerald: {
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-900/60',
    header: 'bg-emerald-100/90 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200',
    text: 'text-emerald-800 dark:text-emerald-300',
  },
  amber: {
    bg: 'bg-amber-50/50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-900/60',
    header: 'bg-amber-100/90 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200',
    text: 'text-amber-800 dark:text-amber-300',
  },
  purple: {
    bg: 'bg-purple-50/50 dark:bg-purple-950/20',
    border: 'border-purple-200 dark:border-purple-900/60',
    header: 'bg-purple-100/90 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200',
    text: 'text-purple-800 dark:text-purple-300',
  },
  rose: {
    bg: 'bg-rose-50/50 dark:bg-rose-950/20',
    border: 'border-rose-200 dark:border-rose-900/60',
    header: 'bg-rose-100/90 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200',
    text: 'text-rose-800 dark:text-rose-300',
  },
};

export const FrameNode: React.FC<FrameNodeProps> = ({ element, isSelected }) => {
  const { updateElement } = useCanvas();
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const theme = THEME_STYLES[element.frameTheme || 'slate'] || THEME_STYLES.slate;

  return (
    <div
      className={`w-full h-full rounded-2xl border-2 border-dashed flex flex-col transition-all overflow-hidden ${
        theme.bg
      } ${theme.border} ${isSelected ? 'ring-2 ring-primary shadow-md' : 'shadow-none'}`}
    >
      {/* Frame Header */}
      <div
        className={`px-3 py-1.5 border-b border-dashed ${theme.border} ${theme.header} flex items-center justify-between select-none cursor-pointer`}
        onDoubleClick={() => setIsEditingTitle(true)}
      >
        {isEditingTitle ? (
          <input
            autoFocus
            type="text"
            value={element.title || ''}
            onChange={(e) => updateElement(element.id, { title: e.target.value })}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setIsEditingTitle(false);
            }}
            className="text-xs font-bold px-1 py-0.5 rounded bg-background text-foreground border border-primary focus:outline-none w-full max-w-[200px]"
          />
        ) : (
          <span className="text-xs font-bold tracking-wide uppercase truncate">
            {element.title || 'Untitled Frame'}
          </span>
        )}

        <span className="text-[10px] font-mono opacity-50">Frame</span>
      </div>

      {/* Frame Interior */}
      <div className="flex-1 pointer-events-none" />
    </div>
  );
};
