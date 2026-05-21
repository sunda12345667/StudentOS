import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { X, Copy, Check, Share2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const SHARE_OPTIONS = [
  { id: 'copy', label: 'Copy Link', emoji: '🔗', color: 'bg-gray-100 text-gray-700' },
  { id: 'whatsapp', label: 'WhatsApp', emoji: '💬', color: 'bg-green-100 text-green-700' },
  { id: 'twitter', label: 'X / Twitter', emoji: '🐦', color: 'bg-sky-100 text-sky-700' },
  { id: 'feed', label: 'Share to Feed', emoji: '📢', color: 'bg-primary/10 text-primary' },
];

export default function ReelShare({ reel, user, onClose, onCountChange }) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const reelUrl = `${window.location.origin}/reels`;
  const shareText = `Check out this reel: "${reel?.title}" on StudentOS!`;

  const handleShare = async (option) => {
    if (option.id === 'copy') {
      await navigator.clipboard.writeText(reelUrl).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied!');
      return;
    }
    if (option.id === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + reelUrl)}`, '_blank');
    } else if (option.id === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(reelUrl)}`, '_blank');
    } else if (option.id === 'feed') {
      if (!user) { toast.error('Please login to share'); return; }
      setSharing(true);
      await base44.entities.Post.create({
        content: `📹 Sharing an educational reel: "${reel.title}" ${reel.description ? '— ' + reel.description : ''}\n\nCheck it out on StudentOS Reels!`,
        author_email: user.email,
        author_name: user.full_name,
        author_avatar: user.avatar_url || '',
        author_role: 'student',
        tags: reel.tags || [],
        like_count: 0, comment_count: 0, share_count: 0,
      }).catch(() => {});
      setSharing(false);
      toast.success('Shared to your feed!');
    }

    // Update share count
    const newCount = (reel.share_count || 0) + 1;
    await base44.entities.Reel.update(reel.id, { share_count: newCount }).catch(() => {});
    onCountChange?.(newCount);
    onClose();
  };

  const nativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: reel?.title, text: shareText, url: reelUrl }).catch(() => {});
    }
  };

  return (
    <div className="flex flex-col">
      {/* Handle */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 bg-border rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-bold text-base flex items-center gap-2"><Share2 className="w-4 h-4" />Share Reel</h3>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Reel info */}
      {reel?.title && (
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium text-muted-foreground truncate">"{reel.title}"</p>
        </div>
      )}

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {SHARE_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => handleShare(opt)}
            disabled={sharing}
            className={`flex items-center gap-3 p-3 rounded-xl border border-border ${opt.color} transition-all active:scale-95 hover:shadow-sm text-left`}
          >
            <span className="text-xl">{opt.id === 'copy' && copied ? '✅' : opt.emoji}</span>
            <span className="text-sm font-semibold">{opt.id === 'copy' && copied ? 'Copied!' : opt.label}</span>
          </button>
        ))}
      </div>

      {/* Native share */}
      {typeof navigator !== 'undefined' && navigator.share && (
        <div className="px-4 pb-4">
          <Button variant="outline" className="w-full gap-2" onClick={nativeShare}>
            <Share2 className="w-4 h-4" />More sharing options
          </Button>
        </div>
      )}

      <div className="h-4 safe-area-bottom" />
    </div>
  );
}