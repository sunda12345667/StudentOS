import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Globe, Trash2, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import CommentSection from './CommentSection';
import { toast } from 'sonner';

const ROLE_COLORS = {
  teacher: 'bg-purple-100 text-purple-700',
  student: 'bg-blue-100 text-blue-700',
  admin: 'bg-red-100 text-red-700',
  parent: 'bg-green-100 text-green-700',
};

export default function PostCard({ post, currentUser, onDelete, onHashtagClick }) {
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(post.likes?.includes(currentUser?.email));
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [shareCount, setShareCount] = useState(post.share_count || 0);
  const isOwner = post.author_email === currentUser?.email;
  const initials = post.author_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  const handleLike = async () => {
    const currentLikes = post.likes || [];
    const newLikes = liked
      ? currentLikes.filter(e => e !== currentUser.email)
      : [...currentLikes, currentUser.email];
    setLiked(!liked);
    setLikeCount(newLikes.length);
    post.likes = newLikes;
    await base44.entities.Post.update(post.id, { likes: newLikes, like_count: newLikes.length });
  };

  const handleShare = async () => {
    const newCount = shareCount + 1;
    setShareCount(newCount);
    await base44.entities.Post.update(post.id, { share_count: newCount });
    if (navigator.share) {
      navigator.share({ title: post.author_name, text: post.content, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => toast.success('Link copied!')).catch(() => {});
    }
  };

  // Extract hashtags from content for clickable links
  const renderContent = (text) => {
    if (!text) return null;
    const parts = text.split(/(#\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        const tag = part.slice(1);
        return (
          <button
            key={i}
            className="text-primary font-semibold hover:underline"
            onClick={() => onHashtagClick?.(tag)}
          >
            {part}
          </button>
        );
      }
      return part;
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="p-4 pb-2 flex items-start justify-between">
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
                  <Badge className={`text-[10px] px-1.5 py-0 ${ROLE_COLORS[post.author_role] || ''}`}>
                    {post.author_role}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Globe className="w-3 h-3" />
                <span>{formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><MoreHorizontal className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => { base44.entities.Post.delete(post.id); onDelete?.(post.id); }}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Content */}
        {post.content && (
          <p className="px-4 pb-3 text-sm leading-relaxed whitespace-pre-wrap">
            {renderContent(post.content)}
          </p>
        )}

        {/* Image */}
        {post.image_url && (
          <img src={post.image_url} alt="Post" className="w-full max-h-96 object-cover" />
        )}

        {/* Video */}
        {post.video_url && (
          <div className="relative bg-black">
            <video src={post.video_url} controls className="w-full max-h-72 object-contain" />
          </div>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="px-4 pt-2 flex flex-wrap gap-1">
            {post.tags.map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => onHashtagClick?.(tag)}
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Stats */}
        {(likeCount > 0 || commentCount > 0 || shareCount > 0) && (
          <div className="px-4 py-2 flex justify-between text-xs text-muted-foreground border-t border-border/50">
            <div className="flex items-center gap-3">
              {likeCount > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <ThumbsUp className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span>{likeCount}</span>
                </div>
              )}
              {shareCount > 0 && <span>{shareCount} shares</span>}
            </div>
            {commentCount > 0 && (
              <button onClick={() => setShowComments(true)} className="hover:underline">{commentCount} comments</button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex border-t border-border">
          <Button
            variant="ghost"
            className={`flex-1 gap-2 text-sm font-medium py-2.5 transition-colors ${liked ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
            onClick={handleLike}
          >
            <ThumbsUp className={`w-4 h-4 transition-all ${liked ? 'fill-primary scale-110' : ''}`} />
            <span className="hidden sm:inline">Like</span>
            {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
          </Button>
          <Button
            variant="ghost"
            className="flex-1 gap-2 text-sm font-medium text-muted-foreground hover:text-primary py-2.5"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Comment</span>
            {commentCount > 0 && <span className="text-xs">{commentCount}</span>}
          </Button>
          <Button
            variant="ghost"
            className="flex-1 gap-2 text-sm font-medium text-muted-foreground hover:text-primary py-2.5"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>

        {showComments && (
          <CommentSection postId={post.id} currentUser={currentUser} onCountChange={c => setCommentCount(c)} />
        )}
      </Card>
    </motion.div>
  );
}