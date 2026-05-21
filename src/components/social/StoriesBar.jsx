import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BG_COLORS = [
  'from-purple-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-red-500',
  'from-indigo-500 to-violet-500',
];

export default function StoriesBar({ user }) {
  const [grouped, setGrouped] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [storyFile, setStoryFile] = useState(null);
  const [storyPreview, setStoryPreview] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    base44.entities.Story.list('-created_date', 50).then(data => {
      const map = {};
      data.forEach(s => {
        if (!map[s.author_email]) {
          map[s.author_email] = {
            author_email: s.author_email,
            author_name: s.author_name,
            author_avatar: s.author_avatar,
            stories: [],
          };
        }
        map[s.author_email].stories.push(s);
      });
      setGrouped(Object.values(map));
    }).catch(() => {});
  }, []);

  const handlePost = async () => {
    if (!storyText.trim() && !storyFile) return;
    setPosting(true);
    let image_url = '';
    if (storyFile) {
      const r = await base44.integrations.Core.UploadFile({ file: storyFile });
      image_url = r.file_url;
    }
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await base44.entities.Story.create({
      author_email: user.email, author_name: user.full_name,
      author_avatar: user.avatar_url || '',
      text_overlay: storyText, image_url,
      background_color: BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)],
      viewers: [], expires_at: expires,
    });
    setAddOpen(false); setStoryText(''); setStoryFile(null); setStoryPreview(''); setPosting(false);
  };

  const openStory = (i) => setViewing({ groupIdx: i, storyIdx: 0 });

  const nextStory = () => {
    const group = grouped[viewing.groupIdx];
    if (viewing.storyIdx < group.stories.length - 1) {
      setViewing(v => ({ ...v, storyIdx: v.storyIdx + 1 }));
    } else if (viewing.groupIdx < grouped.length - 1) {
      setViewing({ groupIdx: viewing.groupIdx + 1, storyIdx: 0 });
    } else {
      setViewing(null);
    }
  };

  const prevStory = () => {
    if (viewing.storyIdx > 0) setViewing(v => ({ ...v, storyIdx: v.storyIdx - 1 }));
    else if (viewing.groupIdx > 0) setViewing({ groupIdx: viewing.groupIdx - 1, storyIdx: 0 });
  };

  const currentStory = viewing ? grouped[viewing.groupIdx]?.stories[viewing.storyIdx] : null;

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {/* Add Story bubble */}
        <div
          className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer"
          onClick={() => setAddOpen(true)}
        >
          <div className="relative w-[58px] h-[58px]">
            <div className="w-full h-full rounded-full overflow-hidden ring-2 ring-border">
              <Avatar className="w-full h-full">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback className="gradient-brand text-white font-bold text-lg w-full h-full">
                  {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary border-2 border-card flex items-center justify-center shadow">
              <Plus className="w-3 h-3 text-white" />
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium w-[58px] text-center truncate leading-tight">Your Story</span>
        </div>

        {/* Story bubbles */}
        {grouped.map((group, i) => {
          const initials = group.author_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
          return (
            <motion.div
              key={group.author_email}
              whileTap={{ scale: 0.92 }}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer"
              onClick={() => openStory(i)}
            >
              <div className="w-[58px] h-[58px] rounded-full p-[2.5px] bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400">
                <Avatar className="w-full h-full ring-2 ring-card rounded-full">
                  <AvatarImage src={group.author_avatar} />
                  <AvatarFallback className="gradient-brand text-white font-bold text-sm">{initials}</AvatarFallback>
                </Avatar>
              </div>
              <span className="text-[10px] text-muted-foreground w-[58px] text-center truncate leading-tight">
                {group.author_name?.split(' ')[0]}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Add Story Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <h3 className="font-bold text-lg">Create Story</h3>
          <div className="space-y-3">
            <textarea
              value={storyText}
              onChange={e => setStoryText(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full h-24 bg-muted rounded-xl p-3 text-sm resize-none border-0 outline-none focus:ring-2 focus:ring-primary"
            />
            <label className="block">
              <input type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files[0];
                if (f) { setStoryFile(f); setStoryPreview(URL.createObjectURL(f)); }
              }} />
              <div className="flex items-center gap-2 cursor-pointer bg-muted hover:bg-accent px-3 py-2.5 rounded-xl text-sm text-muted-foreground transition-colors">
                <Camera className="w-4 h-4" /> Add Photo
              </div>
            </label>
            {storyPreview && <img src={storyPreview} alt="" className="w-full h-32 object-cover rounded-xl" />}
            <Button
              onClick={handlePost}
              disabled={posting || (!storyText.trim() && !storyFile)}
              className="w-full rounded-xl gradient-brand border-0"
            >
              {posting ? 'Sharing...' : 'Share Story'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-screen story viewer */}
      <AnimatePresence>
        {viewing && currentStory && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
            onClick={() => setViewing(null)}
          >
            <div
              className="relative w-full h-full max-w-sm mx-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Story content */}
              {currentStory.image_url ? (
                <img src={currentStory.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${currentStory.background_color || 'from-purple-500 to-pink-500'} flex items-center justify-center`}>
                  <p className="text-white text-2xl font-bold text-center px-8 leading-snug">
                    {currentStory.text_overlay}
                  </p>
                </div>
              )}

              {/* Top overlay */}
              <div className="absolute top-0 left-0 right-0 pt-12 px-4"
                style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)' }}>
                {/* Progress bars */}
                <div className="flex gap-1 mb-3">
                  {grouped[viewing.groupIdx]?.stories.map((_, si) => (
                    <div key={si} className={`h-0.5 flex-1 rounded-full ${si <= viewing.storyIdx ? 'bg-white' : 'bg-white/30'}`} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 ring-2 ring-white">
                    <AvatarImage src={currentStory.author_avatar} />
                    <AvatarFallback className="text-xs font-bold bg-primary text-white">
                      {currentStory.author_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white text-sm font-semibold">{currentStory.author_name}</span>
                </div>
              </div>

              {/* Text overlay on image */}
              {currentStory.text_overlay && currentStory.image_url && (
                <div className="absolute bottom-20 left-0 right-0 px-6">
                  <p className="text-white text-lg font-semibold text-center drop-shadow-lg">{currentStory.text_overlay}</p>
                </div>
              )}

              {/* Navigation zones */}
              <button onClick={prevStory} className="absolute left-0 top-0 h-full w-1/3 opacity-0" />
              <button onClick={nextStory} className="absolute right-0 top-0 h-full w-2/3 opacity-0" />

              {/* Visible nav buttons */}
              <button onClick={prevStory} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextStory} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white">
                <ChevronRight className="w-5 h-5" />
              </button>
              <button onClick={() => setViewing(null)} className="absolute top-[52px] right-3 p-1.5 rounded-full bg-black/30 text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}