import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Upload, Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ReelPlayer from '@/components/reels/ReelPlayer';

export default function Reels() {
  const { user } = useOutletContext();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', subject: '' });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const containerRef = useRef(null);
  const observersRef = useRef([]);

  useEffect(() => {
    base44.entities.Reel.list('-created_date', 30)
      .then(data => setReels(data.filter(r => !r.is_hidden)))
      .finally(() => setLoading(false));
  }, []);

  // ── IntersectionObserver: activate the reel that is ≥75% visible ─────────
  const itemRefs = useRef([]);

  const setItemRef = useCallback((el, index) => {
    itemRefs.current[index] = el;
  }, []);

  useEffect(() => {
    // Clean up old observers
    observersRef.current.forEach(o => o.disconnect());
    observersRef.current = [];

    const visibleMap = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const idx = Number(entry.target.dataset.index);
          visibleMap.set(idx, entry.intersectionRatio);
        });
        // Find the index with the highest visibility
        let best = -1;
        let bestRatio = 0;
        visibleMap.forEach((ratio, idx) => {
          if (ratio > bestRatio) { bestRatio = ratio; best = idx; }
        });
        if (best >= 0 && bestRatio >= 0.75) {
          setActiveIndex(best);
        }
      },
      { threshold: [0, 0.5, 0.75, 1.0] }
    );

    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    observersRef.current.push(observer);
    return () => observer.disconnect();
  }, [reels]);

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

  const handleUpload = async () => {
    if (!videoFile) return;
    setUploading(true);

    const check = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a content moderator for an educational student platform. Evaluate this reel submission:
Title: "${form.title}"
Description: "${form.description}"
Subject: "${form.subject}"

Is this appropriate educational content? Reject if it contains: gambling, adult content, political propaganda, hate speech, violence, spam, fraud, misleading info, celebrity gossip, or entertainment unrelated to learning.
Respond with JSON only.`,
      response_json_schema: {
        type: 'object',
        properties: {
          approved: { type: 'boolean' },
          reason: { type: 'string' }
        }
      }
    });

    if (!check?.approved) {
      toast.error(`Content rejected: ${check?.reason || 'Does not meet educational standards.'}`);
      setUploading(false);
      return;
    }

    let video_url = '', thumbnail_url = '';
    const [vRes] = await Promise.all([
      base44.integrations.Core.UploadFile({ file: videoFile }),
      thumbFile
        ? base44.integrations.Core.UploadFile({ file: thumbFile }).then(r => { thumbnail_url = r.file_url; })
        : Promise.resolve(),
    ]);
    video_url = vRes.file_url;

    await base44.entities.Reel.create({
      ...form, video_url, thumbnail_url,
      author_email: user.email, author_name: user.full_name,
      author_avatar: user.avatar_url || '',
      author_role: 'student', likes: [], like_count: 0, comment_count: 0, share_count: 0, view_count: 0,
      tags: form.subject ? [form.subject] : [],
      moderation_status: 'approved',
    });

    const updated = await base44.entities.Reel.list('-created_date', 30);
    setReels(updated.filter(r => !r.is_hidden));
    setOpen(false);
    setForm({ title: '', description: '', subject: '' });
    setVideoFile(null);
    setThumbFile(null);
    setUploading(false);
    toast.success('Reel published!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-4 text-center px-6">
        <Play className="w-16 h-16 text-muted-foreground opacity-30" />
        <p className="text-xl font-bold text-muted-foreground">No reels yet</p>
        <p className="text-sm text-muted-foreground">Be the first to share an educational video!</p>
        <Button className="gradient-brand border-0" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />Upload First Reel
        </Button>
        <UploadDialog
          open={open} onOpenChange={setOpen}
          form={form} setForm={setForm}
          videoFile={videoFile} setVideoFile={setVideoFile}
          thumbFile={thumbFile} setThumbFile={setThumbFile}
          uploading={uploading} onUpload={handleUpload}
        />
      </div>
    );
  }

  return (
    <>
      {/* Upload button — floating top-right */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-40 flex items-center gap-1.5 px-3 py-2 rounded-full gradient-brand text-white text-sm font-semibold shadow-lg"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Upload</span>
      </button>

      {/* Full-screen vertical snap scroll */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {reels.map((reel, index) => (
          <div
            key={reel.id}
            ref={el => setItemRef(el, index)}
            data-index={index}
            className="w-full snap-start snap-always flex-shrink-0"
            style={{ height: '100%' }}
          >
            <ReelPlayer
              reel={reel}
              user={user}
              isActive={activeIndex === index}
              onLike={handleLike}
              onUpdate={(patch) => updateReel(reel.id, patch)}
            />
          </div>
        ))}
      </div>

      <UploadDialog
        open={open} onOpenChange={setOpen}
        form={form} setForm={setForm}
        videoFile={videoFile} setVideoFile={setVideoFile}
        thumbFile={thumbFile} setThumbFile={setThumbFile}
        uploading={uploading} onUpload={handleUpload}
      />
    </>
  );
}

function UploadDialog({ open, onOpenChange, form, setForm, videoFile, setVideoFile, thumbFile, setThumbFile, uploading, onUpload }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <input id="reel-video" type="file" accept="video/*" className="hidden"
                onChange={e => setVideoFile(e.target.files[0])} />
            </div>
          </div>
          <div>
            <Label>Thumbnail (optional)</Label>
            <input type="file" accept="image/*"
              className="mt-1 block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-primary/10 file:text-primary"
              onChange={e => setThumbFile(e.target.files[0])} />
          </div>
          <div>
            <Label>Title *</Label>
            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. How to solve quadratic equations" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
          </div>
          <div>
            <Label>Subject</Label>
            <Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
              placeholder="e.g. Mathematics" />
          </div>
          <Button onClick={onUpload} disabled={uploading || !videoFile || !form.title} className="w-full gradient-brand border-0">
            {uploading
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Uploading...</>
              : 'Publish Reel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}