import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import StatCard from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { Percent, DollarSign, TrendingUp, Download, Settings, Filter, Search, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';

const generateDailyCommission = () =>
  Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), 'MMM d'),
    commission: Math.floor(Math.random() * 8000 + 1000),
    sales: Math.floor(Math.random() * 80000 + 10000),
  }));

const DEMO_TRANSACTIONS = [
  { id: 1, product: 'WAEC 2024 Past Questions', seller: 'Adaeze O.', buyer: 'Chukwu E.', category: 'past_questions', amount: 1500, commission: 150, status: 'completed', date: '2026-05-13' },
  { id: 2, product: 'HP Laptop 11th Gen', seller: 'Emeka B.', buyer: 'Fatima A.', category: 'gadgets', amount: 14000, commission: 1400, status: 'completed', date: '2026-05-13' },
  { id: 3, product: 'Organic Chemistry Notes', seller: 'Aisha M.', buyer: 'Tobenna C.', category: 'notes', amount: 1000, commission: 100, status: 'pending', date: '2026-05-12' },
  { id: 4, product: 'JavaScript Bootcamp', seller: 'Daniel F.', buyer: 'Ngozi P.', category: 'course', amount: 4000, commission: 400, status: 'completed', date: '2026-05-12' },
  { id: 5, product: 'Biology Textbook', seller: 'Chioma R.', buyer: 'Babatunde K.', category: 'textbook', amount: 2000, commission: 200, status: 'completed', date: '2026-05-11' },
  { id: 6, product: 'Physics Handout Pack', seller: 'Bello S.', buyer: 'Ifeoma D.', category: 'handouts', amount: 800, commission: 80, status: 'failed', date: '2026-05-11' },
  { id: 7, product: 'Java Tutorial Series', seller: 'Seun A.', buyer: 'Gbenga O.', category: 'tutorial', amount: 3500, commission: 350, status: 'completed', date: '2026-05-10' },
];

const STATUS_CFG = {
  completed: { label: 'Completed', class: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  pending:   { label: 'Pending',   class: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
  failed:    { label: 'Failed',    class: 'bg-red-400/10 text-red-400 border-red-400/20' },
};

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

export default function AdminCommission() {
  const [chartData] = useState(generateDailyCommission);
  const [rate, setRate] = useState('10');
  const [editingRate, setEditingRate] = useState(false);
  const [search, setSearch] = useState('');
  const [commissions, setCommissions] = useState(DEMO_TRANSACTIONS);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    base44.entities.CommissionConfig.list().then(list => {
      if (list.length) setConfig(list[0]);
      else setRate('10');
    }).catch(() => {});
  }, []);

  const saveRate = async () => {
    const r = Number(rate);
    if (isNaN(r) || r < 0 || r > 50) { toast.error('Rate must be between 0 and 50'); return; }
    if (config) {
      await base44.entities.CommissionConfig.update(config.id, { rate: r });
    } else {
      await base44.entities.CommissionConfig.create({ rate: r, is_active: true });
    }
    toast.success(`Commission rate updated to ${r}%`);
    setEditingRate(false);
  };

  const filtered = commissions.filter(tx =>
    !search || tx.product.toLowerCase().includes(search.toLowerCase()) ||
    tx.seller.toLowerCase().includes(search.toLowerCase()) ||
    tx.buyer.toLowerCase().includes(search.toLowerCase())
  );

  const totalCommission = commissions.filter(t => t.status === 'completed').reduce((s, t) => s + t.commission, 0);
  const totalSales = commissions.filter(t => t.status === 'completed').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Commission" value={`₦${totalCommission.toLocaleString()}`} sub="All time" icon={Percent} trend="+12.1% this month" trendUp color="purple" />
        <StatCard label="Total Sales Volume" value={`₦${totalSales.toLocaleString()}`} icon={DollarSign} color="blue" />
        <StatCard label="Current Rate" value={`${config?.rate || 10}%`} sub="Per transaction" icon={Settings} color="amber" />
        <StatCard label="Monthly Commission" value="₦45,600" icon={TrendingUp} trend="+8.3% vs last month" trendUp color="green" />
      </div>

      {/* Rate control + chart */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Rate card */}
        <div className="rounded-2xl border border-white/8 bg-[#0d1220] p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-white font-bold text-sm mb-1">Commission Rate</h3>
            <p className="text-white/40 text-xs mb-5">Platform deduction on every sale</p>
            <div className="text-center py-6">
              {editingRate ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Input
                      type="number"
                      value={rate}
                      onChange={e => setRate(e.target.value)}
                      className="w-24 text-center text-2xl font-black bg-white/5 border-white/20 text-white"
                    />
                    <span className="text-white text-3xl font-black">%</span>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveRate} size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 border-0 text-xs">Save</Button>
                    <Button onClick={() => setEditingRate(false)} size="sm" variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10 text-xs">Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-400">{config?.rate || 10}</p>
                  <p className="text-white/40 text-sm mt-1">% per transaction</p>
                  <Button onClick={() => setEditingRate(true)} size="sm" className="mt-4 bg-white/10 hover:bg-white/20 border-0 text-white text-xs gap-1.5">
                    <Settings className="w-3 h-3" />Edit Rate
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="space-y-1.5 pt-4 border-t border-white/8">
            {['textbook','notes','gadgets','course'].map((cat, i) => (
              <div key={cat} className="flex items-center justify-between text-xs">
                <span className="text-white/40 capitalize">{cat}</span>
                <span className="text-white/70 font-semibold">{config?.rate || 10}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-[#0d1220] p-6">
          <h3 className="text-white font-bold text-sm mb-4">Daily Commission Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="commission" name="Commission" stroke="#8b5cf6" fill="url(#gc)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/8 bg-[#0d1220] overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-white/8">
          <h3 className="text-white font-bold text-sm">Commission Transactions</h3>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
              <Search className="w-3.5 h-3.5 text-white/40" />
              <input className="bg-transparent text-white text-xs placeholder-white/30 outline-none w-36" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Button size="sm" variant="outline" className="border-white/20 text-white/70 hover:bg-white/10 gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" />Export
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Product','Seller','Buyer','Category','Amount','Commission','Status','Date',''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-white/40 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => (
                <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-white text-sm font-medium max-w-[160px]">
                    <span className="truncate block">{tx.product}</span>
                  </td>
                  <td className="px-5 py-3 text-white/70 text-sm">{tx.seller}</td>
                  <td className="px-5 py-3 text-white/70 text-sm">{tx.buyer}</td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 capitalize">{tx.category}</span>
                  </td>
                  <td className="px-5 py-3 text-white font-semibold text-sm">₦{tx.amount.toLocaleString()}</td>
                  <td className="px-5 py-3 text-purple-400 font-bold text-sm">₦{tx.commission.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${STATUS_CFG[tx.status].class}`}>
                      {STATUS_CFG[tx.status].label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-white/40 text-xs">{tx.date}</td>
                  <td className="px-5 py-3">
                    {tx.status === 'pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => setCommissions(c => c.map(t => t.id===tx.id?{...t,status:'completed'}:t))} className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5"/>
                        </button>
                        <button onClick={() => setCommissions(c => c.map(t => t.id===tx.id?{...t,status:'failed'}:t))} className="p-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                          <XCircle className="w-3.5 h-3.5"/>
                        </button>
                      </div>
                    )}
                    {tx.status === 'completed' && (
                      <button onClick={() => { setCommissions(c => c.map(t => t.id===tx.id?{...t,status:'pending'}:t)); toast.info('Marked for refund review'); }} className="p-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20">
                        <RefreshCw className="w-3.5 h-3.5"/>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}