import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Bookmark, Copy, Repeat2, Flag, BadgeCheck, Building2, GraduationCap, BookOpen, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import CommentSection from './CommentSection';
import ImageLightbox from '@/components/feed/ImageLightbox';
import { toast } from 'sonner';

const ROLE_BADGE = {
  teacher: { label: 'Lecturer', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  student: { label: 'Student', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  admin:   { label: 'Admin',   color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  parent:  { label: 'Parent',  color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
};

const VERIFY_COLOR = {
  teacher: 'text-violet-400',
  admin:   'text-amber-400',
  student: 'text-sky-400',
};

export default function PostCard({ post, currentUser, onDelete, onHashtagClick }) {
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(post.likes?.includes(currentUser?.email));
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [shareCount, setShareCount] = useState(post.share_count || 0);
  const [saved, setSaved] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [heartAnim, setHeartAnim] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showRepost, setShowRepost] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reporting, setReporting] = useState(false);
  const [repostComment, setRepostComment] = useState('');
  const [reposting, setReposting] = useState(false);
  const lastTap = useRef(0);

  const isOwner = post.author_email === currentUser?.email;
  const initials = post.author_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  const role = post.author_role || 'student';
  const roleBadge = ROLE_BADGE[role];
  const verifyColor = VERIFY_COLOR[role] || 'text-sky-400';

  // Fetch profile for school/dept/level
  const [profile, setProfile] = useState(null);
  const profileFetched = useRef(false);
  useEffect(() => {
    if (profileFetched.current) return;
    profileFetched.current = true;
    base44.entities.UserProfile.filter({ user_email: post.author_email })
      .then(res => { if (res?.[0]) setProfile(res[0]); })
      .catch(() => {});
  }, [post.author_email]);

  // Load saved state
  useEffect(() => {
    if (!currentUser?.email) return;
    base44.entities.SavedPost.filter({ user_email: currentUser.email, post_id: post.id })
      .then(res => setSaved(res.length > 0))
      .catch(() => {});
  }, [currentUser?.email, post.id]);

  const doLike = async () => {
    if (!currentUser) return;
    const currentLikes = post.likes || [];
    const wasLiked = liked;
    const newLikes = wasLiked ? currentLikes.filter(e => e !== currentUser.email) : [...currentLikes, currentUser.email];
    setLiked(!wasLiked);
    setLikeCount(newLikes.length);
    post.likes = newLikes;
    await base44.entities.Post.update(post.id, { likes: newLikes, like_count: newLikes.length });
    if (!wasLiked && post.author_email && post.author_email !== currentUser.email) {
      base44.entities.Notification.create({
        user_email: post.author_email, from_name: currentUser.full_name,
        from_avatar: currentUser.avatar_url || '', from_email: currentUser.email,
        type: 'like', content: 'liked your post',
        entity_type: 'post', entity_id: post.id, is_read: false,
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
      content, image_url: post.image_url || '',
      author_name: currentUser.full_name, author_email: currentUser.email,
      author_avatar: currentUser.avatar_url || '', author_role: currentUser.role || 'student',
      likes: [], like_count: 0, comment_count: 0, share_count: 0,
    });
    const newCount = shareCount + 1;
    setShareCount(newCount);
    await base44.entities.Post.update(post.id, { share_count: newCount });
    toast.success('Reposted to your feed!');
    setRepostComment(''); setShowRepost(false); setReposting(false);
  };

  const handleContentTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) { setHeartAnim(true); setTimeout(() => setHeartAnim(false), 900); doLike(); }
    }
    lastTap.current = now;
  };

  const doReport = async () => {
    if (!reportReason || !currentUser) return;
    setReporting(true);
    await base44.entities.PostReport.create({
      post_id: post.id, post_content: post.content?.slice(0, 500) || '',
      post_author_email: post.author_email, post_author_name: post.author_name,
      reporter_email: currentUser.email, reporter_name: currentUser.full_name,
      reason: reportReason, details: reportDetails, status: 'pending',
    });
    toast.success('Report submitted. Our team will review it.');
    setShowReport(false); setReportReason(''); setReportDetails(''); setReporting(false);
  };

  const doSave = async () => {
    if (!currentUser) return;
    if (saved) {
      const existing = await base44.entities.SavedPost.filter({ user_email: currentUser.email, post_id: post.id });
      if (existing.length) await base44.entities.SavedPost.delete(existing[0].id);
      setSaved(false);
      toast.success('Removed from saved');
    } else {
      await base44.entities.SavedPost.create({
        user_email: currentUser.email, post_id: post.id,
        post_content: post.content?.slice(0, 200) || '',
        post_author_name: post.author_name, post_author_avatar: post.author_avatar,
        post_image_url: post.image_url || '',
      });
      setSaved(true);
      toast.success('Post saved!');
    }
  };

  const doEditSave = async () => {
    if (!editContent.trim()) return;
    await base44.entities.Post.update(post.id, { content: editContent.trim() });
    post.content = editContent.trim();
    setEditing(false);
    toast.success('Post updated!');
  };

  const doShare = async (method) => {
    const url = `${window.location.origin}/`;
    const text = `${post.content?.slice(0, 100)}...`;
    if (method === 'native' && navigator.share) await navigator.share({ title: post.author_name, text, url }).catch(() => {});
    else if (method === 'copy') { await navigator.clipboard.writeText(url); toast.success('Link copied!'); }
    else if (method === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    else if (method === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    else if (method === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    const newCount = shareCount + 1;
    setShareCount(newCount); setShowShare(false);
    await base44.entities.Post.update(post.id, { share_count: newCount });
  };

  const renderContent = (text) => {
    if (!text) return null;
    return text.split(/(#\w+)/g).map((part, i) => {
      if (part.startsWith('#')) {
        const tag = part.slice(1);
        return <button key={i} className="text-violet-400 font-semibold hover:underline" onClick={() => onHashtagClick?.(tag)}>{part}</button>;
      }
      return part;
    });
  };

  return (
    <div className="bg-card lg:rounded-2xl lg:border lg:border-white/5 lg:shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3.5 pb-2 flex items-start gap-3">
        <Link to={`/profile/${post.author_email}`} className="flex-shrink-0 mt-0.5">
          <Avatar className="h-10 w-10 ring-2 ring-violet-500/30">
            <AvatarImage src={post.author_avatar} />
            <AvatarFallback className="gradient-brand text-white font-bold text-sm">{initials}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              {/* Name + verify + badge */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link to={`/profile/${post.author_email}`} className="font-bold text-sm hover:underline leading-tight">
                  {post.author_name}
                </Link>
                <BadgeCheck className={`w-3.5 h-3.5 flex-shrink-0 ${verifyColor}`} />
                {roleBadge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${roleBadge.color} leading-none`}>
                    {roleBadge.label}
                  </span>
                )}
              </div>

              {/* School · Dept · Level · Time */}
              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                {profile?.school_name && (
                  <>
                    <Building2 className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[90px]">{profile.school_name}</span>
                    <span className="text-muted-foreground/40 text-[10px]">·</span>
                  </>
                )}
                {profile?.department && (
                  <>
                    <BookOpen className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">{profile.department}</span>
                    <span className="text-muted-foreground/40 text-[10px]">·</span>
                  </>
                )}
                {profile?.grade_level && (
                  <>
                    <GraduationCap className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-[11px] text-muted-foreground">{profile.grade_level}</span>
                    <span className="text-muted-foreground/40 text-[10px]">·</span>
                  </>
                )}
                <span className="text-[11px] text-muted-foreground/70">
                  {formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}
                </span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full flex-shrink-0 -mr-1 text-muted-foreground">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                {isOwner ? (
                  <>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => { setEditContent(post.content || ''); setEditing(true); }}>
                      <Pencil className="w-4 h-4 mr-2 text-primary" />Edit Post
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive cursor-pointer"
                      onClick={() => { base44.entities.Post.delete(post.id); onDelete?.(post.id); }}>
                      <Trash2 className="w-4 h-4 mr-2" />Delete
                    </DropdownMenuItem>
                  </>
                ) : currentUser && (
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setShowReport(true)}>
                    <Flag className="w-4 h-4 mr-2 text-amber-500" />Report Post
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="text-base font-bold flex items-center gap-2"><Pencil className="w-4 h-4 text-primary" />Edit Post</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-1">
            <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={5} className="resize-none rounded-xl text-sm" />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setEditing(false)}>Cancel</Button>
              <Button className="flex-1 gradient-brand border-0 rounded-xl" onClick={doEditSave}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

      {/* Content */}
      <div onClick={handleContentTap} className="relative select-none">
        {post.content && (
          <p className="px-4 pb-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap text-foreground/90 pl-[3.75rem]">
            {renderContent(post.content)}
          </p>
        )}

        {post.image_url && (
          <div className="relative mx-4 mb-2.5 rounded-2xl overflow-hidden cursor-zoom-in" onClick={e => { e.stopPropagation(); setLightboxSrc(post.image_url); }}>
            <img src={post.image_url} alt="Post" className="w-full max-h-[400px] object-cover" />
            <AnimatePresence>
              {heartAnim && (
                <motion.div initial={{ scale: 0.3, opacity: 1 }} animate={{ scale: 1.4, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {post.video_url && (
          <div className="relative mx-4 mb-2.5 rounded-2xl overflow-hidden bg-black">
            <video src={post.video_url} controls className="w-full max-h-72 object-contain" />
          </div>
        )}

        {!post.image_url && !post.video_url && (
          <AnimatePresence>
            {heartAnim && (
              <motion.div initial={{ scale: 0.3, opacity: 1 }} animate={{ scale: 1.8, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Heart className="w-16 h-16 text-rose-500 fill-rose-500 drop-shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="pl-[3.75rem] pr-4 pb-1.5 flex flex-wrap gap-1">
          {post.tags.map(tag => (
            <button key={tag} className="text-xs text-violet-400 font-medium hover:text-violet-300 transition-colors" onClick={() => onHashtagClick?.(tag)}>
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center pl-[3.25rem] pr-2 py-1.5 border-b border-white/5">
        <button onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-sky-400 transition-colors p-2 rounded-full hover:bg-sky-400/8 group">
          <MessageCircle className="w-[17px] h-[17px] group-hover:scale-110 transition-transform" />
          {commentCount > 0 && <span className="text-xs tabular-nums">{commentCount}</span>}
        </button>

        <button onClick={() => setShowRepost(true)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-emerald-400 transition-colors p-2 rounded-full hover:bg-emerald-400/8 group">
          <Repeat2 className="w-[17px] h-[17px] group-hover:scale-110 transition-transform" />
          {shareCount > 0 && <span className="text-xs tabular-nums">{shareCount}</span>}
        </button>

        <button onClick={doLike}
          className={`flex items-center gap-1.5 transition-colors p-2 rounded-full group ${liked ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-500 hover:bg-rose-500/8'}`}>
          <Heart className={`w-[17px] h-[17px] group-hover:scale-110 transition-transform ${liked ? 'fill-rose-500 scale-110' : ''}`} />
          {likeCount > 0 && <span className="text-xs tabular-nums">{likeCount}</span>}
        </button>

        <button onClick={() => setShowShare(true)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-violet-400 transition-colors p-2 rounded-full hover:bg-violet-400/8 group ml-auto">
          <Share2 className="w-[17px] h-[17px] group-hover:scale-110 transition-transform" />
        </button>

        <button onClick={doSave}
          className={`flex items-center gap-1.5 transition-colors p-2 rounded-full group ${saved ? 'text-violet-400' : 'text-muted-foreground hover:text-violet-400 hover:bg-violet-400/8'}`}>
          <Bookmark className={`w-[17px] h-[17px] group-hover:scale-110 transition-transform ${saved ? 'fill-violet-400' : ''}`} />
        </button>
      </div>

      {showComments && (
        <div className="border-t border-white/5">
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
            <div className="rounded-xl bg-muted/60 border p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground text-xs mb-1">{post.author_name}</p>
              <p className="line-clamp-3">{post.content}</p>
            </div>
            <Textarea placeholder="Add a comment (optional)..." value={repostComment} onChange={e => setRepostComment(e.target.value)}
              rows={3} className="resize-none bg-muted border-0 rounded-xl text-sm" />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowRepost(false)}>Cancel</Button>
              <Button className="flex-1 gradient-brand border-0 rounded-xl gap-2" onClick={doRepost} disabled={reposting}>
                {reposting ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Repeat2 className="w-4 h-4" />}
                Repost
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Flag className="w-4 h-4 text-amber-500" />Report Post
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            <div className="rounded-xl bg-muted/60 border p-3 text-sm text-muted-foreground">
              <p className="line-clamp-2">{post.content}</p>
            </div>
            <Select value={reportReason} onValueChange={setReportReason}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a reason *" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="hate_speech">Hate Speech</SelectItem>
                <SelectItem value="misinformation">Misinformation</SelectItem>
                <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                <SelectItem value="violence">Violence</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="Additional details (optional)..." value={reportDetails} onChange={e => setReportDetails(e.target.value)}
              rows={2} className="resize-none rounded-xl text-sm" />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowReport(false)}>Cancel</Button>
              <Button className="flex-1 bg-amber-500 hover:bg-amber-600 border-0 rounded-xl gap-2 text-white" onClick={doReport} disabled={reporting || !reportReason}>
                {reporting ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Flag className="w-4 h-4" />}
                Submit Report
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
              { label: 'Copy Link', icon: Copy, method: 'copy', color: 'bg-slate-500/10' },
              { label: 'WhatsApp', icon: Share2, method: 'whatsapp', color: 'bg-green-500/10' },
              { label: 'Twitter/X', icon: Share2, method: 'twitter', color: 'bg-sky-500/10' },
              { label: 'Facebook', icon: Share2, method: 'facebook', color: 'bg-blue-500/10' },
            ].map(s => (
              <button key={s.method} onClick={() => doShare(s.method)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl hover:opacity-80 transition-opacity ${s.color}`}>
                <s.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{s.label}</span>
              </button>
            ))}
            {navigator.share && (
              <button onClick={() => doShare('native')} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-violet-500/10 hover:opacity-80 transition-opacity">
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