import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import StatCard from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import {
  Megaphone, Eye, MousePointer, DollarSign, Plus, Search, CheckCircle2,
  XCircle, Pause, Play, Loader2, Image, Upload, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const DEMO_ADS = [
  { id: '1', campaign_name: 'Back to School 2026', advertiser_name: 'EduMart Nigeria', ad_type: 'feed', budget: 50000, spent: 32000, clicks: 1240, impressions: 48000, status: 'active', start_date: '2026-05-01', end_date: '2026-05-31' },
  { id: '2', campaign_name: 'TechCamp Summer', advertiser_name: 'TechCorp Ltd', ad_type: 'sidebar', budget: 80000, spent: 55000, clicks: 2100, impressions: 92000, status: 'active', start_date: '2026-04-15', end_date: '2026-06-15' },
  { id: '3', campaign_name: 'Scholarship Alert', advertiser_name: 'FutureLeaders NGO', ad_type: 'marketplace', budget: 30000, spent: 0, clicks: 0, impressions: 0, status: 'pending', start_date: '2026-05-20', end_date: '2026-06-20' },
  { id: '4', campaign_name: 'Campus Food App', advertiser_name: 'FoodieGo App', ad_type: 'sponsored_post', budget: 25000, spent: 25000, clicks: 890, impressions: 31000, status: 'completed', start_date: '2026-04-01', end_date: '2026-04-30' },
  { id: '5', campaign_name: 'Student Bank Account', advertiser_name: 'AccessBank', ad_type: 'video', budget: 120000, spent: 18000, clicks: 560, impressions: 22000, status: 'paused', start_date: '2026-05-10', end_date: '2026-06-10' },
  { id: '6', campaign_name: 'JAMB Prep Course', advertiser_name: 'PrepMaster Academy', ad_type: 'feed', budget: 45000, spent: 0, clicks: 0, impressions: 0, status: 'rejected', start_date: '2026-05-05', end_date: '2026-05-25' },
];

const PERFORMANCE_DATA = [
  { day: 'Mon', clicks: 234, impressions: 8400 },
  { day: 'Tue', clicks: 310, impressions: 11200 },
  { day: 'Wed', clicks: 280, impressions: 9800 },
  { day: 'Thu', clicks: 420, impressions: 14600 },
  { day: 'Fri', clicks: 380, impressions: 13200 },
  { day: 'Sat', clicks: 510, impressions: 18900 },
  { day: 'Sun', clicks: 290, impressions: 10100 },
];

const STATUS_CFG = {
  active:    { label: 'Active',    class: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  pending:   { label: 'Pending',   class: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
  paused:    { label: 'Paused',    class: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
  rejected:  { label: 'Rejected',  class: 'bg-red-400/10 text-red-400 border-red-400/20' },
  completed: { label: 'Completed', class: 'bg-purple-400/10 text-purple-400 border-purple-400/20' },
};

const TYPE_CFG = {
  feed: 'bg-blue-500/10 text-blue-400',
  sidebar: 'bg-purple-500/10 text-purple-400',
  marketplace: 'bg-emerald-500/10 text-emerald-400',
  sponsored_post: 'bg-pink-500/10 text-pink-400',
  video: 'bg-amber-500/10 text-amber-400',
};

function CreateAdModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ campaign_name: '', advertiser_name: '', ad_type: 'feed', budget: '', start_date: '', end_date: '', title: '', description: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.campaign_name || !form.advertiser_name || !form.budget) {
      toast.error('Fill in required fields'); return;
    }
    setSaving(true);
    await base44.entities.AdCampaign.create({ ...form, budget: Number(form.budget), spent: 0, clicks: 0, impressions: 0, status: 'pending' });
    toast.success('Campaign created!');
    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#0d1220] border-white/10 text-white">
        <DialogHeader><DialogTitle className="flex items-center gap-2 text-white"><Megaphone className="w-4 h-4 text-blue-400" />New Ad Campaign</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Campaign Name *</label>
              <Input className="bg-white/5 border-white/10 text-white" value={form.campaign_name} onChange={e => setForm(f => ({...f, campaign_name: e.target.value}))} placeholder="e.g. Back to School 2026" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Advertiser *</label>
              <Input className="bg-white/5 border-white/10 text-white" value={form.advertiser_name} onChange={e => setForm(f => ({...f, advertiser_name: e.target.value}))} placeholder="Company name" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Ad Type</label>
              <select className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-md px-3 py-2" value={form.ad_type} onChange={e => setForm(f => ({...f, ad_type: e.target.value}))}>
                {['feed','sidebar','marketplace','sponsored_post','video'].map(t => <option key={t} value={t} className="bg-[#0d1220]">{t.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Budget (₦) *</label>
              <Input type="number" className="bg-white/5 border-white/10 text-white" value={form.budget} onChange={e => setForm(f => ({...f, budget: e.target.value}))} placeholder="50000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Start Date</label>
              <Input type="date" className="bg-white/5 border-white/10 text-white" value={form.start_date} onChange={e => setForm(f => ({...f, start_date: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">End Date</label>
              <Input type="date" className="bg-white/5 border-white/10 text-white" value={form.end_date} onChange={e => setForm(f => ({...f, end_date: e.target.value}))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Ad Title</label>
            <Input className="bg-white/5 border-white/10 text-white" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Headline text" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Description</label>
            <Input className="bg-white/5 border-white/10 text-white" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Short ad description" />
          </div>
          <Button onClick={save} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 border-0 gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Create Campaign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminAds() {
  const [ads, setAds] = useState(DEMO_ADS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);

  const loadAds = () => {
    base44.entities.AdCampaign.list('-created_date', 100)
      .then(list => { if (list.length) setAds(list); })
      .catch(() => {});
  };

  useEffect(() => { loadAds(); }, []);

  const updateStatus = async (ad, newStatus) => {
    await base44.entities.AdCampaign.update(ad.id, { status: newStatus }).catch(() => {});
    setAds(prev => prev.map(a => a.id === ad.id ? { ...a, status: newStatus } : a));
    toast.success(`Campaign ${newStatus}`);
  };

  const filtered = ads.filter(a => {
    const matchSearch = !search || a.campaign_name.toLowerCase().includes(search.toLowerCase()) || a.advertiser_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalBudget = ads.reduce((s, a) => s + (a.budget || 0), 0);
  const totalSpent = ads.reduce((s, a) => s + (a.spent || 0), 0);
  const totalClicks = ads.reduce((s, a) => s + (a.clicks || 0), 0);
  const totalImpressions = ads.reduce((s, a) => s + (a.impressions || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Ad Budget" value={`₦${totalBudget.toLocaleString()}`} icon={DollarSign} color="blue" />
        <StatCard label="Total Spent" value={`₦${totalSpent.toLocaleString()}`} icon={DollarSign} trend="+₦18k this week" trendUp color="purple" />
        <StatCard label="Total Clicks" value={totalClicks.toLocaleString()} icon={MousePointer} trend="+15% CTR" trendUp color="green" />
        <StatCard label="Total Impressions" value={`${(totalImpressions/1000).toFixed(1)}k`} icon={Eye} color="amber" />
      </div>

      {/* Performance chart */}
      <div className="rounded-2xl border border-white/8 bg-[#0d1220] p-6">
        <h3 className="text-white font-bold text-sm mb-4">Weekly Ad Performance</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={PERFORMANCE_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
            <Bar dataKey="impressions" name="Impressions" fill="#3b82f6" radius={[4,4,0,0]} />
            <Bar dataKey="clicks" name="Clicks" fill="#8b5cf6" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/8 bg-[#0d1220] overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-white/8">
          <h3 className="text-white font-bold text-sm">All Campaigns ({filtered.length})</h3>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
              <Search className="w-3.5 h-3.5 text-white/40" />
              <input className="bg-transparent text-white text-xs placeholder-white/30 outline-none w-32" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white/5 border border-white/10 text-white text-xs rounded-lg px-3 py-1.5">
              <option value="all" className="bg-[#0d1220]">All Status</option>
              {Object.keys(STATUS_CFG).map(s => <option key={s} value={s} className="bg-[#0d1220]">{STATUS_CFG[s].label}</option>)}
            </select>
            <Button onClick={() => setCreateOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 border-0 gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" />New Campaign
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Campaign','Advertiser','Type','Budget','Spent','Clicks','Impressions','Status','Dates','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-white/40 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(ad => (
                <tr key={ad.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-white text-sm font-semibold max-w-[150px]"><span className="truncate block">{ad.campaign_name}</span></td>
                  <td className="px-4 py-3 text-white/70 text-sm whitespace-nowrap">{ad.advertiser_name}</td>
                  <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-md capitalize ${TYPE_CFG[ad.ad_type] || ''}`}>{ad.ad_type?.replace('_',' ')}</span></td>
                  <td className="px-4 py-3 text-white font-semibold text-sm">₦{Number(ad.budget||0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-blue-400 text-sm">₦{Number(ad.spent||0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-emerald-400 text-sm">{Number(ad.clicks||0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-purple-400 text-sm">{Number(ad.impressions||0).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${STATUS_CFG[ad.status]?.class || ''}`}>{STATUS_CFG[ad.status]?.label}</span></td>
                  <td className="px-4 py-3 text-white/30 text-[11px] whitespace-nowrap">{ad.start_date}<br/>{ad.end_date}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {ad.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(ad, 'active')} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Approve">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => updateStatus(ad, 'rejected')} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="Reject">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {ad.status === 'active' && (
                        <button onClick={() => updateStatus(ad, 'paused')} className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors" title="Pause">
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {ad.status === 'paused' && (
                        <button onClick={() => updateStatus(ad, 'active')} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors" title="Resume">
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreateAdModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={loadAds} />
    </div>
  );
}