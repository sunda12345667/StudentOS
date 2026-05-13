import { useState } from 'react';
import StatCard from '@/components/admin/StatCard';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Users, ShoppingCart, Megaphone, School, Download } from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const platformGrowth = MONTHS.map((m, i) => ({
  month: m,
  users: Math.floor(Math.random() * 500 + i * 400 + 300),
  schools: Math.floor(Math.random() * 15 + i * 4 + 5),
  revenue: Math.floor(Math.random() * 50000 + i * 15000 + 20000),
}));

const categoryData = [
  { name: 'Textbooks', sales: 142, revenue: 213000 },
  { name: 'Gadgets', sales: 38, revenue: 532000 },
  { name: 'Notes', sales: 234, revenue: 117000 },
  { name: 'Past Q.', sales: 310, revenue: 465000 },
  { name: 'Courses', sales: 87, revenue: 348000 },
  { name: 'Handouts', sales: 198, revenue: 59400 },
];

const engagementRadar = [
  { subject: 'Posts', value: 87 },
  { subject: 'Comments', value: 72 },
  { subject: 'Reels', value: 64 },
  { subject: 'Stories', value: 91 },
  { subject: 'Messages', value: 78 },
  { subject: 'Marketplace', value: 55 },
];

const topSchools = [
  { name: 'University of Lagos', students: 1240, sales: 48, revenue: 192000 },
  { name: 'OAU Ile-Ife', students: 980, sales: 34, revenue: 136000 },
  { name: 'UNIABUJA', students: 870, sales: 29, revenue: 116000 },
  { name: 'BUK Kano', students: 750, sales: 22, revenue: 88000 },
  { name: 'LASU', students: 620, sales: 18, revenue: 72000 },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1f35] border border-white/10 rounded-xl p-3">
      <p className="text-white/60 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-bold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.name?.includes('Revenue') ? `₦${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState('year');

  return (
    <div className="space-y-6">
      {/* Header filters */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['week','month','quarter','year'].map(r => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                dateRange === r
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-white/50 hover:text-white border border-white/10'
              }`}>
              {r}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-white/70 text-xs rounded-lg hover:bg-white/10">
          <Download className="w-3.5 h-3.5" />Export Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value="8,234" icon={Users} trend="+28% YoY" trendUp color="blue" />
        <StatCard label="Total Schools" value="142" icon={School} trend="+15 this quarter" trendUp color="purple" />
        <StatCard label="Total Orders" value="1,847" icon={ShoppingCart} trend="+34% vs last year" trendUp color="green" />
        <StatCard label="Active Campaigns" value="12" icon={Megaphone} trend="+3 new this month" trendUp color="amber" />
      </div>

      {/* Platform Growth */}
      <div className="rounded-2xl border border-white/8 bg-[#0d1220] p-6">
        <h3 className="text-white font-bold text-sm mb-4">Platform Growth (12 months)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={platformGrowth}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Line yAxisId="left" type="monotone" dataKey="users" name="Users" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
            <Line yAxisId="left" type="monotone" dataKey="schools" name="Schools" stroke="#8b5cf6" strokeWidth={2.5} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category + Engagement */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/8 bg-[#0d1220] p-6">
          <h3 className="text-white font-bold text-sm mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={65} />
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} formatter={v => `₦${Number(v).toLocaleString()}`} />
              <Bar dataKey="revenue" name="Revenue" radius={[0,4,4,0]}>
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#0d1220] p-6">
          <h3 className="text-white font-bold text-sm mb-4">Engagement Analytics</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={engagementRadar}>
              <PolarGrid stroke="rgba(255,255,255,0.07)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <Radar name="Engagement" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Schools */}
      <div className="rounded-2xl border border-white/8 bg-[#0d1220] overflow-hidden">
        <div className="p-5 border-b border-white/8">
          <h3 className="text-white font-bold text-sm">Top Schools by Revenue</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['#','School','Students','Marketplace Sales','Revenue Generated'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-white/40 text-xs font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topSchools.map((s, i) => (
                <tr key={s.name} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-white/30 text-xs font-mono">0{i+1}</td>
                  <td className="px-5 py-3 text-white font-semibold text-sm">{s.name}</td>
                  <td className="px-5 py-3 text-blue-400 text-sm">{s.students.toLocaleString()}</td>
                  <td className="px-5 py-3 text-purple-400 text-sm">{s.sales}</td>
                  <td className="px-5 py-3 text-emerald-400 font-bold text-sm">₦{s.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}