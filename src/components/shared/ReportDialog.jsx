import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Flag, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const REASONS = [
  { value: 'spam', label: '🗑️ Spam' },
  { value: 'harassment', label: '😡 Harassment or Bullying' },
  { value: 'hate_speech', label: '🚫 Hate Speech' },
  { value: 'misinformation', label: '❌ Misinformation / Fake News' },
  { value: 'inappropriate_content', label: '🔞 Inappropriate Content' },
  { value: 'violence', label: '⚠️ Violence' },
  { value: 'off_topic', label: '📵 Off-Topic / Non-Educational' },
  { value: 'fraud', label: '💸 Fraud or Scam' },
  { value: 'other', label: '🔍 Other' },
];

const TYPE_LABELS = {
  post: 'Post', comment: 'Comment', community: 'Community',
  school: 'School', market_item: 'Marketplace Listing', reel: 'Reel',
};

/**
 * Props:
 *   open, onOpenChange
 *   targetType  – "post"|"comment"|"community"|"school"|"market_item"
 *   targetId    – id of the item being reported
 *   targetTitle – display title for the item
 *   targetOwnerEmail – email of the owner (optional)
 *   currentUser – { email, full_name }
 */
export default function ReportDialog({ open, onOpenChange, targetType, targetId, targetTitle, targetOwnerEmail, currentUser, onSuccess }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    await base44.entities.ContentReport.create({
      reporter_email: currentUser?.email,
      reporter_name: currentUser?.full_name || currentUser?.email,
      target_type: targetType,
      target_id: targetId,
      target_title: targetTitle || '',
      target_owner_email: targetOwnerEmail || '',
      reason,
      details,
      status: 'pending',
    });
    toast.success('Report submitted. Our team will review it.');
    setReason('');
    setDetails('');
    onOpenChange(false);
    setSubmitting(false);
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-destructive" />
            Report {TYPE_LABELS[targetType] || 'Content'}
          </DialogTitle>
        </DialogHeader>
        {targetTitle && (
          <p className="text-xs text-muted-foreground -mt-1 mb-1 line-clamp-2">"{targetTitle}"</p>
        )}
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-1.5">
            {REASONS.map(r => (
              <button
                key={r.value}
                onClick={() => setReason(r.value)}
                className={`text-left px-3 py-2.5 rounded-xl text-sm transition-all border ${
                  reason === r.value
                    ? 'bg-destructive/10 border-destructive/40 text-destructive font-medium'
                    : 'border-transparent hover:bg-muted text-foreground'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Textarea
            value={details}
            onChange={e => setDetails(e.target.value)}
            placeholder="Additional details (optional)..."
            rows={2}
            className="text-sm"
          />
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1 gap-2" onClick={handleSubmit} disabled={submitting || !reason}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
              Submit Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}