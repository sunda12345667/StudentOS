import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Megaphone, Eye, MousePointerClick, TrendingUp, Loader2 } from 'lucide-react';

const STATUS_COLORS = {
  active:    'bg-emerald-500/20 text-emerald-400',
  paused:    'bg-amber-500/20 text-amber-400',
  pending:   'bg-blue-500/20 text-blue-400',
  rejected:  'bg-red-500/20 text-red-400',
  completed: 'bg-white/10 text-white/50',
};

export default function AdvertiserCampaigns({ advertiser }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!advertiser?.id) return;
    base44.entities.AdCampaign.filter({ advertiser_id: advertiser.id }, '-created_date', 50)
      .then(setCampaigns)
      .finally(() => setLoading(false));
  }, [advertiser?.id]);

  const filtered = filter === 'all' ? campaigns : campaigns.filter(c => c.status === filter);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-white font-bold text-xl">My Campaigns</h1>
        <p className="text-white/40 text-sm mt-1">Track performance across all your ad campaigns.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'active', 'paused', 'pending', 'completed'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
              ${filter === s ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'bg-white/5 text-white/40 hover:text-white border border-white/8'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-white/30" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-[#0d1220] p-12 text-center">
          <Megaphone className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No campaigns found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : '0.00';
            const progress = c.budget > 0 ? Math.min((c.spent / c.budget) * 100, 100) : 0;
            return (
              <div key={c.id} className="rounded-2xl border border-white/8 bg-[#0d1220] p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-white font-semibold text-sm">{c.campaign_name}</p>
                    <p className="text-white/30 text-xs capitalize mt-0.5">{c.ad_type} · {c.placement}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[c.status] || 'bg-white/10 text-white/40'}`}>
                    {c.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                    <p className="text-white font-bold text-base">₦{Number(c.spent||0).toLocaleString()}</p>
                    <p className="text-white/30 text-[10px] mt-0.5">Spent</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                    <p className="text-purple-400 font-bold text-base">{Number(c.impressions||0).toLocaleString()}</p>
                    <p className="text-white/30 text-[10px] mt-0.5">Impressions</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                    <p className="text-amber-400 font-bold text-base">{Number(c.clicks||0).toLocaleString()}</p>
                    <p className="text-white/30 text-[10px] mt-0.5">Clicks</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                    <p className="text-blue-400 font-bold text-base">{ctr}%</p>
                    <p className="text-white/30 text-[10px] mt-0.5">CTR</p>
                  </div>
                </div>

                {/* Budget progress */}
                <div>
                  <div className="flex justify-between text-xs text-white/40 mb-1.5">
                    <span>Budget used</span>
                    <span>₦{Number(c.spent||0).toLocaleString()} / ₦{Number(c.budget||0).toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {c.start_date && (
                  <p className="text-white/20 text-[10px] mt-2">{c.start_date} → {c.end_date || 'Ongoing'}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}