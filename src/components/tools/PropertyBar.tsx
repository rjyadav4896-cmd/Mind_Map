import React from 'react';
import {
  Trash2,
  Copy,
  Lock,
  Unlock,
  BringToFront,
  SendToBack,
  Spline,
  CornerDownRight,
  Minus,
  LayoutGrid,
  Columns3,
} from 'lucide-react';
import { useCanvas } from '../../context/CanvasContext';
import {
  STICKY_PALETTES,
  SHAPE_FILL_PRESETS,
  CONNECTOR_COLORS,
} from '../../utils/colors';
import { Separator } from '../ui/separator';
import { cn } from '../../lib/utils';

export const PropertyBar: React.FC = () => {
  const {
    elements,
    connections,
    selectedElementIds,
    selectedConnectionId,
    updateElement,
    updateConnection,
    duplicateSelected,
    deleteSelected,
    bringToFront,
    sendToBack,
    organizeSelectionIntoKanban,
    organizeSelectionIntoTable,
    isPresentationMode,
  } = useCanvas();

  if (isPresentationMode) return null;

  // Case 1: Wire is selected
  if (selectedConnectionId) {
    const selectedWire = connections.find((c) => c.id === selectedConnectionId);
    if (!selectedWire) return null;

    return (
      <div className="fixed top-18 sm:top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-1.5 bg-popover/95 backdrop-blur-md rounded-xl border border-border shadow-xl text-popover-foreground pointer-events-auto transition-colors">
        <span className="text-[11px] font-semibold text-muted-foreground mr-1">Connector</span>

        {/* Connector Styles */}
        <div className="flex items-center gap-0.5 bg-muted/80 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => updateConnection(selectedWire.id, { style: 'curved' })}
            className={cn(
              'p-1.5 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors',
              selectedWire.style === 'curved'
                ? 'bg-background text-primary shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Smooth Bezier Curve"
          >
            <Spline className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Curved</span>
          </button>

          <button
            type="button"
            onClick={() => updateConnection(selectedWire.id, { style: 'orthogonal' })}
            className={cn(
              'p-1.5 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors',
              selectedWire.style === 'orthogonal'
                ? 'bg-background text-primary shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Orthogonal Elbow Routing"
          >
            <CornerDownRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Elbow</span>
          </button>

          <button
            type="button"
            onClick={() => updateConnection(selectedWire.id, { style: 'straight' })}
            className={cn(
              'p-1.5 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors',
              selectedWire.style === 'straight'
                ? 'bg-background text-primary shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Straight Line"
          >
            <Minus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Straight</span>
          </button>
        </div>

        {/* Color swatches */}
        <div className="flex items-center gap-1 ml-1">
          {CONNECTOR_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={cn(
                'w-4 h-4 rounded-full border cursor-pointer transition-transform',
                selectedWire.color === c.color
                  ? 'scale-125 ring-2 ring-primary ring-offset-1 ring-offset-popover'
                  : 'hover:scale-110 opacity-70 hover:opacity-100'
              )}
              style={{ backgroundColor: c.color }}
              onClick={() => updateConnection(selectedWire.id, { color: c.color })}
              title={c.id}
            />
          ))}
        </div>

        {/* Dashed toggle */}
        <button
          type="button"
          onClick={() => updateConnection(selectedWire.id, { dashed: !selectedWire.dashed })}
          className={cn(
            'px-2 py-1 text-xs rounded-md border cursor-pointer font-medium transition-colors',
            selectedWire.dashed
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          {selectedWire.dashed ? 'Dashed' : 'Solid'}
        </button>

        <Separator orientation="vertical" className="h-4 mx-0.5" />

        {/* Delete wire */}
        <button
          type="button"
          onClick={deleteSelected}
          className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          title="Delete wire"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Case 2: Elements are selected
  if (selectedElementIds.length === 0) return null;

  const firstSelected = elements.find((e) => e.id === selectedElementIds[0]);
  if (!firstSelected) return null;

  return (
    <div className="fixed top-18 sm:top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 bg-popover/95 backdrop-blur-md rounded-xl border border-border shadow-xl text-popover-foreground pointer-events-auto transition-colors">
      {/* If Sticky Note */}
      {firstSelected.type === 'sticky' && (
        <div className="flex items-center gap-1.5">
          {Object.entries(STICKY_PALETTES).map(([key, config]) => (
            <button
              key={key}
              type="button"
              className={cn(
                'w-4 h-4 rounded-full border cursor-pointer transition-transform',
                firstSelected.color === key
                  ? 'scale-125 ring-2 ring-primary ring-offset-1 ring-offset-popover shadow-xs'
                  : 'hover:scale-110 opacity-70 hover:opacity-100'
              )}
              style={{ backgroundColor: config.bg }}
              onClick={() => updateElement(firstSelected.id, { color: key }, true)}
              title={config.name}
            />
          ))}

          {/* Text Size */}
          <div className="flex items-center gap-0.5 ml-2 bg-muted/80 p-0.5 rounded-md">
            {[12, 14, 16, 20].map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => updateElement(firstSelected.id, { fontSize: sz })}
                className={cn(
                  'px-1.5 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors',
                  (firstSelected.fontSize || 14) === sz
                    ? 'bg-background shadow-xs font-semibold text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* If Shape */}
      {firstSelected.type === 'shape' && (
        <div className="flex items-center gap-1.5">
          {/* Fill color swatches */}
          {SHAPE_FILL_PRESETS.slice(0, 6).map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={cn(
                'w-4 h-4 rounded-full border cursor-pointer transition-transform',
                firstSelected.fill === preset.fill
                  ? 'scale-125 ring-2 ring-primary ring-offset-1 ring-offset-popover shadow-xs'
                  : 'hover:scale-110 opacity-70 hover:opacity-100'
              )}
              style={{ backgroundColor: preset.fill, borderColor: preset.stroke }}
              onClick={() =>
                updateElement(
                  firstSelected.id,
                  { fill: preset.fill, stroke: preset.stroke, textColor: preset.text },
                  true
                )
              }
              title={preset.name}
            />
          ))}

          {/* Stroke Style */}
          <div className="flex items-center gap-0.5 bg-muted/80 p-0.5 rounded-md ml-2">
            {(['solid', 'dashed', 'dotted'] as const).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => updateElement(firstSelected.id, { strokeStyle: style })}
                className={cn(
                  'px-1.5 py-0.5 rounded text-[11px] capitalize cursor-pointer transition-colors',
                  (firstSelected.strokeStyle || 'solid') === style
                    ? 'bg-background shadow-xs font-semibold text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Multi-selection Smart Organization Actions */}
      {selectedElementIds.length >= 2 && (
        <>
          <Separator orientation="vertical" className="h-4 mx-0.5" />
          <div className="flex items-center gap-1 bg-primary/10 p-0.5 rounded-lg border border-primary/20">
            <button
              type="button"
              onClick={organizeSelectionIntoKanban}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
              title="Convert selected items into structured Kanban grid"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>To Kanban</span>
            </button>
            <button
              type="button"
              onClick={organizeSelectionIntoTable}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
              title="Convert selected items into nested matrix table"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>To Table</span>
            </button>
          </div>
        </>
      )}

      <Separator orientation="vertical" className="h-4 mx-0.5" />

      {/* Layering & Actions */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={bringToFront}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Bring to front"
        >
          <BringToFront className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={sendToBack}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Send to back"
        >
          <SendToBack className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() =>
            updateElement(firstSelected.id, { locked: !firstSelected.locked }, true)
          }
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title={firstSelected.locked ? 'Unlock element' : 'Lock element'}
        >
          {firstSelected.locked ? (
            <Lock className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <Unlock className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          type="button"
          onClick={duplicateSelected}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Duplicate (Cmd+D)"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={deleteSelected}
          className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"
          title="Delete (Backspace)"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
