import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import StatCard from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building2, Users, DollarSign, CheckCircle2, ShieldCheck, Ban, Search, Plus, Loader2, Globe, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

const DEMO_ADVERTISERS = [
  { id: '1', company_name: 'EduMart Nigeria', contact_name: 'Chijioke Nwachukwu', contact_email: 'chi@edumart.ng', industry: 'education', status: 'verified', total_spent: 32000, total_campaigns: 3, balance: 18000 },
  { id: '2', company_name: 'TechCorp Ltd', contact_name: 'Adaeze Obi', contact_email: 'adaeze@techcorp.ng', industry: 'technology', status: 'verified', total_spent: 55000, total_campaigns: 2, balance: 25000 },
  { id: '3', company_name: 'FutureLeaders NGO', contact_name: 'Emeka Balogun', contact_email: 'emeka@futureleaders.org', industry: 'education', status: 'pending', total_spent: 0, total_campaigns: 1, balance: 30000 },
  { id: '4', company_name: 'FoodieGo App', contact_name: 'Amina Yusuf', contact_email: 'amina@foodiego.com', industry: 'retail', status: 'verified', total_spent: 25000, total_campaigns: 1, balance: 0 },
  { id: '5', company_name: 'AccessBank', contact_name: 'Babatunde Adeyemi', contact_email: 'b.adeyemi@accessbank.ng', industry: 'finance', status: 'suspended', total_spent: 18000, total_campaigns: 1, balance: 102000 },
  { id: '6', company_name: 'PrepMaster Academy', contact_name: 'Ngozi Eze', contact_email: 'ngozi@prepmaster.ng', industry: 'education', status: 'pending', total_spent: 0, total_campaigns: 1, balance: 45000 },
];

const STATUS_CFG = {
  pending:   { label: 'Pending',   class: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
  verified:  { label: 'Verified',  class: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  suspended: { label: 'Suspended', class: 'bg-red-400/10 text-red-400 border-red-400/20' },
};

const INDUSTRY_CFG = {
  education: 'bg-blue-500/10 text-blue-400',
  technology: 'bg-purple-500/10 text-purple-400',
  finance: 'bg-emerald-500/10 text-emerald-400',
  healthcare: 'bg-red-500/10 text-red-400',
  retail: 'bg-amber-500/10 text-amber-400',
  media: 'bg-pink-500/10 text-pink-400',
  other: 'bg-white/10 text-white/50',
};

function AddAdvertiserModal({ open, onClose, onAdded }) {
  const [form, setForm] = useState({ company_name: '', contact_name: '', contact_email: '', industry: 'other', website: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.company_name || !form.contact_email) { toast.error('Company name and email required'); return; }
    setSaving(true);
    await base44.entities.Advertiser.create({ ...form, status: 'pending', total_spent: 0, total_campaigns: 0, balance: 0 });
    toast.success('Advertiser added!');
    setSaving(false);
    onAdded();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#0d1220] border-white/10 text-white">
        <DialogHeader><DialogTitle className="text-white flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-400" />Add Advertiser</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Company Name *</label>
              <Input className="bg-white/5 border-white/10 text-white" value={form.company_name} onChange={e => setForm(f => ({...f, company_name: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Contact Name</label>
              <Input className="bg-white/5 border-white/10 text-white" value={form.contact_name} onChange={e => setForm(f => ({...f, contact_name: e.target.value}))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Email *</label>
              <Input type="email" className="bg-white/5 border-white/10 text-white" value={form.contact_email} onChange={e => setForm(f => ({...f, contact_email: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Industry</label>
              <select className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-md px-3 py-2" value={form.industry} onChange={e => setForm(f => ({...f, industry: e.target.value}))}>
                {['education','technology','finance','healthcare','retail','media','other'].map(i => <option key={i} value={i} className="bg-[#0d1220] capitalize">{i}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Website</label>
              <Input className="bg-white/5 border-white/10 text-white" value={form.website} onChange={e => setForm(f => ({...f, website: e.target.value}))} placeholder="https://..." />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Phone</label>
              <Input className="bg-white/5 border-white/10 text-white" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
            </div>
          </div>
          <Button onClick={save} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 border-0 gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Add Advertiser
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminAdvertisers() {
  const [advertisers, setAdvertisers] = useState(DEMO_ADVERTISERS);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    base44.entities.Advertiser.list('-created_date', 100)
      .then(list => { if (list.length) setAdvertisers(list); })
      .catch(() => {});
  }, []);

  const load = () => {
    base44.entities.Advertiser.list('-created_date', 100).then(list => { if (list.length) setAdvertisers(list); }).catch(() => {});
  };

  const updateStatus = async (adv, status) => {
    await base44.entities.Advertiser.update(adv.id, { status }).catch(() => {});
    setAdvertisers(prev => prev.map(a => a.id === adv.id ? { ...a, status } : a));
    toast.success(`${adv.company_name} ${status}`);
  };

  const filtered = advertisers.filter(a =>
    !search || a.company_name.toLowerCase().includes(search.toLowerCase()) ||
    a.contact_email.toLowerCase().includes(search.toLowerCase())
  );

  const verified = advertisers.filter(a => a.status === 'verified').length;
  const totalSpent = advertisers.reduce((s, a) => s + (a.total_spent || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Advertisers" value={advertisers.length} icon={Building2} color="blue" />
        <StatCard label="Verified" value={verified} sub="Active businesses" icon={ShieldCheck} color="green" />
        <StatCard label="Pending Review" value={advertisers.filter(a => a.status === 'pending').length} icon={Users} color="amber" />
        <StatCard label="Total Ad Spend" value={`₦${totalSpent.toLocaleString()}`} icon={DollarSign} trend="+22% this month" trendUp color="purple" />
      </div>

      {/* Advertiser cards */}
      <div className="rounded-2xl border border-white/8 bg-[#0d1220] overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-white/8">
          <h3 className="text-white font-bold text-sm">Advertisers ({filtered.length})</h3>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
              <Search className="w-3.5 h-3.5 text-white/40" />
              <input className="bg-transparent text-white text-xs placeholder-white/30 outline-none w-32" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Button onClick={() => setAddOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 border-0 gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" />Add Advertiser
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
          {filtered.map(adv => (
            <div key={adv.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-4 hover:bg-white/[0.05] transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-lg font-black text-white">
                    {adv.company_name[0]}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{adv.company_name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-semibold capitalize ${STATUS_CFG[adv.status]?.class}`}>
                      {adv.status}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md capitalize ${INDUSTRY_CFG[adv.industry]}`}>{adv.industry}</span>
              </div>

              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Users className="w-3 h-3" />{adv.contact_name || '—'}
                </div>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Mail className="w-3 h-3" />{adv.contact_email}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center bg-white/5 rounded-lg p-2">
                  <p className="text-blue-400 font-bold text-sm">₦{Number(adv.total_spent||0).toLocaleString()}</p>
                  <p className="text-white/30 text-[9px]">Spent</p>
                </div>
                <div className="text-center bg-white/5 rounded-lg p-2">
                  <p className="text-purple-400 font-bold text-sm">{adv.total_campaigns || 0}</p>
                  <p className="text-white/30 text-[9px]">Campaigns</p>
                </div>
                <div className="text-center bg-white/5 rounded-lg p-2">
                  <p className="text-emerald-400 font-bold text-sm">₦{Number(adv.balance||0).toLocaleString()}</p>
                  <p className="text-white/30 text-[9px]">Balance</p>
                </div>
              </div>

              <div className="flex gap-2">
                {adv.status === 'pending' && (
                  <Button onClick={() => updateStatus(adv, 'verified')} size="sm" className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-0 text-xs gap-1">
                    <CheckCircle2 className="w-3 h-3" />Verify
                  </Button>
                )}
                {adv.status === 'verified' && (
                  <Button onClick={() => updateStatus(adv, 'suspended')} size="sm" className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border-0 text-xs gap-1">
                    <Ban className="w-3 h-3" />Suspend
                  </Button>
                )}
                {adv.status === 'suspended' && (
                  <Button onClick={() => updateStatus(adv, 'verified')} size="sm" className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border-0 text-xs gap-1">
                    <CheckCircle2 className="w-3 h-3" />Restore
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddAdvertiserModal open={addOpen} onClose={() => setAddOpen(false)} onAdded={load} />
    </div>
  );
}