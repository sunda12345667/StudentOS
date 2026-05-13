import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import StatCard from '@/components/admin/StatCard';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarSign, TrendingUp, Percent, Megaphone, Clock, Download, CheckCircle2, XCircle, ArrowDownToLine, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';

const generateFlowData = () =>
  Array.from({ length: 14 }, (_, i) => ({
    date: format(subDays(new Date(), 13 - i), 'MMM d'),
    commission: Math.floor(Math.random() * 8000 + 2000),
    adRevenue: Math.floor(Math.random() * 15000 + 3000),
    withdrawals: Math.floor(Math.random() * 5000),
  }));

const RECENT_REVENUE = [
  { id: 1, source: 'Commission — JavaScript Bootcamp', type: 'commission', amount: 400, date: '13 May 2026', status: 'completed' },
  { id: 2, source: 'Ad Revenue — TechCorp Campaign', type: 'ad_revenue', amount: 3200, date: '13 May 2026', status: 'completed' },
  { id: 3, source: 'Commission — HP Laptop Sale', type: 'commission', amount: 1400, date: '12 May 2026', status: 'completed' },
  { id: 4, source: 'Ad Revenue — AccessBank Video Ad', type: 'ad_revenue', amount: 1800, date: '12 May 2026', status: 'pending' },
  { id: 5, source: 'Withdrawal Request — Platform Payout', type: 'withdrawal', amount: -20000, date: '12 May 2026', status: 'processing' },
  { id: 6, source: 'Commission — WAEC Past Questions', type: 'commission', amount: 150, date: '11 May 2026', status: 'completed' },
  { id: 7, source: 'Ad Revenue — EduMart Campaign', type: 'ad_revenue', amount: 4200, date: '11 May 2026', status: 'completed' },
];

const WITHDRAWAL_REQUESTS = [
  { id: 1, requester: 'Platform Earnings', amount: 20000, requested: '12 May 2026', status: 'pending', bank: 'GTBank •••• 4521' },
  { id: 2, requester: 'Commission Pool', amount: 5600, requested: '10 May 2026', status: 'completed', bank: 'Zenith •••• 8832' },
];

const TX_TYPE = {
  commission:  { label: 'Commission',   color: 'bg-purple-500/10 text-purple-400' },
  ad_revenue:  { label: 'Ad Revenue',   color: 'bg-blue-500/10 text-blue-400' },
  withdrawal:  { label: 'Withdrawal',   color: 'bg-red-500/10 text-red-400' },
};

const STATUS_CFG = {
  completed:  { label: 'Completed',  class: 'bg-emerald-400/10 text-emerald-400' },
  pending:    { label: 'Pending',    class: 'bg-amber-400/10 text-amber-400' },
  processing: { label: 'Processing', class: 'bg-blue-400/10 text-blue-400' },
};

const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#f59e0b'];
const pieData = [
  { name: 'Commission', value: 45600 },
  { name: 'Ad Revenue', value: 128000 },
  { name: 'Marketplace Fee', value: 12400 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1f35] border border-white/10 rounded-xl p-3">
      <p className="text-white/60 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
          {p.name}: ₦{Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function AdminWallet() {
  const [flowData] = useState(generateFlowData);
  const [txFilter, setTxFilter] = useState('all');
  const [withdrawals, setWithdrawals] = useState(WITHDRAWAL_REQUESTS);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', source: 'commission', bank: '', account: '', note: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleWithdraw = async () => {
    if (!withdrawForm.amount || !withdrawForm.bank || !withdrawForm.account) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    const sourceLabels = { commission: 'Commission Pool', ad_revenue: 'Ad Revenue', platform: 'Platform Earnings' };
    const newRequest = {
      id: withdrawals.length + 1,
      requester: sourceLabels[withdrawForm.source] || 'Platform Earnings',
      amount: Number(withdrawForm.amount),
      requested: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'pending',
      bank: `${withdrawForm.bank} •••• ${withdrawForm.account.slice(-4)}`,
      note: withdrawForm.note,
    };
    setWithdrawals(prev => [newRequest, ...prev]);
    setSubmitting(false);
    setShowWithdrawModal(false);
    setWithdrawForm({ amount: '', source: 'commission', bank: '', account: '', note: '' });
    toast.success('Withdrawal request submitted successfully!');
  };

  const filtered = RECENT_REVENUE.filter(tx =>
    txFilter === 'all' || tx.type === txFilter
  );

  return (
    <div className="space-y-6">

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0d1220] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center">
                  <ArrowDownToLine className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Withdraw Funds</h3>
                  <p className="text-white/40 text-xs">Submit a payout request</p>
                </div>
              </div>
              <button onClick={() => setShowWithdrawModal(false)} className="text-white/40 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-white/60 text-xs mb-1.5 block">Withdraw From <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'commission', label: 'Commission', color: 'purple', amount: '₦45,600' },
                    { value: 'ad_revenue', label: 'Ad Revenue', color: 'blue', amount: '₦128,000' },
                    { value: 'platform',   label: 'Platform',   color: 'green', amount: '₦12,400' },
                  ].map(s => (
                    <button
                      key={s.value}
                      onClick={() => setWithdrawForm(p => ({ ...p, source: s.value }))}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${
                        withdrawForm.source === s.value
                          ? 'border-white/30 bg-white/10'
                          : 'border-white/8 bg-white/[0.02] hover:bg-white/5'
                      }`}
                    >
                      <span className="text-white text-xs font-bold">{s.label}</span>
                      <span className="text-white/40 text-[10px]">{s.amount}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1.5 block">Amount (₦) <span className="text-red-400">*</span></label>
                <Input
                  type="number"
                  placeholder="e.g. 50000"
                  value={withdrawForm.amount}
                  onChange={e => setWithdrawForm(p => ({ ...p, amount: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
                />
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1.5 block">Bank Name <span className="text-red-400">*</span></label>
                <select
                  value={withdrawForm.bank}
                  onChange={e => setWithdrawForm(p => ({ ...p, bank: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-md px-3 py-2"
                >
                  <option value="" className="bg-[#0d1220]">Select bank...</option>
                  {['GTBank','Zenith Bank','Access Bank','First Bank','UBA','Fidelity Bank','FCMB','Stanbic IBTC','Polaris Bank','Keystone Bank'].map(b => (
                    <option key={b} value={b} className="bg-[#0d1220]">{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1.5 block">Account Number <span className="text-red-400">*</span></label>
                <Input
                  type="text"
                  placeholder="10-digit account number"
                  maxLength={10}
                  value={withdrawForm.account}
                  onChange={e => setWithdrawForm(p => ({ ...p, account: e.target.value.replace(/\D/g, '') }))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono"
                />
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1.5 block">Note (optional)</label>
                <Input
                  placeholder="Reason for withdrawal..."
                  value={withdrawForm.note}
                  onChange={e => setWithdrawForm(p => ({ ...p, note: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
                />
              </div>
              <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3">
                <p className="text-amber-400/80 text-xs">⚠️ Withdrawal requests are processed manually. Funds will be transferred within 1–3 business days.</p>
              </div>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <Button variant="outline" onClick={() => setShowWithdrawModal(false)} className="flex-1 border-white/15 text-white/60 hover:bg-white/5">
                Cancel
              </Button>
              <Button onClick={handleWithdraw} disabled={submitting} className="flex-1 bg-red-600 hover:bg-red-700 border-0 gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Platform Balance" value="₦186,000" sub="Available" icon={DollarSign} trend="+₦8,420 today" trendUp color="blue" />
        <StatCard label="Commission Revenue" value="₦45,600" sub="All time" icon={Percent} trend="+12% this month" trendUp color="purple" />
        <StatCard label="Ad Revenue" value="₦128,000" sub="All campaigns" icon={Megaphone} trend="+31% this month" trendUp color="green" />
        <StatCard label="Pending Payouts" value="₦20,000" sub="1 request" icon={Clock} color="amber" />
      </div>

      {/* Flow chart + Pie */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-[#0d1220] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-sm">Revenue Flow (14 days)</h3>
            <div className="flex gap-3 text-xs">
              {[['#8b5cf6','Commission'],['#3b82f6','Ad Revenue']].map(([c,l]) => (
                <div key={l} className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{background:c}}/><span className="text-white/40">{l}</span></div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={flowData}>
              <defs>
                {[['commission','#8b5cf6'],['adRevenue','#3b82f6']].map(([k,c]) => (
                  <linearGradient key={k} id={`gw-${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={c} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="commission" name="Commission" stroke="#8b5cf6" fill="url(#gw-commission)" strokeWidth={2} />
              <Area type="monotone" dataKey="adRevenue" name="Ad Revenue" stroke="#3b82f6" fill="url(#gw-adRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#0d1220] p-6">
          <h3 className="text-white font-bold text-sm mb-4">Revenue Breakdown</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={v => `₦${Number(v).toLocaleString()}`} contentStyle={{ background: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i] }} />
                  <span className="text-white/50 text-xs">{d.name}</span>
                </div>
                <span className="text-white text-xs font-bold">₦{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Withdrawal requests */}
      <div className="rounded-2xl border border-white/8 bg-[#0d1220] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <h3 className="text-white font-bold text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" />Withdrawal Requests</h3>
          <Button onClick={() => setShowWithdrawModal(true)} size="sm" className="bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 gap-1.5 text-xs">
            <ArrowDownToLine className="w-3.5 h-3.5" /> Withdraw Funds
          </Button>
        </div>
        <div className="p-5 space-y-3">
          {withdrawals.map(w => (
            <div key={w.id} className="flex items-center gap-3 bg-white/[0.03] rounded-xl p-4 border border-white/5">
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">{w.requester}</p>
                <p className="text-white/40 text-xs">{w.bank} · Requested {w.requested}</p>
              </div>
              <div className="text-right mr-3">
                <p className="text-red-400 font-black">₦{w.amount.toLocaleString()}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${STATUS_CFG[w.status]?.class}`}>{STATUS_CFG[w.status]?.label}</span>
              </div>
              {w.status === 'pending' && (
                <div className="flex gap-1">
                  <button onClick={() => setWithdrawals(p => p.map(x => x.id===w.id?{...x,status:'completed'}:x))} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setWithdrawals(p => p.map(x => x.id===w.id?{...x,status:'failed'}:x))} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Transaction log */}
      <div className="rounded-2xl border border-white/8 bg-[#0d1220] overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-white/8">
          <h3 className="text-white font-bold text-sm">Revenue Transactions</h3>
          <div className="flex gap-2">
            <select value={txFilter} onChange={e => setTxFilter(e.target.value)} className="bg-white/5 border border-white/10 text-white text-xs rounded-lg px-3 py-1.5">
              <option value="all" className="bg-[#0d1220]">All Types</option>
              <option value="commission" className="bg-[#0d1220]">Commission</option>
              <option value="ad_revenue" className="bg-[#0d1220]">Ad Revenue</option>
              <option value="withdrawal" className="bg-[#0d1220]">Withdrawals</option>
            </select>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-white/70 text-xs rounded-lg hover:bg-white/10">
              <Download className="w-3.5 h-3.5" />Export
            </button>
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {filtered.map(tx => (
            <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02]">
              <div className={`text-[10px] px-2 py-0.5 rounded-md font-semibold flex-shrink-0 ${TX_TYPE[tx.type]?.color}`}>
                {TX_TYPE[tx.type]?.label}
              </div>
              <p className="text-white/70 text-sm flex-1">{tx.source}</p>
              <p className="text-white/40 text-xs flex-shrink-0">{tx.date}</p>
              <p className={`font-bold text-sm flex-shrink-0 ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {tx.amount > 0 ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString()}
              </p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md flex-shrink-0 ${STATUS_CFG[tx.status]?.class}`}>
                {STATUS_CFG[tx.status]?.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}