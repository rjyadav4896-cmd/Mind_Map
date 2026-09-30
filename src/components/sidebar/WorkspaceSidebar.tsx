import React, { useState } from 'react';
import {
  Folder,
  FolderPlus,
  Plus,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Search,
  Layout,
  PanelLeftClose,
  PanelLeft,
  Clock,
  Sparkles,
  FileText,
  X,
} from 'lucide-react';
import { useCanvas } from '../../context/CanvasContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ThemeToggle } from '../ui/theme-toggle';
import { cn } from '../../lib/utils';

interface WorkspaceSidebarProps {
  onOpenTemplates: () => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({ onOpenTemplates }) => {
  const {
    workspaces,
    boards,
    activeBoardId,
    switchBoard,
    createBoard,
    renameBoard,
    deleteBoard,
    duplicateBoard,
    moveBoardToWorkspace,
    createWorkspace,
    renameWorkspace,
    deleteWorkspace,
    isSidebarOpen,
    setIsSidebarOpen,
    isPresentationMode,
  } = useCanvas();

  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingBoardName, setEditingBoardName] = useState('');
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [editingWorkspaceName, setEditingWorkspaceName] = useState('');
  const [activeMenuBoardId, setActiveMenuBoardId] = useState<string | null>(null);
  const [activeMenuWorkspaceId, setActiveMenuWorkspaceId] = useState<string | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3B82F6');

  if (isPresentationMode) return null;

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleStartRenameBoard = (bId: string, currentName: string) => {
    setEditingBoardId(bId);
    setEditingBoardName(currentName);
    setActiveMenuBoardId(null);
  };

  const handleSaveRenameBoard = (bId: string) => {
    if (editingBoardName.trim()) {
      renameBoard(bId, editingBoardName.trim());
    }
    setEditingBoardId(null);
  };

  const handleStartRenameWorkspace = (wsId: string, currentName: string) => {
    setEditingWorkspaceId(wsId);
    setEditingWorkspaceName(currentName);
    setActiveMenuWorkspaceId(null);
  };

  const handleSaveRenameWorkspace = (wsId: string) => {
    if (editingWorkspaceName.trim()) {
      renameWorkspace(wsId, editingWorkspaceName.trim());
    }
    setEditingWorkspaceId(null);
  };

  const handleCreateNewFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      createWorkspace(newFolderName.trim(), newFolderColor);
      setNewFolderName('');
      setShowNewFolderModal(false);
    }
  };

  const filteredBoards = boards.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRelativeTime = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Collapsible Panel */}
      <aside
        className={cn(
          'fixed top-14 bottom-0 left-0 z-40 bg-card text-card-foreground border-r border-border transition-all duration-300 flex flex-col overflow-hidden shadow-lg md:shadow-none',
          isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full md:w-0'
        )}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Workspaces & Boards
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setShowNewFolderModal(true)}
              title="Create new workspace folder"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setIsSidebarOpen(false)}
              title="Close sidebar (Cmd+\)"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Quick Search */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search boards..."
              className="h-8 pl-8 text-xs bg-muted/50 border-input"
            />
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4 select-none">
          {/* Workspaces Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Folders</span>
              <button
                type="button"
                onClick={() => setShowNewFolderModal(true)}
                className="hover:text-primary transition-colors cursor-pointer text-xs"
                title="Add Folder"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-1">
              {workspaces.map((ws) => {
                const wsBoards = filteredBoards.filter((b) => b.workspaceId === ws.id);
                const isCollapsed = collapsedFolders[ws.id] ?? false;

                return (
                  <div key={ws.id} className="rounded-lg overflow-hidden">
                    {/* Folder Header */}
                    <div className="group flex items-center justify-between px-2 py-1.5 hover:bg-muted/80 rounded-md transition-colors">
                      <div
                        className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                        onClick={() => toggleFolder(ws.id)}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        )}
                        <Folder
                          className="w-4 h-4 shrink-0"
                          style={{ color: ws.color || '#3B82F6' }}
                        />

                        {editingWorkspaceId === ws.id ? (
                          <input
                            autoFocus
                            type="text"
                            value={editingWorkspaceName}
                            onChange={(e) => setEditingWorkspaceName(e.target.value)}
                            onBlur={() => handleSaveRenameWorkspace(ws.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRenameWorkspace(ws.id);
                              if (e.key === 'Escape') setEditingWorkspaceId(null);
                            }}
                            className="text-xs font-semibold px-1 py-0.5 border border-primary rounded bg-background text-foreground w-full"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="text-xs font-medium text-foreground truncate">
                            {ws.name}
                          </span>
                        )}

                        <span className="text-[10px] text-muted-foreground font-mono">
                          {wsBoards.length}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                        <button
                          type="button"
                          onClick={() => createBoard(ws.id)}
                          className="p-1 text-muted-foreground hover:text-foreground rounded cursor-pointer"
                          title="New Board in this folder"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuWorkspaceId(
                                activeMenuWorkspaceId === ws.id ? null : ws.id
                              )
                            }
                            className="p-1 text-muted-foreground hover:text-foreground rounded cursor-pointer"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </button>

                          {activeMenuWorkspaceId === ws.id && (
                            <div className="absolute right-0 top-full mt-1 z-50 w-32 bg-popover text-popover-foreground border border-border shadow-xl rounded-lg py-1 text-xs">
                              <button
                                type="button"
                                onClick={() => handleStartRenameWorkspace(ws.id, ws.name)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-left cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Rename</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  deleteWorkspace(ws.id);
                                  setActiveMenuWorkspaceId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-destructive/10 text-destructive text-left cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Folder Board Children */}
                    {!isCollapsed && (
                      <div className="pl-6 pr-1 py-0.5 space-y-0.5">
                        {wsBoards.map((b) => {
                          const isActive = b.id === activeBoardId;
                          return (
                            <div
                              key={b.id}
                              onClick={() => switchBoard(b.id)}
                              className={cn(
                                'group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors',
                                isActive
                                  ? 'bg-primary/10 text-primary font-semibold'
                                  : 'hover:bg-muted text-foreground'
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <FileText className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                {editingBoardId === b.id ? (
                                  <input
                                    autoFocus
                                    type="text"
                                    value={editingBoardName}
                                    onChange={(e) => setEditingBoardName(e.target.value)}
                                    onBlur={() => handleSaveRenameBoard(b.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveRenameBoard(b.id);
                                      if (e.key === 'Escape') setEditingBoardId(null);
                                    }}
                                    className="text-xs font-semibold px-1 py-0.5 border border-primary rounded bg-background text-foreground w-full"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <span className="text-xs truncate">{b.name}</span>
                                )}
                              </div>

                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuBoardId(
                                        activeMenuBoardId === b.id ? null : b.id
                                      );
                                    }}
                                    className="p-1 text-muted-foreground hover:text-foreground rounded cursor-pointer"
                                  >
                                    <MoreVertical className="w-3 h-3" />
                                  </button>

                                  {activeMenuBoardId === b.id && (
                                    <div
                                      className="absolute right-0 top-full mt-1 z-50 w-36 bg-popover text-popover-foreground border border-border shadow-xl rounded-lg py-1 text-xs"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => handleStartRenameBoard(b.id, b.name)}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-left cursor-pointer"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                        <span>Rename</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          duplicateBoard(b.id);
                                          setActiveMenuBoardId(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-left cursor-pointer"
                                      >
                                        <Copy className="w-3 h-3" />
                                        <span>Duplicate</span>
                                      </button>
                                      <Separator className="my-1" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          deleteBoard(b.id);
                                          setActiveMenuBoardId(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-destructive/10 text-destructive text-left cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {wsBoards.length === 0 && (
                          <div className="px-3 py-1 text-[11px] text-muted-foreground italic">
                            No boards yet
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Root Boards (Unassigned) */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span>All Boards</span>
              <button
                type="button"
                onClick={() => createBoard()}
                className="hover:text-primary transition-colors cursor-pointer text-xs"
                title="Create new whiteboard"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-0.5">
              {filteredBoards
                .filter((b) => !b.workspaceId)
                .map((b) => {
                  const isActive = b.id === activeBoardId;
                  return (
                    <div
                      key={b.id}
                      onClick={() => switchBoard(b.id)}
                      className={cn(
                        'group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'hover:bg-muted text-foreground'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="w-4 h-4 shrink-0 opacity-70" />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs truncate">{b.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {getRelativeTime(b.updatedAt)} · {b.elementCount} items
                          </span>
                        </div>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBoard(b.id);
                          }}
                          className="p-1 text-muted-foreground hover:text-destructive rounded cursor-pointer"
                          title="Delete board"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer with Theme Toggle */}
        <div className="p-3 border-t border-border bg-card/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-muted-foreground font-medium">Local Saved</span>
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle compact />
            <Button
              variant="ghost"
              size="xs"
              onClick={onOpenTemplates}
              className="text-primary hover:bg-primary/10 font-semibold"
            >
              <Sparkles className="w-3 h-3" />
              <span>Presets</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Floating Toggle Button when Sidebar is closed */}
      {!isSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-16 left-4 z-30 px-2.5 py-1.5 bg-background/95 dark:bg-zinc-900/95 backdrop-blur-md border border-border text-foreground hover:border-primary/50 rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5 select-none"
          title="Open Workspaces & Boards (Cmd+\)"
        >
          <PanelLeft className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline text-xs font-semibold">Boards</span>
        </button>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-xs">
          <div className="bg-popover text-popover-foreground rounded-2xl border border-border shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">New Workspace Folder</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground"
                onClick={() => setShowNewFolderModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateNewFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Folder Name
                </label>
                <Input
                  autoFocus
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Product Discovery, Sprint 14..."
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Folder Color
                </label>
                <div className="flex items-center gap-2">
                  {['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#64748B'].map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewFolderColor(color)}
                        className={cn(
                          'w-6 h-6 rounded-full border cursor-pointer transition-transform',
                          newFolderColor === color
                            ? 'scale-125 ring-2 ring-primary ring-offset-2 ring-offset-popover'
                            : 'hover:scale-110'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewFolderModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newFolderName.trim()}
                >
                  Create Folder
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
