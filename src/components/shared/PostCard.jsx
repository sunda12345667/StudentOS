import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Share2, MoreHorizontal, Globe, Trash2, Bookmark, Copy, Repeat2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import CommentSection from './CommentSection';
import { toast } from 'sonner';

const ROLE_COLORS = {
  teacher:  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  student:  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  admin:    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  parent:   'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

export default function PostCard({ post, currentUser, onDelete, onHashtagClick }) {
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(post.likes?.includes(currentUser?.email));
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [shareCount, setShareCount] = useState(post.share_count || 0);
  const [saved, setSaved] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showRepost, setShowRepost] = useState(false);
  const [repostComment, setRepostComment] = useState('');
  const [reposting, setReposting] = useState(false);
  const lastTap = useRef(0);
  const isOwner = post.author_email === currentUser?.email;
  const initials = post.author_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  const doLike = async () => {
    if (!currentUser) return;
    const currentLikes = post.likes || [];
    const wasLiked = liked;
    const newLikes = wasLiked
      ? currentLikes.filter(e => e !== currentUser.email)
      : [...currentLikes, currentUser.email];
    setLiked(!wasLiked);
    setLikeCount(newLikes.length);
    post.likes = newLikes;
    await base44.entities.Post.update(post.id, { likes: newLikes, like_count: newLikes.length });
    // Notify post author when liked (not for own posts)
    if (!wasLiked && post.author_email && post.author_email !== currentUser.email) {
      base44.entities.Notification.create({
        user_email: post.author_email,
        from_name: currentUser.full_name,
        from_avatar: currentUser.avatar_url || '',
        from_email: currentUser.email,
        type: 'like',
        content: 'liked your post',
        entity_type: 'post',
        entity_id: post.id,
        is_read: false,
      }).catch(() => {});
    }
  };

  const doRepost = async () => {
    if (!currentUser) return;
    setReposting(true);
    const content = repostComment
      ? `${repostComment}\n\n📢 Reposted from @${post.author_name}:\n"${post.content?.slice(0, 200)}${post.content?.length > 200 ? '...' : ''}"`
      : `📢 Reposted from @${post.author_name}:\n"${post.content?.slice(0, 200)}${post.content?.length > 200 ? '...' : ''}"`;
    await base44.entities.Post.create({
      content,
      image_url: post.image_url || '',
      author_name: currentUser.full_name,
      author_email: currentUser.email,
      author_avatar: currentUser.avatar_url || '',
      author_role: currentUser.role || 'student',
      likes: [],
      like_count: 0,
      comment_count: 0,
      share_count: 0,
    });
    const newCount = shareCount + 1;
    setShareCount(newCount);
    await base44.entities.Post.update(post.id, { share_count: newCount });
    toast.success('Reposted to your feed!');
    setRepostComment('');
    setShowRepost(false);
    setReposting(false);
  };

  // Double-tap to like
  const handleContentTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) {
        setHeartAnim(true);
        setTimeout(() => setHeartAnim(false), 900);
        doLike();
      }
    }
    lastTap.current = now;
  };

  const handleShare = () => setShowShare(true);

  const doShare = async (method) => {
    const url = `${window.location.origin}/`;
    const text = `${post.content?.slice(0, 100)}...`;
    if (method === 'native' && navigator.share) {
      await navigator.share({ title: post.author_name, text, url }).catch(() => {});
    } else if (method === 'copy') {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    } else if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else if (method === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (method === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    }
    const newCount = shareCount + 1;
    setShareCount(newCount);
    setShowShare(false);
    await base44.entities.Post.update(post.id, { share_count: newCount });
  };

  const renderContent = (text) => {
    if (!text) return null;
    return text.split(/(#\w+)/g).map((part, i) => {
      if (part.startsWith('#')) {
        const tag = part.slice(1);
        return (
          <button key={i} className="text-primary font-semibold hover:underline" onClick={() => onHashtagClick?.(tag)}>
            {part}
          </button>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-card lg:rounded-2xl lg:border lg:shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3.5 pb-2 flex items-start justify-between">
        <div className="flex gap-3">
          <Link to={`/profile/${post.author_email}`}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author_avatar} />
              <AvatarFallback className="gradient-brand text-white font-bold text-sm">{initials}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/profile/${post.author_email}`} className="font-semibold text-sm hover:underline">
                {post.author_name}
              </Link>
              {post.author_role && (
                <Badge className={`text-[10px] px-1.5 py-0 border-0 ${ROLE_COLORS[post.author_role] || ''}`}>
                  {post.author_role}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Globe className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem className="text-destructive cursor-pointer"
                  onClick={() => { base44.entities.Post.delete(post.id); onDelete?.(post.id); }}>
                  <Trash2 className="w-4 h-4 mr-2" />Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content — tappable for double-tap like */}
      <div onClick={handleContentTap} className="relative select-none">
        {post.content && (
          <p className="px-4 pb-3 text-sm leading-relaxed whitespace-pre-wrap">
            {renderContent(post.content)}
          </p>
        )}

        {/* Image */}
        {post.image_url && (
          <div className="relative">
            <img src={post.image_url} alt="Post" className="w-full max-h-[420px] object-cover" />
            {/* Double-tap heart burst */}
            <AnimatePresence>
              {heartAnim && (
                <motion.div
                  initial={{ scale: 0.3, opacity: 1 }}
                  animate={{ scale: 1.4, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Video */}
        {post.video_url && (
          <div className="relative bg-black">
            <video src={post.video_url} controls className="w-full max-h-72 object-contain" />
          </div>
        )}

        {/* Double tap heart on text-only posts */}
        {!post.image_url && !post.video_url && (
          <AnimatePresence>
            {heartAnim && (
              <motion.div
                initial={{ scale: 0.3, opacity: 1 }}
                animate={{ scale: 1.8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Heart className="w-16 h-16 text-rose-500 fill-rose-500 drop-shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="px-4 pt-1.5 pb-1 flex flex-wrap gap-1">
          {post.tags.map(tag => (
            <button
              key={tag}
              className="text-xs text-primary font-medium hover:underline"
              onClick={() => onHashtagClick?.(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Stats bar */}
      {(likeCount > 0 || commentCount > 0 || shareCount > 0) && (
        <div className="px-4 py-1.5 flex justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {likeCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center">
                  <Heart className="w-2.5 h-2.5 text-white fill-white" />
                </span>
                {likeCount}
              </span>
            )}
            {shareCount > 0 && <span>{shareCount} shares</span>}
          </div>
          {commentCount > 0 && (
            <button onClick={() => setShowComments(true)} className="hover:underline">
              {commentCount} comments
            </button>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center px-1 py-0.5 border-t border-border/60">
        <Button
          variant="ghost"
          className={`flex-1 gap-2 h-10 text-sm font-medium transition-all ${liked ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-500'}`}
          onClick={doLike}
        >
          <Heart className={`w-4 h-4 transition-all duration-200 ${liked ? 'fill-rose-500 scale-110' : ''}`} />
          <span className="text-xs">{liked ? 'Liked' : 'Like'}{likeCount > 0 ? ` · ${likeCount}` : ''}</span>
        </Button>

        <Button
          variant="ghost"
          className="flex-1 gap-2 h-10 text-sm font-medium text-muted-foreground hover:text-primary"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs">Comment{commentCount > 0 ? ` · ${commentCount}` : ''}</span>
        </Button>

        <Button
          variant="ghost"
          className="flex-1 gap-2 h-10 text-sm font-medium text-muted-foreground hover:text-primary"
          onClick={() => setShowRepost(true)}
        >
          <Repeat2 className="w-4 h-4" />
          <span className="text-xs">Repost{shareCount > 0 ? ` · ${shareCount}` : ''}</span>
        </Button>

        <Button
          variant="ghost"
          className="flex-1 gap-2 h-10 text-sm font-medium text-muted-foreground hover:text-primary"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4" />
          <span className="text-xs">Share</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={`h-10 w-10 text-muted-foreground ${saved ? 'text-primary' : ''}`}
          onClick={() => setSaved(s => !s)}
        >
          <Bookmark className={`w-4 h-4 ${saved ? 'fill-primary' : ''}`} />
        </Button>
      </div>

      {showComments && (
        <div className="border-t border-border/60">
          <CommentSection postId={post.id} currentUser={currentUser} onCountChange={c => setCommentCount(c)} />
        </div>
      )}

      {/* Repost Modal */}
      <Dialog open={showRepost} onOpenChange={setShowRepost}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Repeat2 className="w-4 h-4 text-primary" />Repost to Your Feed
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            {/* Original post preview */}
            <div className="rounded-xl bg-muted/60 border p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground text-xs mb-1">{post.author_name}</p>
              <p className="line-clamp-3">{post.content}</p>
            </div>
            <Textarea
              placeholder="Add a comment (optional)..."
              value={repostComment}
              onChange={e => setRepostComment(e.target.value)}
              rows={3}
              className="resize-none bg-muted border-0 rounded-xl text-sm"
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowRepost(false)}>Cancel</Button>
              <Button
                className="flex-1 gradient-brand border-0 rounded-xl gap-2"
                onClick={doRepost}
                disabled={reposting}
              >
                {reposting ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Repeat2 className="w-4 h-4" />}
                Repost
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Share Post</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {[
              { label: 'Copy Link', icon: Copy, method: 'copy', color: 'bg-slate-100 dark:bg-slate-800' },
              { label: 'WhatsApp', icon: Share2, method: 'whatsapp', color: 'bg-green-100 dark:bg-green-900/30' },
              { label: 'Twitter/X', icon: Share2, method: 'twitter', color: 'bg-sky-100 dark:bg-sky-900/30' },
              { label: 'Facebook', icon: Share2, method: 'facebook', color: 'bg-blue-100 dark:bg-blue-900/30' },
            ].map(s => (
              <button key={s.method} onClick={() => doShare(s.method)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl hover:opacity-80 transition-opacity ${s.color}`}>
                <s.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{s.label}</span>
              </button>
            ))}
            {navigator.share && (
              <button onClick={() => doShare('native')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 hover:opacity-80 transition-opacity">
                <Share2 className="w-5 h-5" />
                <span className="text-xs font-medium">More</span>
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}