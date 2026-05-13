import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Image, Smile, Hash, X, Loader2, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function extractHashtags(text) {
  const matches = text.match(/#\w+/g) || [];
  return [...new Set(matches.map(t => t.slice(1)))];
}

export default function CreatePostBox({ user, onPosted, extraData = {} }) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [previewType, setPreviewType] = useState('');
  const [posting, setPosting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  const clearMedia = () => { setImageFile(null); setVideoFile(null); setPreview(''); setPreviewType(''); };

  const handlePost = async () => {
    if (!content.trim() && !imageFile && !videoFile) return;
    setPosting(true);
    let image_url = '', video_url = '';
    if (imageFile) {
      const r = await base44.integrations.Core.UploadFile({ file: imageFile });
      image_url = r.file_url;
    }
    if (videoFile) {
      const r = await base44.integrations.Core.UploadFile({ file: videoFile });
      video_url = r.file_url;
    }
    const tags = extractHashtags(content);
    await base44.entities.Post.create({
      content: content.trim(), image_url, video_url, tags,
      author_name: user.full_name, author_email: user.email,
      author_avatar: user.avatar_url || '',
      likes: [], like_count: 0, comment_count: 0, share_count: 0,
      privacy: 'public', ...extraData,
    });
    setContent(''); clearMedia(); setExpanded(false); setPosting(false);
    onPosted?.();
  };

  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={user?.avatar_url} />
          <AvatarFallback className="gradient-brand text-white font-bold text-sm">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          {expanded ? (
            <Textarea
              placeholder={`Share something, ${user?.full_name?.split(' ')[0]}... Use #hashtags!`}
              value={content} onChange={e => setContent(e.target.value)}
              className="min-h-[80px] border-0 resize-none focus-visible:ring-0 text-sm p-0" autoFocus
            />
          ) : (
            <div onClick={() => setExpanded(true)}
              className="bg-muted rounded-full px-4 py-2.5 text-sm text-muted-foreground cursor-pointer hover:bg-accent transition-colors">
              What's on your mind? Use #hashtags!
            </div>
          )}

          {/* Media Preview */}
          <AnimatePresence>
            {preview && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative mt-2">
                {previewType === 'image' ? (
                  <img src={preview} alt="" className="rounded-xl max-h-48 object-cover w-full" />
                ) : (
                  <video src={preview} className="rounded-xl max-h-48 w-full" controls />
                )}
                <Button variant="secondary" size="icon" className="absolute top-2 right-2 h-6 w-6 rounded-full" onClick={clearMedia}>
                  <X className="w-3 h-3" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hashtag preview */}
          {expanded && content && extractHashtags(content).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {extractHashtags(content).map(tag => (
                <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">#{tag}</span>
              ))}
            </div>
          )}

          {expanded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <div className="flex gap-1">
                <label>
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files[0];
                    if (f) { setImageFile(f); setVideoFile(null); setPreview(URL.createObjectURL(f)); setPreviewType('image'); }
                  }} />
                  <Button variant="ghost" size="sm" className="gap-1.5 text-green-600 text-xs" asChild><span><Image className="w-4 h-4" />Photo</span></Button>
                </label>
                <label>
                  <input type="file" accept="video/*" className="hidden" onChange={e => {
                    const f = e.target.files[0];
                    if (f) { setVideoFile(f); setImageFile(null); setPreview(URL.createObjectURL(f)); setPreviewType('video'); }
                  }} />
                  <Button variant="ghost" size="sm" className="gap-1.5 text-blue-500 text-xs" asChild><span><Video className="w-4 h-4" />Video</span></Button>
                </label>
                <Button variant="ghost" size="sm" className="gap-1.5 text-purple-500 text-xs hidden sm:flex" onClick={() => setContent(c => c + ' #')}>
                  <Hash className="w-4 h-4" />#Tag
                </Button>
              </div>
              <Button onClick={handlePost} disabled={posting || (!content.trim() && !imageFile && !videoFile)} className="rounded-full px-5 h-8 text-xs gradient-brand border-0">
                {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Post'}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </Card>
  );
}