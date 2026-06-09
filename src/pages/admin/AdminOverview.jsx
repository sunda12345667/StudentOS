import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import StatCard from '@/components/admin/StatCard';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  DollarSign, Percent, ShoppingCart, Megaphone, Building2,
  TrendingUp, Users, Activity,
  Wallet, School, ShoppingBag, FileText
} from 'lucide-react';



export default function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [ads, setAds] = useState([]);
  const [advertisers, setAdvertisers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Order.list('-created_date', 100),
      base44.entities.AdCampaign.list('-created_date', 50),
      base44.entities.Advertiser.list('-created_date', 50),
      base44.entities.Transaction.list('-created_date', 100),
      base44.entities.Wallet.list('-created_date', 50),
      base44.entities.User.list('-created_date', 200),
      base44.entities.School.list('-created_date', 50),
      base44.entities.Post.list('-created_date', 500),
    ]).then(([o, a, adv, tx, w, u, s, p]) => {
      setOrders(o); setAds(a); setAdvertisers(adv); setTransactions(tx); setWallets(w); setUsers(u); setSchools(s); setPosts(p);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalSales = orders.reduce((s, o) => s + (o.price || 0), 0);
  const totalCommission = transactions.filter(t => t.type === 'escrow_release').reduce((s, t) => s + (t.amount || 0), 0);
  const activeAds = ads.filter(a => a.status === 'active').length;
  const adRevenue = ads.reduce((s, a) => s + (a.spent || 0), 0);
  const totalWalletBalance = wallets.reduce((s, w) => s + (w.balance || 0), 0);
  const totalFunded = wallets.reduce((s, w) => s + (w.total_funded || 0), 0);
  const totalSpent = wallets.reduce((s, w) => s + (w.total_spent || 0), 0);
  const totalEarned = wallets.reduce((s, w) => s + (w.total_earned || 0), 0);

  // Build last-7-days chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('en', { weekday: 'short' });
    const dateStr = d.toISOString().slice(0, 10);
    const newUsers = users.filter(u => u.created_date?.slice(0, 10) === dateStr).length;
    const newPosts = posts.filter(p => p.created_date?.slice(0, 10) === dateStr).length;
    return { day: label, Users: newUsers, Posts: newPosts };
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const activeUsersToday = users.filter(u => u.updated_date?.slice(0, 10) === todayStr).length;
  const postsToday = posts.filter(p => p.created_date?.slice(0, 10) === todayStr).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`₦${((totalCommission + adRevenue) || 0).toLocaleString()}`} sub="Commission + Ads" icon={DollarSign} iconColor="blue" />
        <StatCard label="Commission Earned" value={`₦${(totalCommission || 0).toLocaleString()}`} sub={`${orders.length} orders processed`} icon={Percent} iconColor="purple" />
        <StatCard label="Marketplace Sales" value={`₦${(totalSales || 0).toLocaleString()}`} sub={`${orders.length} total orders`} icon={ShoppingCart} iconColor="green" />
        <StatCard label="Active Ad Campaigns" value={activeAds} sub={`${advertisers.length} advertisers`} icon={Megaphone} iconColor="amber" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Ad Revenue" value={`₦${(adRevenue || 0).toLocaleString()}`} sub="From campaigns" icon={Building2} iconColor="pink" />
        <StatCard label="Total Wallet Balance" value={`₦${(totalWalletBalance || 0).toLocaleString()}`} sub={`${wallets.length} wallets`} icon={Wallet} iconColor="cyan" />
        <StatCard label="Total Funded" value={`₦${(totalFunded || 0).toLocaleString()}`} sub="All user wallets" icon={TrendingUp} iconColor="blue" />
        <StatCard label="Total Spent" value={`₦${(totalSpent || 0).toLocaleString()}`} sub="Marketplace spending" icon={ShoppingCart} iconColor="rose" />
      </div>

      {/* Revenue chart - placeholder for real data */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-foreground font-bold text-base">Revenue Overview</h3>
            <p className="text-muted-foreground text-xs mt-0.5">Real-time platform metrics</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Commission</p>
            <p className="text-2xl font-black text-primary">₦{totalCommission.toLocaleString()}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Ad Revenue</p>
            <p className="text-2xl font-black text-emerald-600">₦{adRevenue.toLocaleString()}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Total Sales</p>
            <p className="text-2xl font-black text-blue-600">₦{totalSales.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Live Activity Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Users Chart */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-bold text-sm">New Users (Last 7 Days)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Active today: <span className="font-bold text-primary">{activeUsersToday}</span></p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="h-48 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                  cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Bar dataKey="Users" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Posts Today Chart */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-bold text-sm">Posts Created (Last 7 Days)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Posted today: <span className="font-bold text-pink-600">{postsToday}</span></p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-pink-600" />
            </div>
          </div>
          <div className="h-48 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="Posts" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 4, fill: '#ec4899' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-foreground font-bold text-sm mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />Recent Transactions
          </h3>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No transactions yet</p>
              </div>
            ) : (
              transactions.slice(0, 8).map(tx => (
                <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    tx.type === 'fund' ? 'bg-emerald-500/20 text-emerald-600' :
                    tx.type === 'payment' ? 'bg-red-500/20 text-red-600' :
                    tx.type === 'escrow_release' ? 'bg-blue-500/20 text-blue-600' : 'bg-amber-500/20 text-amber-600'
                  }`}>
                    {tx.type[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.type} · {new Date(tx.created_date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Platform Stats */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-foreground font-bold text-sm mb-4">Platform Statistics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Total Users</span>
              </div>
              <span className="text-lg font-bold">{users.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-muted-foreground">Schools</span>
              </div>
              <span className="text-lg font-bold">{schools.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Active Orders</span>
              </div>
              <span className="text-lg font-bold">{orders.filter(o => o.status !== 'cancelled').length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-pink-600" />
                <span className="text-sm text-muted-foreground">Total Posts</span>
              </div>
              <span className="text-lg font-bold">{posts.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-muted-foreground">Ad Campaigns</span>
              </div>
              <span className="text-lg font-bold">{ads.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}