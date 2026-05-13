import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, XCircle, Loader2, Megaphone, DollarSign,
  Calendar, MousePointer, Eye, Tag, FileText, Users, Target
} from 'lucide-react';
import { toast } from 'sonner';

const TYPE_CFG = {
  feed: 'bg-blue-500/10 text-blue-400',
  sidebar: 'bg-purple-500/10 text-purple-400',
  marketplace: 'bg-emerald-500/10 text-emerald-400',
  sponsored_post: 'bg-pink-500/10 text-pink-400',
  video: 'bg-amber-500/10 text-amber-400',
};

const Row = ({ icon: Icon, label, value, valueClass = 'text-white' }) => (
  <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="w-3.5 h-3.5 text-white/40" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white/40 text-[11px] uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-sm font-medium ${valueClass}`}>{value || '—'}</p>
    </div>
  </div>
);

export default function CampaignReviewModal({ campaign, open, onClose, onDecision }) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [loading, setLoading] = useState(null); // 'approve' | 'reject'

  if (!campaign) return null;

  const handleDecision = async (action) => {
    if (action === 'reject' && !showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    setLoading(action);
    try {
      const newStatus = action === 'approve' ? 'active' : 'rejected';
      await base44.entities.AdCampaign.update(campaign.id, {
        status: newStatus,
        ...(action === 'reject' && rejectionReason ? { rejection_reason: rejectionReason } : {}),
      });

      // Send email notification to advertiser
      await base44.functions.invoke('notifyAdvertiser', {
        campaign,
        action: action === 'approve' ? 'approved' : 'rejected',
        rejection_reason: rejectionReason || undefined,
      });

      toast.success(action === 'approve'
        ? `Campaign approved & advertiser notified!`
        : `Campaign rejected & advertiser notified.`
      );
      onDecision(campaign.id, newStatus);
      onClose();
    } catch (e) {
      toast.error(`Failed: ${e.message}`);
    } finally {
      setLoading(null);
    }
  };

  const ctr = campaign.impressions > 0
    ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2)
    : '0.00';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-[#0d1220] border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-amber-400" />
            </div>
            Campaign Review
          </DialogTitle>
        </DialogHeader>

        {/* Status banner */}
        <div className="flex items-center justify-between bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3 -mt-1">
          <div>
            <p className="text-white font-bold text-sm">{campaign.campaign_name}</p>
            <p className="text-white/40 text-xs mt-0.5">by {campaign.advertiser_name}</p>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold uppercase">
            Pending Review
          </span>
        </div>

        {/* Creative & Details */}
        <div className="space-y-1">
          <p className="text-white/40 text-[11px] uppercase tracking-wider px-1 pt-1">Campaign Details</p>
          <div className="bg-white/[0.03] rounded-xl border border-white/5 px-4 py-1">
            <Row icon={Tag} label="Ad Type" value={
              <span className={`text-[11px] px-2 py-0.5 rounded-md capitalize ${TYPE_CFG[campaign.ad_type] || ''}`}>
                {campaign.ad_type?.replace('_', ' ')}
              </span>
            } />
            <Row icon={Target} label="Placement" value={campaign.placement || campaign.ad_type} />
            <Row icon={FileText} label="Ad Title" value={campaign.title} />
            <Row icon={FileText} label="Description" value={campaign.description} valueClass="text-white/70" />
            {campaign.target_url && (
              <Row icon={Eye} label="Target URL" value={
                <a href={campaign.target_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-sm truncate block max-w-xs">
                  {campaign.target_url}
                </a>
              } />
            )}
          </div>
        </div>

        {/* Budget */}
        <div className="space-y-1">
          <p className="text-white/40 text-[11px] uppercase tracking-wider px-1">Budget & Schedule</p>
          <div className="bg-white/[0.03] rounded-xl border border-white/5 px-4 py-1">
            <Row icon={DollarSign} label="Total Budget" value={`₦${Number(campaign.budget || 0).toLocaleString()}`} valueClass="text-emerald-400 font-bold" />
            {campaign.daily_budget > 0 && (
              <Row icon={DollarSign} label="Daily Budget" value={`₦${Number(campaign.daily_budget).toLocaleString()}`} />
            )}
            {campaign.cpc > 0 && (
              <Row icon={MousePointer} label="Cost Per Click (CPC)" value={`₦${campaign.cpc}`} />
            )}
            {campaign.cpm > 0 && (
              <Row icon={Eye} label="Cost Per 1k Impressions (CPM)" value={`₦${campaign.cpm}`} />
            )}
            <Row icon={Calendar} label="Campaign Period" value={
              campaign.start_date && campaign.end_date
                ? `${campaign.start_date}  →  ${campaign.end_date}`
                : campaign.start_date || campaign.end_date || 'Not specified'
            } />
          </div>
        </div>

        {/* Creative preview */}
        {campaign.image_url && (
          <div className="space-y-1">
            <p className="text-white/40 text-[11px] uppercase tracking-wider px-1">Creative Asset</p>
            <div className="rounded-xl overflow-hidden border border-white/10">
              <img src={campaign.image_url} alt="Ad creative" className="w-full object-cover max-h-48" />
            </div>
          </div>
        )}

        {/* Rejection reason input */}
        {showRejectInput && (
          <div className="space-y-2">
            <p className="text-white/60 text-xs">Rejection reason (will be sent to advertiser)</p>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g. Ad content violates our guidelines — please revise the creative..."
              rows={3}
              className="w-full bg-white/5 border border-red-500/30 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 resize-none focus:outline-none focus:border-red-500/60"
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            onClick={() => { setShowRejectInput(false); onClose(); }}
            className="flex-1 border-white/15 text-white/60 hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDecision('reject')}
            disabled={!!loading}
            className="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 gap-2"
          >
            {loading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            {showRejectInput ? 'Confirm Reject' : 'Reject'}
          </Button>
          <Button
            onClick={() => handleDecision('approve')}
            disabled={!!loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 border-0 gap-2"
          >
            {loading === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Approve & Go Live
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}