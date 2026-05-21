import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Share2, Plus, Upload, Play, Volume2, VolumeX, Loader2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import ReelComments from '@/components/reels/ReelComments';
import ReelShare from '@/components/reels/ReelShare';

export default function Reels() {
  const { user } = useOutletContext();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', subject: '' });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    base44.entities.Reel.list('-created_date', 30).then(setReels).finally(() => setLoading(false));
  }, []);

  const handleUpload = async () => {
    if (!videoFile) return;
    setUploading(true);
    let video_url = '', thumbnail_url = '';
    const [vRes] = await Promise.all([
      base44.integrations.Core.UploadFile({ file: videoFile }),
      thumbFile ? base44.integrations.Core.UploadFile({ file: thumbFile }).then(r => { thumbnail_url = r.file_url; }) : Promise.resolve(),
    ]);
    video_url = vRes.file_url;
    await base44.entities.Reel.create({
      ...form, video_url, thumbnail_url,
      author_email: user.email, author_name: user.full_name,
      author_avatar: user.avatar_url || '',
      author_role: 'student', likes: [], like_count: 0, comment_count: 0, share_count: 0, view_count: 0,
      tags: form.subject ? [form.subject] : [],
    });
    const updated = await base44.entities.Reel.list('-created_date', 30);
    setReels(updated);
    setOpen(false);
    setForm({ title: '', description: '', subject: '' });
    setVideoFile(null); setThumbFile(null);
    setUploading(false);
  };

  const handleLike = async (reel) => {
    const likes = reel.likes || [];
    const liked = likes.includes(user?.email);
    const newLikes = liked ? likes.filter(e => e !== user.email) : [...likes, user.email];
    await base44.entities.Reel.update(reel.id, { likes: newLikes, like_count: newLikes.length });
    setReels(prev => prev.map(r => r.id === reel.id ? { ...r, likes: newLikes, like_count: newLikes.length } : r));
  };

  const updateReel = (id, patch) => {
    setReels(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black">Educational Reels</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Short-form learning videos</p>
        </div>
        <Button className="gradient-brand border-0 gap-2 h-9 sm:h-10 text-sm" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Upload Reel</span>
          <span className="sm:hidden">Upload</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : reels.length === 0 ? (
        <Card className="p-12 text-center">
          <Play className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-xl font-bold text-muted-foreground">No reels yet</p>
          <p className="text-sm text-muted-foreground mt-1">Be the first to share an educational video!</p>
          <Button className="mt-4 gradient-brand border-0" onClick={() => setOpen(true)}>Upload First Reel</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {reels.map((reel, i) => (
            <ReelCard
              key={reel.id}
              reel={reel}
              user={user}
              onLike={handleLike}
              index={i}
              onUpdate={(patch) => updateReel(reel.id, patch)}
            />
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader><DialogTitle>Upload Educational Reel</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Video File *</Label>
              <div
                className="mt-1 border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => document.getElementById('reel-video').click()}
              >
                {videoFile ? (
                  <p className="text-sm font-medium text-primary">{videoFile.name}</p>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload video</p>
                    <p className="text-xs text-muted-foreground mt-1">MP4, MOV, WebM</p>
                  </>
                )}
                <input id="reel-video" type="file" accept="video/*" className="hidden" onChange={e => setVideoFile(e.target.files[0])} />
              </div>
            </div>
            <div>
              <Label>Thumbnail (optional)</Label>
              <input type="file" accept="image/*" className="mt-1 block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-primary/10 file:text-primary"
                onChange={e => setThumbFile(e.target.files[0])} />
            </div>
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. How to solve quadratic equations" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
            <div><Label>Subject</Label><Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Mathematics" /></div>
            <Button onClick={handleUpload} disabled={uploading || !videoFile || !form.title} className="w-full gradient-brand border-0">
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Uploading...</> : 'Publish Reel'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReelCard({ reel, user, onLike, index, onUpdate }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const liked = reel.likes?.includes(user?.email);
  const initials = reel.author_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
        <Card className="overflow-hidden hover:shadow-xl transition-all group">
          <div className="relative aspect-[9/16] bg-black cursor-pointer" onClick={togglePlay}>
            {reel.thumbnail_url && !playing && (
              <img src={reel.thumbnail_url} alt="" className="w-full h-full object-cover" />
            )}
            <video
              ref={videoRef}
              src={reel.video_url}
              muted={muted}
              loop
              playsInline
              className={`w-full h-full object-cover ${!playing && reel.thumbnail_url ? 'hidden' : ''}`}
              onEnded={() => setPlaying(false)}
            />
            {/* Play overlay */}
            {!playing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                  <Play className="w-6 h-6 text-black ml-0.5" />
                </div>
              </div>
            )}
            {/* Mute */}
            <button
              onClick={e => { e.stopPropagation(); setMuted(m => !m); }}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 sm:transition-opacity"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            {/* Subject badge */}
            {reel.subject && (
              <Badge className="absolute top-3 left-3 bg-primary/80 text-white border-0 text-[10px]">
                <BookOpen className="w-2.5 h-2.5 mr-1" />{reel.subject}
              </Badge>
            )}
            {/* Side actions */}
            <div className="absolute right-3 bottom-3 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
              {/* Like */}
              <button onClick={() => onLike(reel)} className="flex flex-col items-center gap-0.5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${liked ? 'bg-red-500' : 'bg-black/50'}`}>
                  <Heart className={`w-5 h-5 ${liked ? 'text-white fill-white' : 'text-white'}`} />
                </div>
                <span className="text-white text-[10px] font-semibold drop-shadow">{reel.like_count || 0}</span>
              </button>
              {/* Comment */}
              <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-0.5">
                <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center shadow-lg hover:bg-black/70 transition-colors">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-white text-[10px] font-semibold drop-shadow">{reel.comment_count || 0}</span>
              </button>
              {/* Share */}
              <button onClick={() => setShowShare(true)} className="flex flex-col items-center gap-0.5">
                <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center shadow-lg hover:bg-black/70 transition-colors">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-white text-[10px] font-semibold drop-shadow">{reel.share_count || 0}</span>
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Link to={`/profile/${reel.author_email}`}>
                <Avatar className="h-7 w-7">
                  <AvatarImage src={reel.author_avatar} />
                  <AvatarFallback className="gradient-brand text-white text-[10px]">{initials}</AvatarFallback>
                </Avatar>
              </Link>
              <Link to={`/profile/${reel.author_email}`} className="text-sm font-semibold hover:underline truncate">{reel.author_name}</Link>
              <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">
                {formatDistanceToNow(new Date(reel.created_date), { addSuffix: true })}
              </span>
            </div>
            {reel.title && <p className="text-sm font-medium line-clamp-2">{reel.title}</p>}
            {reel.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {reel.tags.map(t => <Badge key={t} variant="secondary" className="text-[10px]">#{t}</Badge>)}
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Comments bottom sheet */}
      <AnimatePresence>
        {showComments && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowComments(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl"
              style={{ maxHeight: '75vh' }}
            >
              <div className="flex flex-col" style={{ maxHeight: '75vh' }}>
                <ReelComments
                  reel={reel}
                  user={user}
                  onClose={() => setShowComments(false)}
                  onCountChange={(count) => onUpdate({ comment_count: count })}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Share bottom sheet */}
      <AnimatePresence>
        {showShare && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowShare(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl"
            >
              <ReelShare
                reel={reel}
                user={user}
                onClose={() => setShowShare(false)}
                onCountChange={(count) => onUpdate({ share_count: count })}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}