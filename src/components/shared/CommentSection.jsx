import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
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
    if (!text.trim()) return;
    setSending(true);
    const c = await base44.entities.Comment.create({
      post_id: postId, content: text.trim(),
      author_name: currentUser.full_name, author_email: currentUser.email,
      author_avatar: currentUser.avatar_url || '', likes: [], like_count: 0,
    });
    setComments(p => [...p, c]);
    setText('');
    setSending(false);
    onCountChange?.(comments.length + 1);
    await base44.entities.Post.update(postId, { comment_count: comments.length + 1 });
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
            return (
              <div key={c.id} className="flex gap-2">
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarImage src={c.author_avatar} />
                  <AvatarFallback className="gradient-brand text-white text-[10px]">{ci}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="bg-muted rounded-2xl px-3 py-1.5">
                    <p className="font-semibold text-xs">{c.author_name}</p>
                    <p className="text-sm">{c.content}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground px-2 mt-0.5">
                    {formatDistanceToNow(new Date(c.created_date), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}