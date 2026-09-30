import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { Button } from './button';
import { cn } from '../../lib/utils';
import { useCanvas } from '../../context/CanvasContext';

export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { theme, setTheme } = useCanvas();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleQuickTheme = () => {
    // Quick toggle between light and dark
    if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {compact ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleQuickTheme}
          onContextMenu={(e) => {
            e.preventDefault();
            setIsOpen(!isOpen);
          }}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          title={`Switch Theme (Current: ${theme}). Right-click for options.`}
        >
          {theme === 'dark' ? (
            <Moon className="h-4 w-4 transition-transform rotate-0 scale-100 text-blue-400" />
          ) : (
            <Sun className="h-4 w-4 transition-transform rotate-0 scale-100 text-amber-500" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      ) : (
        <div className="flex items-center rounded-lg border border-border bg-muted/60 p-0.5 text-muted-foreground">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all cursor-pointer',
              theme === 'light'
                ? 'bg-background text-foreground shadow-xs'
                : 'hover:text-foreground hover:bg-background/40'
            )}
            title="Light (White) theme"
          >
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden sm:inline">Light</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all cursor-pointer',
              theme === 'dark'
                ? 'bg-background text-foreground shadow-xs'
                : 'hover:text-foreground hover:bg-background/40'
            )}
            title="Dark theme"
          >
            <Moon className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">Dark</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={cn(
              'hidden sm:flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all cursor-pointer',
              theme === 'system'
                ? 'bg-background text-foreground shadow-xs'
                : 'hover:text-foreground hover:bg-background/40'
            )}
            title="System theme"
          >
            <Laptop className="h-3.5 w-3.5" />
            <span>Auto</span>
          </button>
        </div>
      )}

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-36 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          <button
            type="button"
            onClick={() => {
              setTheme('light');
              setIsOpen(false);
            }}
            className={cn(
              'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer',
              theme === 'light' && 'bg-accent/60 font-semibold'
            )}
          >
            <span className="flex items-center gap-2">
              <Sun className="h-3.5 w-3.5 text-amber-500" />
              White / Light
            </span>
            {theme === 'light' && <Check className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setTheme('dark');
              setIsOpen(false);
            }}
            className={cn(
              'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer',
              theme === 'dark' && 'bg-accent/60 font-semibold'
            )}
          >
            <span className="flex items-center gap-2">
              <Moon className="h-3.5 w-3.5 text-blue-400" />
              Dark
            </span>
            {theme === 'dark' && <Check className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setTheme('system');
              setIsOpen(false);
            }}
            className={cn(
              'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer',
              theme === 'system' && 'bg-accent/60 font-semibold'
            )}
          >
            <span className="flex items-center gap-2">
              <Laptop className="h-3.5 w-3.5 text-muted-foreground" />
              System
            </span>
            {theme === 'system' && <Check className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
};
