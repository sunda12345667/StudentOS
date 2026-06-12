import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import StatCard from '@/components/admin/StatCard';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  DollarSign, ShoppingCart, Megaphone, Building2,
  TrendingUp, Users, Activity,
  Wallet, School, ShoppingBag, FileText, Globe, Film,
  BookOpen, MessageSquare, Flag, Video, Bot
} from 'lucide-react';
import UserAnalyticsPanel from '@/components/admin/UserAnalyticsPanel';



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
  const [communities, setCommunities] = useState([]);
  const [reels, setReels] = useState([]);
  const [courses, setCourses] = useState([]);
  const [comments, setComments] = useState([]);
  const [marketItems, setMarketItems] = useState([]);
  const [postReports, setPostReports] = useState([]);
  const [contentReports, setContentReports] = useState([]);
  const [tutorConvos, setTutorConvos] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [campusGroups, setCampusGroups] = useState([]);

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Order.list('-created_date', 200),
      base44.entities.AdCampaign.list('-created_date', 100),
      base44.entities.Advertiser.list('-created_date', 100),
      base44.entities.Transaction.list('-created_date', 500),
      base44.entities.Wallet.list('-created_date', 500),
      base44.entities.User.list('-created_date', 500),
      base44.entities.School.list('-created_date', 100),
      base44.entities.Post.list('-created_date', 500),
      base44.entities.Community.list('-created_date', 200),
      base44.entities.Reel.list('-created_date', 200),
      base44.entities.Course.list('-created_date', 200),
      base44.entities.Comment.list('-created_date', 500),
      base44.entities.MarketItem.list('-created_date', 200),
      base44.entities.PostReport.list('-created_date', 200),
      base44.entities.ContentReport.list('-created_date', 200).catch(() => []),
      base44.entities.TutorConversation.list('-created_date', 200).catch(() => []),
      base44.entities.WithdrawalRequest.list('-created_date', 200).catch(() => []),
      base44.entities.CampusGroup.list('-created_date', 100).catch(() => []),
    ]).then(([o, a, adv, tx, w, u, s, p, c, r, crs, cmt, mi, pr, cr, tc, wd, cg]) => {
      setOrders(o); setAds(a); setAdvertisers(adv); setTransactions(tx); setWallets(w);
      setUsers(u); setSchools(s); setPosts(p); setCommunities(c); setReels(r);
      setCourses(crs); setComments(cmt); setMarketItems(mi); setPostReports(pr);
      setContentReports(cr); setTutorConvos(tc); setWithdrawals(wd); setCampusGroups(cg);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const unsubTx = base44.entities.Transaction.subscribe(() => load());
    const unsubW = base44.entities.Wallet.subscribe(() => load());
    const unsubP = base44.entities.Post.subscribe(() => load());
    return () => { unsubTx(); unsubW(); unsubP(); };
  }, []);

  // Financial metrics — all from real DB records
  const totalSales = orders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.price || 0), 0);
  const totalCommission = transactions.filter(t => t.type === 'escrow_release').reduce((s, t) => s + (t.amount || 0), 0);
  const activeAds = ads.filter(a => a.status === 'active').length;
  const adRevenue = ads.reduce((s, a) => s + (a.spent || 0), 0);
  const totalWalletBalance = wallets.reduce((s, w) => s + (w.balance || 0), 0);
  const totalFunded = wallets.reduce((s, w) => s + (w.total_funded || 0), 0);
  const totalSpent = wallets.reduce((s, w) => s + (w.total_spent || 0), 0);
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;
  const withdrawalAmount = withdrawals.filter(w => w.status === 'approved').reduce((s, w) => s + (w.amount || 0), 0);

  // Content metrics
  const verifiedSchools = schools.filter(s => s.verified).length;
  const activeMarketItems = marketItems.filter(m => m.status === 'available').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalReports = postReports.length + contentReports.length;
  const pendingReports = postReports.filter(r => r.status === 'pending').length + contentReports.filter(r => r.status === 'pending').length;
  const flaggedReels = reels.filter(r => r.moderation_status === 'flagged' || r.moderation_status === 'suspended').length;

  // Chart data — real records
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
      {/* Row 1: Users & Revenue */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={users.length} sub={`Active today: ${activeUsersToday}`} icon={Users} iconColor="blue" />
        <StatCard label="Total Revenue" value={`₦${((totalCommission + adRevenue) || 0).toLocaleString()}`} sub="Commission + Ads" icon={DollarSign} iconColor="purple" />
        <StatCard label="Marketplace Sales" value={`₦${(totalSales || 0).toLocaleString()}`} sub={`${completedOrders} completed orders`} icon={ShoppingCart} iconColor="green" />
        <StatCard label="Active Ad Campaigns" value={activeAds} sub={`${advertisers.length} advertisers`} icon={Megaphone} iconColor="amber" />
      </div>

      {/* Row 2: Wallet & Withdrawals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Ad Revenue" value={`₦${(adRevenue || 0).toLocaleString()}`} sub="From campaigns" icon={Building2} iconColor="pink" />
        <StatCard label="Total Wallet Balance" value={`₦${(totalWalletBalance || 0).toLocaleString()}`} sub={`${wallets.length} wallets`} icon={Wallet} iconColor="cyan" />
        <StatCard label="Total Funded" value={`₦${(totalFunded || 0).toLocaleString()}`} sub="All user wallets" icon={TrendingUp} iconColor="blue" />
        <StatCard label="Withdrawals Paid" value={`₦${(withdrawalAmount || 0).toLocaleString()}`} sub={`${pendingWithdrawals} pending`} icon={ShoppingCart} iconColor="rose" />
      </div>

      {/* Row 3: Content metrics — all from DB */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Posts" value={posts.length} sub={`${postsToday} today`} icon={FileText} iconColor="pink" />
        <StatCard label="Communities" value={communities.length} sub={`${campusGroups.length} campus groups`} icon={Globe} iconColor="cyan" />
        <StatCard label="Courses" value={courses.length} sub="All time" icon={BookOpen} iconColor="green" />
        <StatCard label="Total Reels" value={reels.length} sub={`${flaggedReels} flagged`} icon={Film} iconColor="purple" />
      </div>

      {/* Row 4: Moderation & Platform */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Verified Schools" value={verifiedSchools} sub={`${schools.length} total`} icon={School} iconColor="amber" />
        <StatCard label="Market Listings" value={activeMarketItems} sub={`${marketItems.length} total`} icon={ShoppingBag} iconColor="blue" />
        <StatCard label="Total Reports" value={totalReports} sub={`${pendingReports} pending review`} icon={Flag} iconColor="rose" />
        <StatCard label="AI Tutor Sessions" value={tutorConvos.length} sub="All conversations" icon={Bot} iconColor="purple" />
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

      {/* User Analytics Panel */}
      <UserAnalyticsPanel users={users} />

      {/* Posts activity chart */}
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
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="Posts" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 4, fill: '#ec4899' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
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

        {/* Platform Stats — all real DB data */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-foreground font-bold text-sm mb-4">Platform Statistics</h3>
          <div className="space-y-2">
            {[
              { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-600' },
              { label: 'Verified Schools', value: verifiedSchools, icon: School, color: 'text-purple-600' },
              { label: 'Communities', value: communities.length, icon: Globe, color: 'text-cyan-600' },
              { label: 'Campus Groups', value: campusGroups.length, icon: Globe, color: 'text-teal-600' },
              { label: 'Total Courses', value: courses.length, icon: BookOpen, color: 'text-emerald-600' },
              { label: 'Market Listings', value: marketItems.length, icon: ShoppingBag, color: 'text-green-600' },
              { label: 'Completed Orders', value: completedOrders, icon: ShoppingCart, color: 'text-green-700' },
              { label: 'Total Posts', value: posts.length, icon: FileText, color: 'text-pink-600' },
              { label: 'Comments', value: comments.length, icon: MessageSquare, color: 'text-indigo-600' },
              { label: 'Total Reels', value: reels.length, icon: Film, color: 'text-violet-600' },
              { label: 'AI Tutor Sessions', value: tutorConvos.length, icon: Bot, color: 'text-amber-600' },
              { label: 'Ad Campaigns', value: ads.length, icon: Megaphone, color: 'text-orange-600' },
              { label: 'Pending Reports', value: pendingReports, icon: Flag, color: 'text-red-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
                <span className="text-base font-bold">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}