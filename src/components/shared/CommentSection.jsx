import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Send, Loader2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CommentSection({ postId, currentUser, onCountChange }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    base44.entities.Comment.filter({ post_id: postId }, 'created_date', 30)
      .then(data => { setComments(data); onCountChange?.(data.length); })
      .finally(() => setLoading(false));
  }, [postId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim() || !currentUser) return;
    setSending(true);
    const c = await base44.entities.Comment.create({
      post_id: postId, content: text.trim(),
      author_name: currentUser.full_name, author_email: currentUser.email,
      author_avatar: currentUser.avatar_url || '', likes: [], like_count: 0,
    });
    const newComments = [...comments, c];
    setComments(newComments);
    setText('');
    setSending(false);
    onCountChange?.(newComments.length);
    await base44.entities.Post.update(postId, { comment_count: newComments.length });
  };

  const deleteComment = async (commentId) => {
    await base44.entities.Comment.delete(commentId);
    const updated = comments.filter(c => c.id !== commentId);
    setComments(updated);
    onCountChange?.(updated.length);
    await base44.entities.Post.update(postId, { comment_count: updated.length });
  };

  const ui = currentUser?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <div className="px-4 pb-4 border-t border-border">
      <form onSubmit={submit} className="flex gap-2 pt-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={currentUser?.avatar_url} />
          <AvatarFallback className="gradient-brand text-white text-xs">{ui}</AvatarFallback>
        </Avatar>
        <Input value={text} onChange={e => setText(e.target.value)} placeholder="Write a comment..." className="bg-muted border-0 rounded-full text-sm h-8 flex-1" />
        <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-primary" disabled={sending || !text.trim()}>
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
      {loading ? (
        <div className="flex justify-center py-3"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="mt-3 space-y-3">
          {comments.map(c => {
            const ci = c.author_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
            const isOwn = c.author_email === currentUser?.email;
            return (
              <div key={c.id} className="flex gap-2 group">
                <Link to={`/profile/${c.author_email}`} className="flex-shrink-0">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={c.author_avatar} />
                    <AvatarFallback className="gradient-brand text-white text-[10px]">{ci}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <div className="bg-muted rounded-2xl px-3 py-1.5">
                    <Link to={`/profile/${c.author_email}`} className="font-semibold text-xs hover:underline">{c.author_name}</Link>
                    <p className="text-sm">{c.content}</p>
                  </div>
                  <div className="flex items-center gap-3 px-2 mt-0.5">
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_date), { addSuffix: true })}
                    </p>
                    {isOwn && (
                      <button onClick={() => deleteComment(c.id)} className="text-[10px] text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}