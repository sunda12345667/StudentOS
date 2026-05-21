import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Send, Loader2, X, MessageCircle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ReelComments({ reel, user, onClose, onCountChange }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!reel?.id) return;
    base44.entities.Comment.filter({ reel_id: reel.id }, '-created_date', 50)
      .then(setComments)
      .finally(() => setLoading(false));
    setTimeout(() => inputRef.current?.focus(), 400);
  }, [reel?.id]);



  const submit = async (e) => {
    e?.preventDefault();
    if (!text.trim() || sending || !user) return;
    setSending(true);
    const c = await base44.entities.Comment.create({
      reel_id: reel.id,
      content: text.trim(),
      author_name: user.full_name,
      author_email: user.email,
      author_avatar: user.avatar_url || '',
    });
    setComments(prev => [c, ...prev]);
    setText('');
    setSending(false);
    // Update reel comment count
    const newCount = (reel.comment_count || 0) + 1;
    await base44.entities.Reel.update(reel.id, { comment_count: newCount }).catch(() => {});
    onCountChange?.(newCount);
    // Notify reel author
    if (reel.author_email && reel.author_email !== user.email) {
      base44.entities.Notification.create({
        user_email: reel.author_email,
        from_name: user.full_name,
        from_avatar: user.avatar_url || '',
        from_email: user.email,
        type: 'comment',
        content: `commented on your reel: "${text.trim().slice(0, 60)}"`,
        entity_type: 'reel',
        entity_id: reel.id,
        is_read: false,
      }).catch(() => {});
    }
  };

  const deleteComment = async (cmt) => {
    await base44.entities.Comment.delete(cmt.id).catch(() => {});
    setComments(prev => prev.filter(c => c.id !== cmt.id));
    const newCount = Math.max(0, (reel.comment_count || 0) - 1);
    await base44.entities.Reel.update(reel.id, { comment_count: newCount }).catch(() => {});
    onCountChange?.(newCount);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Handle bar */}
      <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
        <div className="w-10 h-1 bg-border rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border flex-shrink-0">
        <h3 className="font-bold text-base">
          Comments <span className="text-muted-foreground text-sm font-normal">({comments.length})</span>
        </h3>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Comments */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No comments yet</p>
            <p className="text-xs">Be the first!</p>
          </div>
        ) : comments.map(c => {
          const ini = c.author_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
          const isOwn = c.author_email === user?.email;
          return (
            <div key={c.id} className="flex gap-3 group">
              <Link to={`/profile/${c.author_email}`} className="flex-shrink-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={c.author_avatar} />
                  <AvatarFallback className="gradient-brand text-white text-[10px]">{ini}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/profile/${c.author_email}`} className="text-xs font-bold hover:underline">{c.author_name}</Link>
                <p className="text-sm mt-0.5 leading-relaxed break-words">{c.content}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(c.created_date), { addSuffix: true })}
                </p>
              </div>
              {isOwn && (
                <button onClick={() => deleteComment(c)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Input */}
      {user && (
        <div
          className="flex-shrink-0 border-t border-border bg-card"
          style={{ padding: '12px 12px', paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
        >
          <form onSubmit={submit} className="flex items-center gap-2">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="gradient-brand text-white text-xs">
                {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <Input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-muted border-0 rounded-full text-sm h-9"
            />
            <Button type="submit" size="icon" className="gradient-brand border-0 rounded-full h-9 w-9 flex-shrink-0" disabled={!text.trim() || sending}>
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}