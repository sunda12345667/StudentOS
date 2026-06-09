import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import StatCard from '@/components/admin/StatCard';
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

  const pieData = [
    { name: 'Commission', value: totalCommission },
    { name: 'Ad Revenue', value: adRevenue },
    { name: 'Wallet Funding', value: totalFunded },
  ];

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