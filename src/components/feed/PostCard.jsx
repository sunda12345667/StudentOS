import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Globe, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import CommentSection from './CommentSection';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function PostCard({ post, currentUser, onDelete, onUpdate }) {
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(post.likes?.includes(currentUser?.email));
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);

  const initials = post.author_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  const isOwner = post.author_email === currentUser?.email;

  const handleLike = async () => {
    const currentLikes = post.likes || [];
    let newLikes;
    if (liked) {
      newLikes = currentLikes.filter(e => e !== currentUser.email);
      setLikeCount(prev => Math.max(0, prev - 1));
    } else {
      newLikes = [...currentLikes, currentUser.email];
      setLikeCount(prev => prev + 1);
    }
    setLiked(!liked);
    post.likes = newLikes;
    await base44.entities.Post.update(post.id, { likes: newLikes, like_count: newLikes.length });
  };

  const handleDelete = async () => {
    await base44.entities.Post.delete(post.id);
    onDelete?.(post.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 pb-2 flex items-start justify-between">
          <div className="flex gap-3">
            <Link to={`/profile/${post.author_email}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author_avatar} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">{initials}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link to={`/profile/${post.author_email}`} className="font-semibold text-sm hover:underline">
                {post.author_name}
              </Link>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>{formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}</span>
                <span>·</span>
                <Globe className="w-3 h-3" />
              </div>
            </div>
          </div>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDelete} className="text-destructive cursor-pointer">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Content */}
        {post.content && (
          <p className="px-4 pb-3 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        )}

        {/* Image */}
        {post.image_url && (
          <div className="w-full bg-secondary">
            <img src={post.image_url} alt="Post" className="w-full max-h-[500px] object-cover" />
          </div>
        )}

        {/* Stats */}
        {(likeCount > 0 || commentCount > 0) && (
          <div className="px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
            {likeCount > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <ThumbsUp className="w-3 h-3 text-primary-foreground" />
                </div>
                <span>{likeCount}</span>
              </div>
            )}
            {commentCount > 0 && (
              <button onClick={() => setShowComments(true)} className="hover:underline">
                {commentCount} comment{commentCount !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mx-4 py-1 border-t border-border flex">
          <Button
            variant="ghost"
            className={`flex-1 gap-2 text-sm font-medium ${liked ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={handleLike}
          >
            <ThumbsUp className={`w-5 h-5 ${liked ? 'fill-primary' : ''}`} />
            Like
          </Button>
          <Button
            variant="ghost"
            className="flex-1 gap-2 text-sm font-medium text-muted-foreground"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="w-5 h-5" />
            Comment
          </Button>
          <Button
            variant="ghost"
            className="flex-1 gap-2 text-sm font-medium text-muted-foreground"
          >
            <Share2 className="w-5 h-5" />
            Share
          </Button>
        </div>

        {/* Comments */}
        {showComments && (
          <CommentSection
            postId={post.id}
            currentUser={currentUser}
            onCommentCountChange={(count) => setCommentCount(count)}
          />
        )}
      </Card>
    </motion.div>
  );
}