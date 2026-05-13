import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThumbsUp, Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CommentSection({ postId, currentUser, onCommentCountChange }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    const data = await base44.entities.Comment.filter({ post_id: postId }, '-created_date');
    setComments(data);
    setLoading(false);
    onCommentCountChange?.(data.length);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSending(true);

    const comment = await base44.entities.Comment.create({
      post_id: postId,
      content: newComment.trim(),
      author_name: currentUser.full_name,
      author_email: currentUser.email,
      author_avatar: currentUser.avatar || '',
      likes: [],
      like_count: 0,
    });

    setComments(prev => [comment, ...prev]);
    setNewComment('');
    setSending(false);
    onCommentCountChange?.(comments.length + 1);

    // Update post comment count
    await base44.entities.Post.update(postId, { comment_count: comments.length + 1 });
  };

  const userInitials = currentUser?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <div className="px-4 pb-4 border-t border-border">
      {/* Write comment */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={currentUser?.avatar} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{userInitials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-1">
          <Input
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="bg-secondary border-0 rounded-full text-sm h-8"
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary flex-shrink-0"
            disabled={sending || !newComment.trim()}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {comments.map(comment => {
            const ci = comment.author_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
            return (
              <div key={comment.id} className="flex gap-2">
                <Link to={`/profile/${comment.author_email}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.author_avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{ci}</AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <div className="bg-secondary rounded-2xl px-3 py-2">
                    <Link to={`/profile/${comment.author_email}`} className="font-semibold text-xs hover:underline">
                      {comment.author_name}
                    </Link>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                  <div className="flex gap-3 px-3 mt-1 text-xs text-muted-foreground">
                    <span>{formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}</span>
                    <button className="font-semibold hover:underline">Like</button>
                    <button className="font-semibold hover:underline">Reply</button>
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