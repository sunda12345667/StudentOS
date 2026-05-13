import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Megaphone, Wallet, MousePointerClick, Eye, TrendingUp, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Link } from 'react-router-dom';

export default function AdvertiserDashboard({ advertiser }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!advertiser?.id) return;
    base44.entities.AdCampaign.filter({ advertiser_id: advertiser.id })
      .then(setCampaigns)
      .finally(() => setLoading(false));
  }, [advertiser?.id]);

  const totalSpent = campaigns.reduce((s, c) => s + (c.spent || 0), 0);
  const totalImpressions = campaigns.reduce((s, c) => s + (c.impressions || 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + (c.clicks || 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  // Build chart data from campaigns
  const spendData = campaigns.map(c => ({
    name: (c.campaign_name || 'Campaign').substring(0, 12),
    spend: c.spent || 0,
    budget: c.budget || 0,
    impressions: c.impressions || 0,
    clicks: c.clicks || 0,
  }));

  const stats = [
    { label: 'Active Campaigns', value: activeCampaigns, icon: Megaphone, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Wallet Balance', value: `₦${Number(advertiser?.balance || 0).toLocaleString()}`, icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Total Impressions', value: totalImpressions.toLocaleString(), icon: Eye, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Total Clicks', value: totalClicks.toLocaleString(), icon: MousePointerClick, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white font-bold text-xl">Welcome back, {advertiser?.company_name || 'Advertiser'} 👋</h1>
        <p className="text-white/40 text-sm mt-1">Here's your advertising performance overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-white/8 bg-[#0d1220] p-4">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-white font-bold text-xl">{value}</p>
            <p className="text-white/40 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {spendData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-white/8 bg-[#0d1220] p-5">
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />Spend vs Budget
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={spendData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: '#0d1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff' }} formatter={v => [`₦${Number(v).toLocaleString()}`, '']} />
                <Bar dataKey="budget" fill="rgba(59,130,246,0.2)" radius={[4,4,0,0]} name="Budget" />
                <Bar dataKey="spend" fill="rgba(59,130,246,0.8)" radius={[4,4,0,0]} name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-white/8 bg-[#0d1220] p-5">
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" />Impressions & Clicks
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={spendData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0d1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff' }} />
                <Bar dataKey="impressions" fill="rgba(168,85,247,0.5)" radius={[4,4,0,0]} name="Impressions" />
                <Bar dataKey="clicks" fill="rgba(245,158,11,0.8)" radius={[4,4,0,0]} name="Clicks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : !loading && (
        <div className="rounded-2xl border border-white/8 bg-[#0d1220] p-12 text-center">
          <Megaphone className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No campaign data yet. Contact the platform to create campaigns.</p>
        </div>
      )}

      {/* Recent Campaigns */}
      {campaigns.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-[#0d1220] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <h3 className="text-white font-semibold text-sm">Recent Campaigns</h3>
            <Link to="/advertiser/campaigns" className="text-blue-400 text-xs hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {campaigns.slice(0, 4).map(c => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-white text-sm font-medium">{c.campaign_name}</p>
                  <p className="text-white/30 text-xs capitalize">{c.ad_type} · {c.placement}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-white/40 text-xs">Spent</p>
                    <p className="text-emerald-400 text-sm font-bold">₦{Number(c.spent||0).toLocaleString()}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    c.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                    c.status === 'paused' ? 'bg-amber-500/20 text-amber-400' :
                    c.status === 'pending' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-white/10 text-white/40'}`}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}