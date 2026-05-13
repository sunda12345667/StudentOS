import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import StatCard from '@/components/admin/StatCard';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  DollarSign, Percent, ShoppingCart, Megaphone, Building2,
  TrendingUp, Users, Clock, ArrowUpRight, Star, Activity
} from 'lucide-react';
import { format, subDays } from 'date-fns';

// Generate demo chart data
const generateRevenueData = () =>
  Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), 'MMM d'),
    revenue: Math.floor(Math.random() * 80000 + 20000),
    commission: Math.floor(Math.random() * 12000 + 3000),
    adRevenue: Math.floor(Math.random() * 25000 + 5000),
  }));

const userGrowthData = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
  users: Math.floor(Math.random() * 500 + i * 300 + 200),
  schools: Math.floor(Math.random() * 20 + i * 5 + 10),
}));

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1f35] border border-white/10 rounded-xl p-3 shadow-2xl">
      <p className="text-white/60 text-xs mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
          {p.name}: ₦{Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const RECENT_TRANSACTIONS = [
  { id: 1, type: 'Commission', amount: 4500, from: 'Physics Textbook Sale', status: 'completed', time: '2 min ago' },
  { id: 2, type: 'Ad Revenue', amount: 15000, from: 'TechCorp Campaign', status: 'completed', time: '18 min ago' },
  { id: 3, type: 'Commission', amount: 2100, from: 'Study Notes Bundle', status: 'completed', time: '1 hr ago' },
  { id: 4, type: 'Ad Revenue', amount: 8500, from: 'EduBrand Sidebar Ad', status: 'pending', time: '2 hr ago' },
  { id: 5, type: 'Commission', amount: 6300, from: 'Laptop Sale (Gadget)', status: 'completed', time: '3 hr ago' },
  { id: 6, type: 'Withdrawal', amount: -20000, from: 'Platform Payout', status: 'processing', time: '5 hr ago' },
];

const TOP_PRODUCTS = [
  { title: 'WAEC 2024 Past Questions', sales: 48, revenue: 72000, category: 'past_questions' },
  { title: 'HP Laptop 11th Gen i5', sales: 12, revenue: 168000, category: 'gadgets' },
  { title: 'Organic Chemistry Notes', sales: 34, revenue: 34000, category: 'notes' },
  { title: 'JavaScript Bootcamp Course', sales: 21, revenue: 84000, category: 'course' },
  { title: 'Biology Textbook Set', sales: 29, revenue: 58000, category: 'textbook' },
];

const STATUS_COLORS = { completed: 'text-emerald-400 bg-emerald-400/10', pending: 'text-amber-400 bg-amber-400/10', processing: 'text-blue-400 bg-blue-400/10' };

export default function AdminOverview() {
  const [revenueData] = useState(generateRevenueData);
  const [orders, setOrders] = useState([]);
  const [ads, setAds] = useState([]);
  const [advertisers, setAdvertisers] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Order.list('-created_date', 100),
      base44.entities.AdCampaign.list('-created_date', 50),
      base44.entities.Advertiser.list('-created_date', 50),
      base44.entities.Transaction.list('-created_date', 50),
    ]).then(([o, a, adv, tx]) => {
      setOrders(o); setAds(a); setAdvertisers(adv); setTransactions(tx);
    }).catch(() => {});
  }, []);

  const totalSales = orders.reduce((s, o) => s + (o.price || 0), 0);
  const totalCommission = transactions.filter(t => t.type === 'escrow_release').reduce((s, t) => s + (t.amount || 0) * 0.1, 0);
  const activeAds = ads.filter(a => a.status === 'active').length;
  const adRevenue = ads.reduce((s, a) => s + (a.spent || 0), 0);

  const pieData = [
    { name: 'Commission', value: totalCommission || 45600 },
    { name: 'Ad Revenue', value: adRevenue || 128000 },
    { name: 'Marketplace', value: totalSales * 0.02 || 23000 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`₦${((totalSales * 0.1 + adRevenue) || 196600).toLocaleString()}`} sub="All time" icon={DollarSign} trend="+18.4% this month" trendUp color="blue" />
        <StatCard label="Commission Earned" value={`₦${(totalCommission || 45600).toLocaleString()}`} sub="10% per sale" icon={Percent} trend="+12.1% vs last week" trendUp color="purple" />
        <StatCard label="Marketplace Sales" value={`₦${(totalSales || 456000).toLocaleString()}`} sub={`${orders.length || 38} orders`} icon={ShoppingCart} trend="+24.3% this month" trendUp color="green" />
        <StatCard label="Active Ad Campaigns" value={activeAds || 12} sub={`${advertisers.length || 8} advertisers`} icon={Megaphone} trend="+3 new this week" trendUp color="amber" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Ad Revenue" value={`₦${(adRevenue || 128000).toLocaleString()}`} sub="From campaigns" icon={Building2} trend="+31.2% vs last month" trendUp color="pink" />
        <StatCard label="Daily Earnings" value="₦8,420" sub="Today so far" icon={Activity} trend="+5.2% vs yesterday" trendUp color="cyan" />
        <StatCard label="Monthly Earnings" value="₦196,600" sub="May 2026" icon={TrendingUp} trend="+18.4% vs April" trendUp color="blue" />
        <StatCard label="Pending Payouts" value="₦20,000" sub="1 request" icon={Clock} color="amber" />
      </div>

      {/* Revenue chart */}
      <div className="rounded-2xl border border-white/8 bg-[#0d1220] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white font-bold text-base">Revenue Overview</h3>
            <p className="text-white/40 text-xs mt-0.5">Last 30 days breakdown</p>
          </div>
          <div className="flex gap-4 text-xs">
            {[['#3b82f6','Total Revenue'],['#8b5cf6','Commission'],['#10b981','Ad Revenue']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{background:c}}/><span className="text-white/50">{l}</span></div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={revenueData}>
            <defs>
              {[['revenue','#3b82f6'],['commission','#8b5cf6'],['adRevenue','#10b981']].map(([k,c]) => (
                <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={c} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={c} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="url(#g-revenue)" strokeWidth={2} />
            <Area type="monotone" dataKey="commission" name="Commission" stroke="#8b5cf6" fill="url(#g-commission)" strokeWidth={2} />
            <Area type="monotone" dataKey="adRevenue" name="Ad Revenue" stroke="#10b981" fill="url(#g-adRevenue)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-[#0d1220] p-6">
          <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />Recent Transactions
          </h3>
          <div className="space-y-3">
            {RECENT_TRANSACTIONS.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  tx.type === 'Commission' ? 'bg-purple-500/20 text-purple-400' :
                  tx.type === 'Ad Revenue' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {tx.type[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{tx.from}</p>
                  <p className="text-white/40 text-xs">{tx.type} · {tx.time}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString()}
                  </p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${STATUS_COLORS[tx.status]}`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue split pie */}
        <div className="rounded-2xl border border-white/8 bg-[#0d1220] p-6">
          <h3 className="text-white font-bold text-sm mb-4">Revenue Sources</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => `₦${Number(v).toLocaleString()}`} contentStyle={{ background: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i] }} />
                  <span className="text-white/60 text-xs">{d.name}</span>
                </div>
                <span className="text-white text-xs font-bold">₦{Number(d.value).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products + User Growth */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="rounded-2xl border border-white/8 bg-[#0d1220] p-6">
          <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />Top Selling Products
          </h3>
          <div className="space-y-3">
            {TOP_PRODUCTS.map((p, i) => (
              <div key={p.title} className="flex items-center gap-3">
                <span className="text-white/20 text-xs font-mono w-4">0{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{p.title}</p>
                  <p className="text-white/40 text-xs">{p.sales} sales</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 text-sm font-bold">₦{p.revenue.toLocaleString()}</p>
                  <p className="text-purple-400 text-[10px]">+₦{Math.round(p.revenue * 0.1).toLocaleString()} comm.</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User growth */}
        <div className="rounded-2xl border border-white/8 bg-[#0d1220] p-6">
          <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />User Growth
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
              <Bar dataKey="users" name="Users" fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="schools" name="Schools" fill="#8b5cf6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}