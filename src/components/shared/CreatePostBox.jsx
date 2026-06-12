import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image, Video, BarChart2, FileText, BookOpen, Calendar, Hash, X, Loader2, HelpCircle, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function extractHashtags(text) {
  const matches = text.match(/#\w+/g) || [];
  return [...new Set(matches.map(t => t.slice(1)))];
}

const POST_ACTIONS = [
  { icon: Image,     label: 'Photo',     color: 'text-emerald-400 hover:bg-emerald-400/10', type: 'image' },
  { icon: Video,     label: 'Video',     color: 'text-sky-400 hover:bg-sky-400/10',         type: 'video' },
  { icon: BarChart2, label: 'Poll',       color: 'text-amber-400 hover:bg-amber-400/10',    type: 'poll' },
  { icon: HelpCircle,label: 'Question',  color: 'text-rose-400 hover:bg-rose-400/10',       type: 'question' },
  { icon: BookOpen,  label: 'Notes',     color: 'text-violet-400 hover:bg-violet-400/10',   type: 'notes' },
  { icon: Calendar,  label: 'Event',     color: 'text-orange-400 hover:bg-orange-400/10',   type: 'event' },
  { icon: FileText,  label: 'Assignment',color: 'text-cyan-400 hover:bg-cyan-400/10',       type: 'assignment' },
  { icon: Trophy,    label: 'Achievement',color: 'text-yellow-400 hover:bg-yellow-400/10', type: 'achievement' },
];

export default function CreatePostBox({ user, userProfile, onPosted, extraData = {} }) {
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

    // AI content moderation — check for non-educational / prohibited content
    if (content.trim()) {
      const modResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a content moderator for an educational platform (StudentOS). Analyze the following post and determine if it is appropriate for an educational social platform.

Allowed: educational discussions, academic resources, study tips, research, school announcements, career development, learning-related content, questions, study notes.
Prohibited: politics unrelated to education, betting/gambling, adult content, hate speech, harassment, fake news, entertainment gossip, spam, fraud, irrelevant advertisements.

Post content: "${content.trim()}"

Respond ONLY with a JSON object: {"allowed": true/false, "reason": "brief reason if rejected"}`,
        response_json_schema: {
          type: 'object',
          properties: {
            allowed: { type: 'boolean' },
            reason: { type: 'string' }
          }
        }
      });
      if (!modResult?.allowed) {
        setPosting(false);
        alert(`⚠️ Post blocked: ${modResult?.reason || 'This content does not meet StudentOS educational guidelines.'}`);
        return;
      }
    }

    let image_url = '', video_url = '';
    if (imageFile) { const r = await base44.integrations.Core.UploadFile({ file: imageFile }); image_url = r.file_url; }
    if (videoFile) { const r = await base44.integrations.Core.UploadFile({ file: videoFile }); video_url = r.file_url; }
    const tags = extractHashtags(content);
    await base44.entities.Post.create({
      content: content.trim(), image_url, video_url, tags,
      author_name: user.full_name, author_email: user.email,
      author_avatar: user.avatar_url || '',
      author_role: userProfile?.role || 'student',
      school_name: userProfile?.school_name || '',
      department: userProfile?.department || '',
      grade_level: userProfile?.grade_level || '',
      likes: [], like_count: 0, comment_count: 0, share_count: 0,
      privacy: 'public', ...extraData,
    });
    setContent(''); clearMedia(); setExpanded(false); setPosting(false);
    onPosted?.();
  };

  const handleActionClick = (type) => {
    if (type === 'image') document.getElementById('post-img-input').click();
    else if (type === 'video') document.getElementById('post-vid-input').click();
    else if (type === 'question') { setExpanded(true); setContent(c => c ? c : 'Question: '); }
    else if (type === 'notes') { setExpanded(true); setContent(c => c ? c : '📝 Study Note:\n\n'); }
    else if (type === 'achievement') { setExpanded(true); setContent(c => c ? c : '🏆 Achievement Unlocked: '); }
    else { setExpanded(true); }
  };

  return (
    <div className="relative">
      {/* Glass card */}
      <div className="rounded-2xl border border-white/8 bg-card/80 backdrop-blur-md overflow-hidden">
        {/* Top area */}
        <div className="flex gap-3 px-4 pt-3.5 pb-2">
          <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-violet-500/30">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="gradient-brand text-white font-bold text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            {expanded ? (
              <Textarea
                placeholder="Share an update, question, achievement, note, or study tip... Use #hashtags!"
                value={content}
                onChange={e => setContent(e.target.value)}
                className="min-h-[80px] border-0 bg-transparent resize-none focus-visible:ring-0 text-sm p-0 placeholder:text-muted-foreground/60"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setExpanded(true)}
                className="w-full text-left px-4 py-2.5 rounded-full bg-white/5 border border-white/8 text-sm text-muted-foreground hover:bg-white/8 transition-colors"
              >
                Share an update, question, achievement...
              </button>
            )}

            {/* Hashtag preview */}
            {expanded && content && extractHashtags(content).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {extractHashtags(content).map(tag => (
                  <span key={tag} className="text-xs bg-violet-500/15 text-violet-400 px-2 py-0.5 rounded-full font-medium border border-violet-500/20">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Media Preview */}
        <AnimatePresence>
          {preview && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative mx-4 mb-2">
              {previewType === 'image'
                ? <img src={preview} alt="" className="rounded-xl max-h-48 object-cover w-full" />
                : <video src={preview} className="rounded-xl max-h-48 w-full" controls />
              }
              <Button variant="secondary" size="icon" className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 text-white hover:bg-black/80 border-0" onClick={clearMedia}>
                <X className="w-3 h-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions strip */}
        <div className="flex items-center px-3 pb-3 gap-0.5 overflow-x-auto scrollbar-hide">
          {POST_ACTIONS.map(action => (
            <button
              key={action.type}
              onClick={() => handleActionClick(action.type)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${action.color}`}
            >
              <action.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{action.label}</span>
            </button>
          ))}

          {expanded && (
            <Button
              onClick={handlePost}
              disabled={posting || (!content.trim() && !imageFile && !videoFile)}
              className="ml-auto rounded-full px-5 h-8 text-xs gradient-brand border-0 flex-shrink-0"
            >
              {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Post'}
            </Button>
          )}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input id="post-img-input" type="file" accept="image/*" className="hidden" onChange={e => {
        const f = e.target.files[0];
        if (f) { setImageFile(f); setVideoFile(null); setPreview(URL.createObjectURL(f)); setPreviewType('image'); setExpanded(true); }
      }} />
      <input id="post-vid-input" type="file" accept="video/*" className="hidden" onChange={e => {
        const f = e.target.files[0];
        if (f) { setVideoFile(f); setImageFile(null); setPreview(URL.createObjectURL(f)); setPreviewType('video'); setExpanded(true); }
      }} />
    </div>
  );
}