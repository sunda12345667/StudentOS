import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

function StarRating({ value, onChange, readonly }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button" disabled={readonly}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`transition-transform ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}>
          <Star className={`w-5 h-5 ${(hover || value) >= s ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
        </button>
      ))}
    </div>
  );
}

export default function ItemReviews({ itemId, sellerEmail, currentUser }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Review.filter({ item_id: itemId }, '-created_date', 20)
      .then(setReviews).finally(() => setLoading(false));
  }, [itemId]);

  const hasReviewed = reviews.some(r => r.reviewer_email === currentUser?.email);
  const isOwn = sellerEmail === currentUser?.email;
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  const submit = async () => {
    if (!rating || saving) return;
    setSaving(true);
    const review = await base44.entities.Review.create({
      item_id: itemId, seller_email: sellerEmail,
      reviewer_email: currentUser.email, reviewer_name: currentUser.full_name,
      reviewer_avatar: currentUser.avatar_url || '',
      rating, comment: comment.trim(),
    });
    setReviews(p => [review, ...p]);
    setRating(0); setComment('');
    toast.success('Review submitted!');
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
          <p className="text-3xl font-black text-amber-600">{avg}</p>
          <div>
            <StarRating value={Math.round(avg)} readonly />
            <p className="text-xs text-muted-foreground mt-0.5">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {/* Write review */}
      {!isOwn && !hasReviewed && currentUser && (
        <div className="space-y-2 p-3 rounded-xl border">
          <p className="text-sm font-semibold">Leave a Review</p>
          <StarRating value={rating} onChange={setRating} />
          <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience..." rows={2} />
          <Button size="sm" onClick={submit} disabled={!rating || saving} className="gradient-brand border-0 gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />}Submit
          </Button>
        </div>
      )}

      {/* List */}
      {loading ? <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        : reviews.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No reviews yet</p>
        : reviews.map(r => (
          <div key={r.id} className="flex gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={r.reviewer_avatar} />
              <AvatarFallback className="gradient-brand text-white text-xs">{r.reviewer_name?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{r.reviewer_name}</p>
                <StarRating value={r.rating} readonly />
                <p className="text-[10px] text-muted-foreground ml-auto">{formatDistanceToNow(new Date(r.created_date), { addSuffix: true })}</p>
              </div>
              {r.comment && <p className="text-sm text-muted-foreground mt-0.5">{r.comment}</p>}
            </div>
          </div>
        ))
      }
    </div>
  );
}