import React, { useState, useRef } from 'react';
import {
  CheckSquare,
  Square,
  Trash2,
  Copy,
  GripHorizontal,
  Plus,
  Lock,
  Unlock,
  Tag,
  Flag,
} from 'lucide-react';
import { CanvasElement, PriorityLevel } from '../../types/canvas';
import { useCanvas } from '../../context/CanvasContext';
import { STICKY_PALETTES, PRIORITY_STYLES } from '../../utils/colors';

interface StickyNoteNodeProps {
  element: CanvasElement;
  isSelected: boolean;
}

export const StickyNoteNode: React.FC<StickyNoteNodeProps> = ({ element, isSelected }) => {
  const { updateElement, duplicateSelected, deleteSelected } = useCanvas();
  const [isEditing, setIsEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const colorConfig = STICKY_PALETTES[element.color || 'yellow'] || STICKY_PALETTES.yellow;
  const isDark = element.color === 'dark';

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateElement(element.id, { text: e.target.value });
  };

  const handleToggleChecklistMode = () => {
    const isNowChecklist = !element.isChecklist;
    let items = element.checklistItems || [];
    if (isNowChecklist && items.length === 0) {
      // Split text into checklist lines
      const lines = (element.text || '').split('\n').filter((l) => l.trim().length > 0);
      items = lines.map((l) => ({
        id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        text: l.replace(/^[•\-\*]\s*/, ''),
        completed: false,
      }));
      if (items.length === 0) {
        items = [{ id: 'c-1', text: 'First task', completed: false }];
      }
    }
    updateElement(element.id, { isChecklist: isNowChecklist, checklistItems: items }, true);
  };

  const handleToggleCheckItem = (itemId: string) => {
    const updated = (element.checklistItems || []).map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateElement(element.id, { checklistItems: updated });
  };

  const handleAddCheckItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const newItem = {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      text: newChecklistText.trim(),
      completed: false,
    };
    updateElement(element.id, {
      checklistItems: [...(element.checklistItems || []), newItem],
    });
    setNewChecklistText('');
  };

  const handleDeleteCheckItem = (itemId: string) => {
    const updated = (element.checklistItems || []).filter((item) => item.id !== itemId);
    updateElement(element.id, { checklistItems: updated });
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTags = Array.from(new Set([...(element.tags || []), tagInput.trim()]));
      updateElement(element.id, { tags: newTags });
      setTagInput('');
      setShowTagInput(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = (element.tags || []).filter((t) => t !== tagToRemove);
    updateElement(element.id, { tags: updated });
  };

  const handleCyclePriority = () => {
    const sequence: PriorityLevel[] = ['none', 'low', 'normal', 'high', 'urgent'];
    const currentIdx = sequence.indexOf(element.priority || 'none');
    const nextPriority = sequence[(currentIdx + 1) % sequence.length];
    updateElement(element.id, { priority: nextPriority }, true);
  };

  const charCount = (element.text || '').length;

  return (
    <div
      className={`w-full h-full flex flex-col rounded-2xl transition-shadow select-none relative overflow-hidden ${
        isSelected
          ? 'ring-2 ring-blue-500 shadow-xl'
          : 'shadow-sm hover:shadow-md'
      }`}
      style={{
        backgroundColor: colorConfig.bg,
        border: `1.5px solid ${colorConfig.border}`,
        color: colorConfig.text,
      }}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-black/5 bg-black/[0.02]">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              element.isChecklist
                ? 'bg-black/10 text-emerald-700'
                : 'hover:bg-black/10 opacity-70 hover:opacity-100'
            }`}
            onClick={handleToggleChecklistMode}
            title={element.isChecklist ? 'Switch to text view' : 'Convert to interactive checklist'}
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>

          {/* Priority Flag */}
          {element.priority && element.priority !== 'none' && (
            <button
              type="button"
              onClick={handleCyclePriority}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider cursor-pointer border ${
                PRIORITY_STYLES[element.priority]?.bg || ''
              } ${PRIORITY_STYLES[element.priority]?.text || ''}`}
              title="Click to cycle priority"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_STYLES[element.priority]?.dot}`} />
              {PRIORITY_STYLES[element.priority]?.label}
            </button>
          )}

          {(!element.priority || element.priority === 'none') && isSelected && (
            <button
              type="button"
              onClick={handleCyclePriority}
              className="p-1 rounded-md hover:bg-black/10 opacity-50 hover:opacity-100 transition-colors cursor-pointer"
              title="Add priority tag"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Drag Dots Handle */}
        <div className="cursor-grab active:cursor-grabbing opacity-40 hover:opacity-80">
          <GripHorizontal className="w-4 h-4" />
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {isSelected && (
            <>
              <button
                type="button"
                className="p-1 rounded hover:bg-black/10 opacity-60 hover:opacity-100 transition-colors cursor-pointer"
                onClick={() => updateElement(element.id, { locked: !element.locked })}
                title={element.locked ? 'Unlock card' : 'Lock card position'}
              >
                {element.locked ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                className="p-1 rounded hover:bg-black/10 opacity-60 hover:opacity-100 transition-colors cursor-pointer"
                onClick={duplicateSelected}
                title="Duplicate card (Cmd+D)"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            type="button"
            className="p-1 rounded hover:bg-rose-500/20 text-rose-700/70 hover:text-rose-700 transition-colors cursor-pointer"
            onClick={deleteSelected}
            title="Delete card"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 p-3.5 flex flex-col overflow-y-auto">
        {element.isChecklist ? (
          <div className="flex-1 flex flex-col space-y-1.5 text-xs">
            {(element.checklistItems || []).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between group/item py-0.5"
              >
                <label className="flex items-center gap-2 cursor-pointer flex-1 mr-1">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggleCheckItem(item.id)}
                    className="rounded border-slate-400 text-blue-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                  />
                  <span
                    className={`leading-tight select-text ${
                      item.completed ? 'line-through opacity-50' : 'font-medium'
                    }`}
                  >
                    {item.text}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => handleDeleteCheckItem(item.id)}
                  className="opacity-0 group-hover/item:opacity-70 hover:opacity-100 p-0.5 text-rose-600 cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Quick add checklist item */}
            <form onSubmit={handleAddCheckItem} className="pt-2 flex items-center gap-1">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder="+ Add task..."
                className="w-full bg-black/5 rounded px-2 py-1 text-xs placeholder:text-black/30 focus:outline-none focus:ring-1 focus:ring-black/20"
              />
            </form>
          </div>
        ) : (
          <textarea
            value={element.text || ''}
            onChange={handleTextChange}
            placeholder="Type your notes or ideas here..."
            className="w-full h-full bg-transparent resize-none focus:outline-none font-medium text-sm leading-relaxed placeholder:text-black/30"
            style={{
              color: colorConfig.text,
              fontSize: `${element.fontSize || 14}px`,
            }}
          />
        )}

        {/* Tags row */}
        {element.tags && element.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            {element.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md cursor-default group"
                style={{
                  backgroundColor: colorConfig.tagBg,
                  color: colorConfig.tagText,
                }}
              >
                <span>#{tag}</span>
                {isSelected && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="opacity-40 group-hover:opacity-100 text-xs ml-0.5 cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Bar: Palette Swatches + Tag + Character Count */}
      <div className="px-3 py-2 border-t border-black/5 bg-black/[0.02] flex items-center justify-between text-[11px]">
        {/* Color Swatches */}
        <div className="flex items-center gap-1.5">
          {Object.entries(STICKY_PALETTES).map(([key, config]) => (
            <button
              key={key}
              type="button"
              className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer border ${
                element.color === key
                  ? 'scale-125 ring-2 ring-blue-500 border-white'
                  : 'border-black/20 hover:scale-110'
              }`}
              style={{ backgroundColor: config.bg }}
              onClick={() => updateElement(element.id, { color: key }, true)}
              title={config.name}
            />
          ))}
        </div>

        {/* Tags Button & Character Count */}
        <div className="flex items-center gap-2 font-mono tabular-nums opacity-60 text-[10px]">
          {showTagInput ? (
            <input
              type="text"
              autoFocus
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              onBlur={() => setShowTagInput(false)}
              placeholder="Tag name + Enter"
              className="w-24 px-1 py-0.5 bg-white border border-slate-300 rounded text-[10px] focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowTagInput(true)}
              className="hover:opacity-100 cursor-pointer flex items-center gap-0.5"
              title="Add hashtag"
            >
              <Tag className="w-2.5 h-2.5" />
            </button>
          )}

          <span>{charCount}/1000</span>
        </div>
      </div>
    </div>
  );
};
