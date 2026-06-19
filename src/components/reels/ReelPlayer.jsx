import React, { useRef, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Play, BookOpen, Flag, Pause } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDistanceToNow, differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import ReelComments from '@/components/reels/ReelComments';
import ReelShare from '@/components/reels/ReelShare';
import ReportDialog from '@/components/shared/ReportDialog';

/** Human-friendly relative timestamp, refreshed every minute */
function useRelativeTime(dateStr) {
  const getLabel = useCallback(() => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const secs = differenceInSeconds(new Date(), d);
    if (secs < 60) return 'Just now';
    const mins = differenceInMinutes(new Date(), d);
    if (mins < 60) return `${mins}m ago`;
    const hrs = differenceInHours(new Date(), d);
    if (hrs < 24) return `${hrs}h ago`;
    const days = differenceInDays(new Date(), d);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return formatDistanceToNow(d, { addSuffix: true });
  }, [dateStr]);

  const [label, setLabel] = useState(getLabel);
  useEffect(() => {
    setLabel(getLabel());
    const id = setInterval(() => setLabel(getLabel()), 60_000);
    return () => clearInterval(id);
  }, [getLabel]);
  return label;
}

export default function ReelPlayer({ reel, user, isActive, onLike, onUpdate }) {
  const videoRef = useRef(null);
  const sheetRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [showTapIcon, setShowTapIcon] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const liked = reel.likes?.includes(user?.email);
  const isOwn = reel.author_email === user?.email;
  const initials = reel.author_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  const timeLabel = useRelativeTime(reel.created_date);

  // ── Autoplay / autopause driven by parent isActive prop ──────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setPlaying(false);
    }
  }, [isActive]);

  // ── Pause when tab loses focus ────────────────────────────────────────────
  useEffect(() => {
    const onHide = () => {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        setPlaying(false);
      }
    };
    const onShow = () => {
      if (isActive && videoRef.current) {
        videoRef.current.play().then(() => setPlaying(true)).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', () => {
      document.hidden ? onHide() : onShow();
    });
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [isActive]);

  // ── Keyboard lift for bottom sheet ───────────────────────────────────────
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      if (!sheetRef.current) return;
      const kbHeight = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      sheetRef.current.style.bottom = `${kbHeight}px`;
    };
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  // ── Tap to play/pause ─────────────────────────────────────────────────────
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setPlaying(false);
    }
    setShowTapIcon(true);
    setTimeout(() => setShowTapIcon(false), 700);
  };

  const handleReport = async () => {
    await base44.entities.Reel.update(reel.id, { report_count: (reel.report_count || 0) + 1 });
    onUpdate({ report_count: (reel.report_count || 0) + 1 });
  };

  return (
    <>
      <ReportDialog
        open={showReport} onOpenChange={setShowReport}
        targetType="reel" targetId={reel.id} targetTitle={reel.title}
        targetOwnerEmail={reel.author_email} currentUser={user}
        onSuccess={handleReport}
      />

      {/* Full-screen reel container */}
      <div className="relative w-full h-full bg-black flex-shrink-0 overflow-hidden">

        {/* Thumbnail shown before play */}
        {reel.thumbnail_url && !playing && (
          <img
            src={reel.thumbnail_url}
            alt={reel.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Video — preload="auto" for next-video buffering */}
        <video
          ref={videoRef}
          src={reel.video_url}
          muted={false}
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />

        {/* Tap overlay */}
        <div className="absolute inset-0 z-10" onClick={togglePlay} />

        {/* Tap icon flash */}
        <AnimatePresence>
          {showTapIcon && (
            <motion.div
              key="tap-icon"
              initial={{ opacity: 1, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.3 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
            >
              <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                {playing ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top controls */}
        <div className="absolute top-4 left-0 right-0 z-20 flex items-start px-4 pointer-events-none">
          {reel.subject && (
            <Badge className="bg-primary/80 text-white border-0 text-[10px] pointer-events-auto">
              <BookOpen className="w-2.5 h-2.5 mr-1" />{reel.subject}
            </Badge>
          )}
        </div>

        {/* Side action buttons */}
        <div className="absolute right-3 bottom-28 z-20 flex flex-col gap-4 items-center" onClick={e => e.stopPropagation()}>
          {/* Like */}
          <button onClick={() => onLike(reel)} className="flex flex-col items-center gap-1">
            <motion.div
              whileTap={{ scale: 1.3 }}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg ${liked ? 'bg-red-500' : 'bg-black/50'}`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'text-white fill-white' : 'text-white'}`} />
            </motion.div>
            <span className="text-white text-[11px] font-bold drop-shadow">{reel.like_count || 0}</span>
          </button>
          {/* Comment */}
          <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-black/50 flex items-center justify-center shadow-lg">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-[11px] font-bold drop-shadow">{reel.comment_count || 0}</span>
          </button>
          {/* Share */}
          <button onClick={() => setShowShare(true)} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-black/50 flex items-center justify-center shadow-lg">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-[11px] font-bold drop-shadow">{reel.share_count || 0}</span>
          </button>
        </div>

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-14 z-20 p-4 pb-6 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)' }}>
          <div className="flex items-center gap-2 mb-2 pointer-events-auto">
            <Link to={`/profile/${reel.author_email}`} onClick={e => e.stopPropagation()}>
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarImage src={reel.author_avatar} />
                <AvatarFallback className="gradient-brand text-white text-[10px]">{initials}</AvatarFallback>
              </Avatar>
            </Link>
            <Link to={`/profile/${reel.author_email}`} onClick={e => e.stopPropagation()}
              className="text-white text-sm font-bold hover:underline drop-shadow">
              {reel.author_name}
            </Link>
            <span className="text-white/70 text-[11px] ml-1">{timeLabel}</span>
          </div>
          {reel.title && (
            <p className="text-white text-sm font-semibold drop-shadow line-clamp-2 mb-1">{reel.title}</p>
          )}
          {reel.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 pointer-events-auto">
              {reel.tags.map(t => (
                <span key={t} className="text-white/80 text-[11px] font-medium">#{t}</span>
              ))}
            </div>
          )}
          {!isOwn && (
            <button
              onClick={e => { e.stopPropagation(); setShowReport(true); }}
              className="flex items-center gap-1 mt-2 text-[10px] text-white/60 hover:text-white/90 transition-colors pointer-events-auto"
            >
              <Flag className="w-2.5 h-2.5" />Report
            </button>
          )}
        </div>
      </div>

      {/* Comments bottom sheet */}
      <AnimatePresence>
        {showComments && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowComments(false)} />
            <motion.div
              ref={sheetRef}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 right-0 z-50 bg-card rounded-t-2xl flex flex-col"
              style={{ bottom: 0, maxHeight: '80dvh' }}
            >
              <ReelComments reel={reel} user={user}
                onClose={() => setShowComments(false)}
                onCountChange={count => onUpdate({ comment_count: count })} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Share bottom sheet */}
      <AnimatePresence>
        {showShare && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowShare(false)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl"
            >
              <ReelShare reel={reel} user={user}
                onClose={() => setShowShare(false)}
                onCountChange={count => onUpdate({ share_count: count })} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}