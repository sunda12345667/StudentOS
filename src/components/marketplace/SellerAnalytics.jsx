import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  DollarSign, Package, ShoppingCart, Eye, Star, TrendingUp,
  Clock, Truck, CheckCircle2, XCircle, AlertTriangle, Loader2, BarChart2
} from 'lucide-react';
import { format, subDays, parseISO, startOfDay } from 'date-fns';

const ORDER_STATUS_COLORS = {
  pending:     '#94a3b8',
  escrow_held: '#f59e0b',
  shipped:     '#3b82f6',
  delivered:   '#6366f1',
  completed:   '#22c55e',
  disputed:    '#ef4444',
  cancelled:   '#d1d5db',
};

const ORDER_STATUS_ICONS = {
  pending:     Clock,
  escrow_held: AlertTriangle,
  shipped:     Truck,
  delivered:   Package,
  completed:   CheckCircle2,
  disputed:    AlertTriangle,
  cancelled:   XCircle,
};

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-black leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          {sub && <p className="text-[11px] text-emerald-600 font-medium mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function SellerAnalytics({ user }) {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    Promise.all([
      base44.entities.MarketItem.filter({ seller_email: user.email }, '-created_date', 100),
      base44.entities.Order.filter({ seller_email: user.email }, '-created_date', 200),
      base44.entities.Review.filter({ seller_email: user.email }, '-created_date', 200),
    ]).then(([i, o, r]) => { setItems(i); setOrders(o); setReviews(r); })
      .finally(() => setLoading(false));
  }, [user?.email]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;

  // --- KPIs ---
  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.price || 0), 0);
  const activeListings = items.filter(i => i.status === 'available').length;
  const totalViews = items.reduce((s, i) => s + (i.views || 0), 0);
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';
  const pendingOrders = orders.filter(o => ['pending', 'escrow_held', 'shipped'].includes(o.status)).length;

  // --- Order status breakdown for Pie ---
  const statusGroups = Object.entries(
    orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value, color: ORDER_STATUS_COLORS[name] || '#94a3b8' }));

  // --- Daily views trend (last 14 days) from listings created_date proxy ---
  // We'll use orders + reviews over last 14 days as growth data
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(), 13 - i);
    const label = format(d, 'MMM d');
    const dayStr = format(d, 'yyyy-MM-dd');
    const dayOrders = orders.filter(o => o.created_date?.startsWith(dayStr)).length;
    const dayReviews = reviews.filter(r => r.created_date?.startsWith(dayStr)).length;
    return { label, orders: dayOrders, reviews: dayReviews };
  });

  // --- Revenue by category ---
  const revByCat = Object.entries(
    orders.filter(o => o.status === 'completed').reduce((acc, o) => {
      const item = items.find(i => i.id === o.item_id);
      const cat = item?.category || 'other';
      acc[cat] = (acc[cat] || 0) + (o.price || 0);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value).slice(0, 6);

  // --- Top listings by views ---
  const topItems = [...items].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-black">Seller Analytics</h2>
        <Badge variant="outline" className="ml-auto text-xs">{format(new Date(), 'MMM yyyy')}</Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={DollarSign} label="Total Revenue" value={`₦${totalRevenue.toLocaleString()}`} color="bg-emerald-100 text-emerald-700" />
        <StatCard icon={Package} label="Active Listings" value={activeListings} color="bg-blue-100 text-blue-700" />
        <StatCard icon={ShoppingCart} label="Pending Orders" value={pendingOrders} color="bg-amber-100 text-amber-700" />
        <StatCard icon={Eye} label="Total Views" value={totalViews.toLocaleString()} color="bg-violet-100 text-violet-700" />
        <StatCard icon={Star} label="Avg. Rating" value={avgRating} sub={reviews.length ? `${reviews.length} reviews` : ''} color="bg-orange-100 text-orange-700" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Growth trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Orders & Reviews — Last 14 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={last14} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={2} dot={false} name="Orders" />
                <Line type="monotone" dataKey="reviews" stroke="#f59e0b" strokeWidth={2} dot={false} name="Reviews" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order status pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-primary" />Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusGroups.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">No orders yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusGroups} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name.replace('_', ' ')} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                    {statusGroups.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n.replace('_', ' ')]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue by category */}
      {revByCat.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-600" />Revenue by Category (₦)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={revByCat} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} formatter={v => `₦${v}`} />
                <Bar dataKey="value" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top listings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2"><Eye className="w-4 h-4 text-violet-600" />Top Listings by Views</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No listings yet</p>
          ) : topItems.map((item, i) => (
            <div key={item.id} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{item.category?.replace('_', ' ')} · {item.status}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-black text-primary">₦{Number(item.price).toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-0.5 justify-end"><Eye className="w-3 h-3" />{item.views || 0}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Order status detail */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-primary" />Order Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(ORDER_STATUS_COLORS).map(([status, color]) => {
              const count = orders.filter(o => o.status === status).length;
              const Icon = ORDER_STATUS_ICONS[status] || Package;
              return (
                <div key={status} className="rounded-xl border p-3 flex items-center gap-2">
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                  <div>
                    <p className="font-black text-lg leading-none">{count}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">{status.replace('_', ' ')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}