import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import StatCard from '@/components/admin/StatCard';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import {
  DollarSign, Percent, Megaphone, Clock,
  CheckCircle2, XCircle, ArrowDownToLine, Loader2, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';

const STATUS_CFG = {
  completed:  { label: 'Completed',  class: 'bg-emerald-400/10 text-emerald-400' },
  pending:    { label: 'Pending',    class: 'bg-amber-400/10 text-amber-400' },
  processing: { label: 'Processing', class: 'bg-blue-400/10 text-blue-400' },
  failed:     { label: 'Failed',     class: 'bg-red-400/10 text-red-400' },
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

export default function AdminWallet() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ads, setAds] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [txFilter, setTxFilter] = useState('all');
  const [approvingId, setApprovingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [txs, ws, os, as_, wrs] = await Promise.all([
        base44.entities.Transaction.list('-created_date', 200),
        base44.entities.Wallet.list('-created_date', 500),
        base44.entities.Order.list('-created_date', 200),
        base44.entities.AdCampaign.list('-created_date', 100),
        base44.entities.WithdrawalRequest.filter({ status: 'pending' }, '-created_date', 100),
      ]);
      setTransactions(txs);
      setWallets(ws);
      setOrders(os);
      setAds(as_);
      setWithdrawalRequests(wrs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Real-time subscription for new transactions
  useEffect(() => {
    const unsubTx = base44.entities.Transaction.subscribe((event) => {
      if (event.type === 'create') setTransactions(prev => [event.data, ...prev]);
      else if (event.type === 'update') setTransactions(prev => prev.map(t => t.id === event.id ? event.data : t));
    });
    // Real-time withdrawal requests
    const unsubWR = base44.entities.WithdrawalRequest.subscribe((event) => {
      if (event.type === 'create' && event.data?.status === 'pending') {
        setWithdrawalRequests(prev => [event.data, ...prev]);
      } else if (event.type === 'update') {
        setWithdrawalRequests(prev => prev.filter(w => w.id !== event.id)); // remove from pending list
      }
    });
    return () => { unsubTx(); unsubWR(); };
  }, []);

  // ---- Derived metrics ----
  const totalCommission = transactions.filter(t => t.type === 'escrow_release').reduce((s, t) => s + (t.amount || 0), 0);
  const adRevenue = ads.reduce((s, a) => s + (a.spent || 0), 0);
  const totalWalletBalance = wallets.reduce((s, w) => s + (w.balance || 0), 0);
  const pendingWithdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending').reduce((s, t) => s + (t.amount || 0), 0);
  const totalFunded = wallets.reduce((s, w) => s + (w.total_funded || 0), 0);

  // Chart: last 14 days of real fund + commission transactions
  const chartData = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(), 13 - i);
    const dateStr = d.toISOString().slice(0, 10);
    const commission = transactions
      .filter(t => t.type === 'escrow_release' && t.created_date?.slice(0, 10) === dateStr)
      .reduce((s, t) => s + (t.amount || 0), 0);
    const funded = transactions
      .filter(t => t.type === 'fund' && t.created_date?.slice(0, 10) === dateStr)
      .reduce((s, t) => s + (t.amount || 0), 0);
    return { date: format(d, 'MMM d'), Commission: commission, Funded: funded };
  });

  // Filter for transaction log
  const filteredTxs = transactions.filter(tx => {
    if (txFilter === 'all') return true;
    if (txFilter === 'commission') return tx.type === 'escrow_release';
    if (txFilter === 'fund') return tx.type === 'fund';
    if (txFilter === 'withdrawal') return tx.type === 'withdrawal';
    return true;
  }).slice(0, 50);

  // Approve a withdrawal: deduct wallet balance + create transaction + notify user
  const approveWithdrawal = async (wr) => {
    setApprovingId(wr.id);
    try {
      // 1. Get user's wallet
      const walletList = await base44.entities.Wallet.filter({ user_email: wr.user_email });
      const userWallet = walletList[0];
      if (!userWallet) { toast.error('User wallet not found'); return; }
      if (userWallet.balance < wr.amount) { toast.error('User has insufficient balance'); return; }

      // 2. Deduct balance
      const newBalance = userWallet.balance - wr.amount;
      await base44.entities.Wallet.update(userWallet.id, {
        balance: newBalance,
        total_withdrawn: (userWallet.total_withdrawn || 0) + wr.amount,
      });

      // 3. Record the transaction
      await base44.entities.Transaction.create({
        user_email: wr.user_email,
        type: 'withdrawal',
        amount: wr.amount,
        balance_before: userWallet.balance,
        balance_after: newBalance,
        description: `Withdrawal to ${wr.bank} •••• ${wr.account_number?.slice(-4)}`,
        reference: wr.reference || `WD-${Date.now()}`,
        status: 'completed',
      });

      // 4. Mark the request approved
      await base44.entities.WithdrawalRequest.update(wr.id, { status: 'approved' });

      // 5. Notify the user
      await base44.entities.Notification.create({
        user_email: wr.user_email,
        type: 'marketplace',
        content: `Your withdrawal of ₦${wr.amount.toLocaleString()} has been approved and is being processed.`,
        is_read: false,
      });

      setWithdrawalRequests(prev => prev.filter(w => w.id !== wr.id));
      toast.success('Withdrawal approved and user notified!');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setApprovingId(null);
    }
  };

  // Reject a withdrawal request
  const rejectWithdrawal = async (wr, adminNote = '') => {
    setApprovingId(wr.id);
    try {
      await base44.entities.WithdrawalRequest.update(wr.id, { status: 'rejected', admin_note: adminNote });

      await base44.entities.Notification.create({
        user_email: wr.user_email,
        type: 'marketplace',
        content: `Your withdrawal request of ₦${wr.amount.toLocaleString()} was not approved.${adminNote ? ' Reason: ' + adminNote : ''}`,
        is_read: false,
      });

      setWithdrawalRequests(prev => prev.filter(w => w.id !== wr.id));
      toast.success('Withdrawal rejected and user notified');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Platform Wallets Total" value={`₦${totalWalletBalance.toLocaleString()}`} sub={`${wallets.length} wallets`} icon={DollarSign} iconColor="blue" />
        <StatCard label="Commission Earned" value={`₦${totalCommission.toLocaleString()}`} sub="From marketplace orders" icon={Percent} iconColor="purple" />
        <StatCard label="Ad Revenue" value={`₦${adRevenue.toLocaleString()}`} sub="From campaigns" icon={Megaphone} iconColor="green" />
        <StatCard label="Pending Withdrawals" value={`₦${pendingWithdrawals.toLocaleString()}`} sub={`${withdrawalRequests.length} request(s)`} icon={Clock} iconColor="amber" />
      </div>

      {/* Revenue flow chart */}
      <div className="rounded-2xl border border-white/8 bg-[#0d1220] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-sm">Revenue Flow (Last 14 Days)</h3>
          <div className="flex gap-3 text-xs">
            {[['#8b5cf6','Commission'],['#3b82f6','Funded']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{background:c}} />
                <span className="text-white/40">{l}</span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              {[['Commission','#8b5cf6'],['Funded','#3b82f6']].map(([k,c]) => (
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
            <Area type="monotone" dataKey="Commission" stroke="#8b5cf6" fill="url(#gw-Commission)" strokeWidth={2} />
            <Area type="monotone" dataKey="Funded" stroke="#3b82f6" fill="url(#gw-Funded)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Pending Withdrawal Requests */}
      <div className="rounded-2xl border border-white/8 bg-[#0d1220] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Pending Withdrawal Requests
            {withdrawalRequests.length > 0 && (
              <span className="bg-amber-400/20 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {withdrawalRequests.length}
              </span>
            )}
          </h3>

        </div>
        <div className="p-5 space-y-3">
          {withdrawalRequests.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-4">No pending withdrawal requests</p>
          ) : withdrawalRequests.map(w => (
            <div key={w.id} className="flex items-center gap-3 bg-white/[0.03] rounded-xl p-4 border border-white/5">
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{w.user_name || w.user_email}</p>
                <p className="text-white/50 text-xs truncate">{w.bank} •••• {w.account_number?.slice(-4)}</p>
                <p className="text-white/30 text-xs">{w.user_email} · {w.created_date ? format(new Date(w.created_date), 'MMM d, yyyy') : ''}</p>
              </div>
              <div className="text-right mr-3 flex-shrink-0">
                <p className="text-red-400 font-black">₦{(w.amount || 0).toLocaleString()}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${STATUS_CFG['pending']?.class}`}>Pending</span>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  disabled={approvingId === w.id}
                  onClick={() => approveWithdrawal(w)}
                  title="Approve"
                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  {approvingId === w.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                </button>
                <button
                  disabled={approvingId === w.id}
                  onClick={() => rejectWithdrawal(w)}
                  title="Reject"
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction log */}
      <div className="rounded-2xl border border-white/8 bg-[#0d1220] overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-white/8">
          <h3 className="text-white font-bold text-sm">All Transactions ({transactions.length})</h3>
          <div className="flex gap-2">
            <select value={txFilter} onChange={e => setTxFilter(e.target.value)} className="bg-white/5 border border-white/10 text-white text-xs rounded-lg px-3 py-1.5">
              <option value="all" className="bg-[#0d1220]">All Types</option>
              <option value="commission" className="bg-[#0d1220]">Commission</option>
              <option value="fund" className="bg-[#0d1220]">Funded</option>
              <option value="withdrawal" className="bg-[#0d1220]">Withdrawals</option>
            </select>
            <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-white/70 text-xs rounded-lg hover:bg-white/10">
              <RefreshCw className="w-3.5 h-3.5" />Refresh
            </button>
          </div>
        </div>
        <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
          {filteredTxs.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">No transactions found</p>
          ) : filteredTxs.map(tx => (
            <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02]">
              <div className={`text-[10px] px-2 py-0.5 rounded-md font-semibold flex-shrink-0 ${
                tx.type === 'escrow_release' ? 'bg-purple-500/10 text-purple-400' :
                tx.type === 'fund' ? 'bg-emerald-500/10 text-emerald-400' :
                tx.type === 'withdrawal' ? 'bg-red-500/10 text-red-400' :
                tx.type === 'payment' ? 'bg-orange-500/10 text-orange-400' :
                'bg-blue-500/10 text-blue-400'
              }`}>
                {tx.type.replace(/_/g, ' ')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-sm truncate">{tx.description || tx.user_email}</p>
                <p className="text-white/30 text-xs">{tx.created_date ? format(new Date(tx.created_date), 'MMM d, yyyy · h:mm a') : ''}</p>
              </div>
              <p className={`font-bold text-sm flex-shrink-0 ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {tx.amount > 0 ? '+' : ''}₦{Math.abs(tx.amount || 0).toLocaleString()}
              </p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md flex-shrink-0 ${STATUS_CFG[tx.status]?.class || STATUS_CFG.completed.class}`}>
                {tx.status || 'completed'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}