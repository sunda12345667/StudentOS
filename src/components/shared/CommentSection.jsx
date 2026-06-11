import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Send, Loader2, CornerDownRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function CommentItem({ comment, currentUser, onDelete, onReply, postId }) {
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const ci = comment.author_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  const isOwn = comment.author_email === currentUser?.email;

  const loadReplies = async () => {
    const data = await base44.entities.Comment.filter({ parent_comment_id: comment.id }, 'created_date', 20);
    setReplies(data);
    setShowReplies(true);
  };

  const submitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !currentUser) return;
    setSendingReply(true);
    const r = await base44.entities.Comment.create({
      post_id: postId, parent_comment_id: comment.id,
      content: replyText.trim(),
      author_name: currentUser.full_name, author_email: currentUser.email,
      author_avatar: currentUser.avatar_url || '', likes: [], like_count: 0,
    });
    setReplies(prev => [...prev, r]);
    setReplyText(''); setReplying(false); setSendingReply(false);
    setShowReplies(true);
    // Notify comment author
    if (comment.author_email && comment.author_email !== currentUser.email) {
      base44.entities.Notification.create({
        user_email: comment.author_email, from_name: currentUser.full_name,
        from_avatar: currentUser.avatar_url || '', from_email: currentUser.email,
        type: 'comment', content: 'replied to your comment',
        entity_type: 'post', entity_id: postId, is_read: false,
      }).catch(() => {});
    }
  };

  return (
    <div className="flex gap-2 group">
      <Link to={`/profile/${comment.author_email}`} className="flex-shrink-0">
        <Avatar className="h-7 w-7">
          <AvatarImage src={comment.author_avatar} />
          <AvatarFallback className="gradient-brand text-white text-[10px]">{ci}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="bg-muted rounded-2xl px-3 py-1.5">
          <Link to={`/profile/${comment.author_email}`} className="font-semibold text-xs hover:underline">{comment.author_name}</Link>
          <p className="text-sm">{comment.content}</p>
        </div>
        <div className="flex items-center gap-3 px-2 mt-0.5">
          <p className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
          </p>
          <button onClick={() => setReplying(r => !r)} className="text-[10px] text-primary font-medium hover:underline">
            Reply
          </button>
          {isOwn && (
            <button onClick={() => onDelete(comment.id)} className="text-[10px] text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100">
              Delete
            </button>
          )}
        </div>

        {/* Reply input */}
        {replying && (
          <form onSubmit={submitReply} className="flex gap-2 mt-2">
            <Input value={replyText} onChange={e => setReplyText(e.target.value)}
              placeholder={`Reply to ${comment.author_name}...`}
              className="bg-muted border-0 rounded-full text-sm h-7 flex-1 text-xs" autoFocus />
            <Button type="submit" variant="ghost" size="icon" className="h-7 w-7 text-primary" disabled={sendingReply || !replyText.trim()}>
              {sendingReply ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            </Button>
          </form>
        )}

        {/* View replies */}
        {!showReplies && (
          <button onClick={loadReplies} className="text-[10px] text-primary font-medium mt-1 px-2 flex items-center gap-1 hover:underline">
            <CornerDownRight className="w-2.5 h-2.5" />View replies
          </button>
        )}
        {showReplies && replies.length > 0 && (
          <div className="mt-2 space-y-2 pl-2 border-l-2 border-border">
            {replies.map(r => {
              const ri = r.author_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
              return (
                <div key={r.id} className="flex gap-2">
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage src={r.author_avatar} />
                    <AvatarFallback className="gradient-brand text-white text-[9px]">{ri}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="bg-muted rounded-xl px-2.5 py-1">
                      <Link to={`/profile/${r.author_email}`} className="font-semibold text-[11px] hover:underline">{r.author_name}</Link>
                      <p className="text-xs">{r.content}</p>
                    </div>
                    <p className="text-[9px] text-muted-foreground px-1 mt-0.5">
                      {formatDistanceToNow(new Date(r.created_date), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentSection({ postId, currentUser, onCountChange }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Only load top-level comments (no parent)
    base44.entities.Comment.filter({ post_id: postId }, 'created_date', 30)
      .then(data => {
        const topLevel = data.filter(c => !c.parent_comment_id);
        setComments(topLevel);
        onCountChange?.(data.length);
      })
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
    setText(''); setSending(false);
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
          {comments.map(c => (
            <CommentItem key={c.id} comment={c} currentUser={currentUser} onDelete={deleteComment} postId={postId} />
          ))}
        </div>
      )}
    </div>
  );
}