import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Plus, Search, Trash2, Archive, Edit2, Check, X, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function TutorSidebar({ conversations, activeId, onSelect, onNew, onDelete, onArchive, onRename, loading }) {
  const [search, setSearch] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState('');

  const filtered = (conversations || []).filter(c =>
    !c.archived && (!search || c.title?.toLowerCase().includes(search.toLowerCase()))
  );

  const startRename = (conv) => {
    setRenamingId(conv.id);
    setRenameVal(conv.title || 'New Conversation');
  };

  const submitRename = async (conv) => {
    if (renameVal.trim()) await onRename(conv.id, renameVal.trim());
    setRenamingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-muted/30 border-r border-border">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <Button onClick={onNew} size="sm" className="w-full gradient-brand border-0 gap-2 h-9">
          <Plus className="w-4 h-4" />New Conversation
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chats..."
            className="pl-8 h-8 text-xs bg-background" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" />
            <p className="text-xs text-muted-foreground">{search ? 'No results' : 'No conversations yet'}</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map(conv => (
              <motion.div key={conv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div
                  className={`group flex items-center gap-2 px-2 py-2 rounded-xl cursor-pointer transition-colors ${
                    activeId === conv.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                  }`}
                  onClick={() => onSelect(conv)}
                >
                  <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${activeId === conv.id ? 'text-primary' : 'text-muted-foreground'}`} />

                  <div className="flex-1 min-w-0">
                    {renamingId === conv.id ? (
                      <input
                        autoFocus
                        value={renameVal}
                        onChange={e => setRenameVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') submitRename(conv); if (e.key === 'Escape') setRenamingId(null); }}
                        onClick={e => e.stopPropagation()}
                        className="w-full text-xs bg-background border border-primary rounded px-1 py-0.5 outline-none"
                      />
                    ) : (
                      <>
                        <p className="text-xs font-medium truncate">{conv.title || 'New Conversation'}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {conv.messages?.length || 0} msg{conv.messages?.length !== 1 ? 's' : ''}
                          {conv.last_message_at && ` · ${formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}`}
                        </p>
                      </>
                    )}
                  </div>

                  {renamingId === conv.id ? (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); submitRename(conv); }} className="text-emerald-500 hover:text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setRenamingId(null); }} className="text-muted-foreground hover:text-foreground">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="hidden group-hover:flex gap-1 flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); startRename(conv); }}
                        className="p-1 rounded hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); onArchive(conv.id); }}
                        className="p-1 rounded hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground">
                        <Archive className="w-3 h-3" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); onDelete(conv.id); }}
                        className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}