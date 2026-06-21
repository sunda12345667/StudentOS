import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
  Wallet, TrendingUp, Clock, Unlock, ArrowDownLeft, ArrowUpRight,
  ShoppingCart, Package, Loader2, RefreshCw, DollarSign, BarChart2,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { getOrCreateWallet } from '@/lib/wallet';

const TX_CFG = {
  deposit:        { label: 'Deposit',           color: 'text-emerald-600', bg: 'bg-emerald-50',  sign: '+', icon: ArrowDownLeft },
  purchase:       { label: 'Purchase',          color: 'text-red-500',     bg: 'bg-red-50',      sign: '-', icon: ShoppingCart },
  sale:           { label: 'Sale (Pending)',     color: 'text-amber-600',   bg: 'bg-amber-50',    sign: '+', icon: Package },
  escrow_release: { label: 'Earnings Released', color: 'text-emerald-600', bg: 'bg-emerald-50',  sign: '+', icon: Unlock },
  withdrawal:     { label: 'Withdrawal',        color: 'text-violet-600',  bg: 'bg-violet-50',   sign: '-', icon: ArrowUpRight },
  refund:         { label: 'Refund',            color: 'text-blue-600',    bg: 'bg-blue-50',     sign: '+', icon: RefreshCw },
  commission:     { label: 'Commission',        color: 'text-orange-500',  bg: 'bg-orange-50',   sign: '-', icon: DollarSign },
  // legacy
  fund:           { label: 'Deposit',           color: 'text-emerald-600', bg: 'bg-emerald-50',  sign: '+', icon: ArrowDownLeft },
  payment:        { label: 'Purchase',          color: 'text-red-500',     bg: 'bg-red-50',      sign: '-', icon: ShoppingCart },
  escrow_hold:    { label: 'Escrow Hold',       color: 'text-amber-600',   bg: 'bg-amber-50',    sign: '-', icon: Clock },
};

const WD_STATUS = {
  pending:      { label: 'Pending Review', class: 'bg-amber-100 text-amber-700' },
  under_review: { label: 'Under Review',   class: 'bg-blue-100 text-blue-700' },
  approved:     { label: 'Approved',       class: 'bg-emerald-100 text-emerald-700' },
  paid:         { label: 'Paid',           class: 'bg-emerald-200 text-emerald-800' },
  rejected:     { label: 'Rejected',       class: 'bg-red-100 text-red-700' },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>₦{Number(p.value).toLocaleString()}</strong></p>
      ))}
    </div>
  );
};

function TxRow({ tx }) {
  const cfg = TX_CFG[tx.type] || TX_CFG.deposit;
  const Icon = cfg.icon;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{cfg.label}{tx.item_title ? ` — ${tx.item_title}` : ''}</p>
        <p className="text-[11px] text-muted-foreground truncate">{tx.description}</p>
        <p className="text-[10px] text-muted-foreground">{tx.created_date ? format(new Date(tx.created_date), 'MMM d, yyyy · h:mm a') : ''}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`font-black text-sm ${cfg.sign === '+' ? 'text-emerald-600' : 'text-red-500'}`}>
          {cfg.sign}₦{Number(tx.amount || 0).toLocaleString()}
        </p>
        {tx.status && tx.status !== 'completed' && (
          <span className="text-[10px] text-amber-600">{tx.status}</span>
        )}
      </div>
    </div>
  );
}

export default function UserFinancialDashboard({ user }) {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const load = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    const [w, txs, wrs, buyOrders, sellOrders] = await Promise.all([
      getOrCreateWallet(user.email, user.full_name),
      base44.entities.Transaction.filter({ user_email: user.email }, '-created_date', 100),
      base44.entities.WithdrawalRequest.filter({ user_email: user.email }, '-created_date', 50),
      base44.entities.Order.filter({ buyer_email: user.email }, '-created_date', 50),
      base44.entities.Order.filter({ seller_email: user.email }, '-created_date', 50),
    ]);
    setWallet(w);
    setTransactions(txs);
    setWithdrawals(wrs);
    // Merge orders, tag direction
    const merged = [
      ...buyOrders.map(o => ({ ...o, _dir: 'buy' })),
      ...sellOrders.map(o => ({ ...o, _dir: 'sell' })),
    ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    setOrders(merged);
    setLoading(false);
  }, [user?.email]);

  useEffect(() => { load(); }, [load]);

  // Monthly earnings chart (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subDays(new Date(), (5 - i) * 30);
    const label = format(d, 'MMM');
    const monthStr = format(d, 'yyyy-MM');
    const earned = transactions
      .filter(t => ['sale', 'escrow_release'].includes(t.type) && t.created_date?.startsWith(monthStr))
      .reduce((s, t) => s + (t.amount || 0), 0);
    const spent = transactions
      .filter(t => ['purchase', 'payment'].includes(t.type) && t.created_date?.startsWith(monthStr))
      .reduce((s, t) => s + (t.amount || 0), 0);
    return { label, Earnings: earned, Spent: spent };
  });

  // Tab filter helpers
  const deposits = transactions.filter(t => ['deposit', 'fund'].includes(t.type));
  const purchases = transactions.filter(t => ['purchase', 'payment'].includes(t.type));
  const sales = transactions.filter(t => ['sale', 'escrow_release', 'escrow_hold'].includes(t.type));
  const pendingWithdrawals = withdrawals.filter(w => ['pending', 'under_review'].includes(w.status));
  const completedWithdrawals = withdrawals.filter(w => ['approved', 'paid'].includes(w.status));

  const TABS = [
    { id: 'overview',   label: 'Overview' },
    { id: 'deposits',   label: `Deposits (${deposits.length})` },
    { id: 'purchases',  label: `Purchases (${purchases.length})` },
    { id: 'sales',      label: `Sales (${sales.length})` },
    { id: 'withdrawals',label: `Withdrawals (${withdrawals.length})` },
    { id: 'orders',     label: `Orders (${orders.length})` },
  ];

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;

  const walletBal = wallet?.wallet_balance || 0;
  const pendingEarnings = wallet?.pending_earnings || 0;
  const availableEarnings = wallet?.available_earnings || 0;

  return (
    <div className="space-y-5">
      {/* Balance summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl gradient-brand p-5 text-white">
          <div className="flex items-center gap-2 mb-1"><Wallet className="w-4 h-4 text-white/70" /><span className="text-xs text-white/70">Wallet Balance</span></div>
          <p className="text-3xl font-black">₦{walletBal.toLocaleString()}</p>
          <p className="text-white/50 text-[10px] mt-1">For purchases · not withdrawable</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 p-5">
          <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-amber-600" /><span className="text-xs text-amber-600">Pending Earnings</span></div>
          <p className="text-3xl font-black text-amber-700">₦{pendingEarnings.toLocaleString()}</p>
          <p className="text-muted-foreground text-[10px] mt-1">Held in escrow · releasing soon</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 p-5">
          <div className="flex items-center gap-2 mb-1"><Unlock className="w-4 h-4 text-emerald-600" /><span className="text-xs text-emerald-600">Available Earnings</span></div>
          <p className="text-3xl font-black text-emerald-700">₦{availableEarnings.toLocaleString()}</p>
          <p className="text-muted-foreground text-[10px] mt-1">Ready to withdraw to bank</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto -mx-0 scrollbar-hide">
        <div className="flex gap-1 pb-1 w-max">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === t.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Monthly chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" />Monthly Earnings vs Spending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Earnings" fill="#22c55e" radius={[3,3,0,0]} />
                  <Bar dataKey="Spent" fill="#ef4444" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Lifetime stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Funded',    value: wallet?.total_funded || 0,    color: 'text-emerald-600' },
              { label: 'Total Spent',     value: wallet?.total_spent || 0,     color: 'text-red-500' },
              { label: 'Total Earned',    value: wallet?.total_earned || 0,    color: 'text-blue-600' },
              { label: 'Total Withdrawn', value: wallet?.total_withdrawn || 0, color: 'text-violet-600' },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                  <p className={`text-xl font-black ${s.color}`}>₦{s.value.toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent transactions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No transactions yet</p>
              ) : transactions.slice(0, 10).map(tx => <TxRow key={tx.id} tx={tx} />)}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Deposits */}
      {activeTab === 'deposits' && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><ArrowDownLeft className="w-4 h-4 text-emerald-600" />Deposit History</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3">
            {deposits.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No deposits yet. Fund your wallet to get started.</p>
              : deposits.map(tx => <TxRow key={tx.id} tx={tx} />)}
          </CardContent>
        </Card>
      )}

      {/* Purchases */}
      {activeTab === 'purchases' && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-red-500" />Purchase History</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3">
            {purchases.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No purchases yet.</p>
              : purchases.map(tx => <TxRow key={tx.id} tx={tx} />)}
          </CardContent>
        </Card>
      )}

      {/* Sales */}
      {activeTab === 'sales' && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><Package className="w-4 h-4 text-amber-600" />Sales History</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3">
            {sales.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No sales yet. List an item to start earning!</p>
              : sales.map(tx => <TxRow key={tx.id} tx={tx} />)}
          </CardContent>
        </Card>
      )}

      {/* Withdrawals */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          {pendingWithdrawals.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" />Pending Withdrawals</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                {pendingWithdrawals.map(wr => <WithdrawalRow key={wr.id} wr={wr} />)}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" />Completed Withdrawals</CardTitle></CardHeader>
            <CardContent className="px-4 pb-3 space-y-2">
              {completedWithdrawals.length === 0
                ? <p className="text-sm text-muted-foreground text-center py-6">No completed withdrawals yet.</p>
                : completedWithdrawals.map(wr => <WithdrawalRow key={wr.id} wr={wr} />)}
            </CardContent>
          </Card>
          {withdrawals.filter(w => w.status === 'rejected').length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-500" />Rejected Withdrawals</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                {withdrawals.filter(w => w.status === 'rejected').map(wr => <WithdrawalRow key={wr.id} wr={wr} />)}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0
            ? <p className="text-sm text-muted-foreground text-center py-12">No orders yet.</p>
            : orders.map(o => <OrderSummaryRow key={`${o.id}-${o._dir}`} order={o} />)}
        </div>
      )}
    </div>
  );
}

function WithdrawalRow({ wr }) {
  const cfg = WD_STATUS[wr.status] || WD_STATUS.pending;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">₦{(wr.amount || 0).toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">{wr.account_name} · {wr.bank}</p>
        <p className="text-[11px] text-muted-foreground font-mono">{wr.account_number}</p>
        <p className="text-[10px] text-muted-foreground">{wr.created_date ? format(new Date(wr.created_date), 'MMM d, yyyy') : ''}</p>
        {wr.admin_note && <p className="text-xs text-amber-600 italic mt-0.5">"{wr.admin_note}"</p>}
      </div>
      <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${cfg.class}`}>{cfg.label}</span>
    </div>
  );
}

const ORDER_STATUS = {
  pending:    { label: 'Pending',    color: 'bg-gray-100 text-gray-600' },
  paid:       { label: 'Paid',       color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700' },
  shipped:    { label: 'Shipped',    color: 'bg-indigo-100 text-indigo-700' },
  delivered:  { label: 'Delivered',  color: 'bg-purple-100 text-purple-700' },
  completed:  { label: 'Completed',  color: 'bg-green-100 text-green-700' },
  cancelled:  { label: 'Cancelled',  color: 'bg-gray-100 text-gray-500' },
  refunded:   { label: 'Refunded',   color: 'bg-cyan-100 text-cyan-700' },
  disputed:   { label: 'Disputed',   color: 'bg-red-100 text-red-700' },
  escrow_held:{ label: 'Escrow',     color: 'bg-amber-100 text-amber-700' },
};

function OrderSummaryRow({ order }) {
  const st = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
  const isBuy = order._dir === 'buy';
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-muted overflow-hidden flex-shrink-0">
          {order.item_image ? <img src={order.item_image} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full gradient-brand opacity-40" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{order.item_title}</p>
          <p className="text-xs text-muted-foreground">{isBuy ? `Seller: ${order.seller_name}` : `Buyer: ${order.buyer_name}`}</p>
          <p className="text-[10px] text-muted-foreground">{order.created_date ? format(new Date(order.created_date), 'MMM d, yyyy') : ''}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`font-black text-sm ${isBuy ? 'text-red-500' : 'text-emerald-600'}`}>
            {isBuy ? '-' : '+'}₦{Number(order.price || 0).toLocaleString()}
          </p>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${st.color}`}>{st.label}</span>
          <p className="text-[10px] text-muted-foreground mt-0.5">{isBuy ? 'Purchase' : 'Sale'}</p>
        </div>
      </CardContent>
    </Card>
  );
}