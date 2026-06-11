import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Users, UserCheck, TrendingUp, UserPlus } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-bold">
          {p.dataKey}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function UserAnalyticsPanel({ users }) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const activeToday = useMemo(() =>
    users.filter(u => u.updated_date?.slice(0, 10) === todayStr).length,
    [users, todayStr]
  );

  const newThisWeek = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return users.filter(u => new Date(u.created_date) >= weekAgo).length;
  }, [users]);

  // Last 30 days sign-up trend (grouped by day)
  const signupTrend = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const label = i % 5 === 0
        ? d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
        : '';
      const count = users.filter(u => u.created_date?.slice(0, 10) === dateStr).length;
      return { date: label || dateStr.slice(5), Signups: count };
    });
  }, [users]);

  // Last 7 days daily active (by updated_date as proxy)
  const dailyActive = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en', { weekday: 'short' });
      const count = users.filter(u => u.updated_date?.slice(0, 10) === dateStr).length;
      return { day: label, Active: count };
    });
  }, [users]);

  const statItems = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Active Today', value: activeToday, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'New This Week', value: newThisWeek, icon: UserPlus, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { label: 'Avg/Day (30d)', value: Math.round(signupTrend.reduce((s, d) => s + d.Signups, 0) / 30), icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-5">
      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-black">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* 30-day signup trend */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-bold text-sm mb-1">Sign-up Trend (Last 30 Days)</h3>
          <p className="text-xs text-muted-foreground mb-4">New registrations per day</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signupTrend}>
                <defs>
                  <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Signups" stroke="hsl(var(--primary))" fill="url(#signupGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-day daily active */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-bold text-sm mb-1">Daily Active Participants (Last 7 Days)</h3>
          <p className="text-xs text-muted-foreground mb-4">Users with activity each day</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyActive} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Active" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}