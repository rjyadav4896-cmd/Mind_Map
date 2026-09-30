import React from 'react';
import { X, Sparkles, LayoutTemplate, ArrowRight } from 'lucide-react';
import { TEMPLATES } from '../../utils/templates';
import { useCanvas } from '../../context/CanvasContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({ isOpen, onClose }) => {
  const { loadTemplate } = useCanvas();

  if (!isOpen) return null;

  const handleApply = (templateId: string) => {
    loadTemplate(templateId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-xs select-none">
      <div className="bg-popover text-popover-foreground rounded-2xl border border-border shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Whiteboard Templates</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Jumpstart your workshop or design sprint with battle-tested whiteboarding layouts.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="group p-4 rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between bg-card text-card-foreground"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Badge variant="secondary" className="text-[10px] font-semibold text-primary">
                      {tmpl.category}
                    </Badge>
                    <span className="text-[11px] font-mono tabular-nums text-muted-foreground">
                      {tmpl.elements.length} nodes
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors mb-1.5">
                    {tmpl.name}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-4">
                    {tmpl.description}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApply(tmpl.id)}
                  className="w-full justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-transparent transition-all"
                >
                  <span>Load Template</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
