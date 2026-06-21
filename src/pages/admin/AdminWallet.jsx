import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import StatCard from '@/components/admin/StatCard';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DollarSign, Percent, Megaphone, Clock,
  CheckCircle2, XCircle, ArrowDownToLine, Loader2, RefreshCw,
  Lock, Unlock, TrendingUp, Receipt, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';

const STATUS_CFG = {
  completed:    { label: 'Completed',    class: 'bg-emerald-400/10 text-emerald-400' },
  pending:      { label: 'Pending',      class: 'bg-amber-400/10 text-amber-400' },
  under_review: { label: 'Under Review', class: 'bg-blue-400/10 text-blue-400' },
  processing:   { label: 'Processing',   class: 'bg-blue-400/10 text-blue-400' },
  approved:     { label: 'Approved',     class: 'bg-emerald-400/10 text-emerald-400' },
  paid:         { label: 'Paid',         class: 'bg-emerald-500/20 text-emerald-300' },
  failed:       { label: 'Failed',       class: 'bg-red-400/10 text-red-400' },
  rejected:     { label: 'Rejected',     class: 'bg-red-400/10 text-red-400' },
  reversed:     { label: 'Reversed',     class: 'bg-gray-400/10 text-gray-400' },
};

const TX_TYPE_CFG = {
  deposit:        'bg-emerald-500/10 text-emerald-400',
  purchase:       'bg-orange-500/10 text-orange-400',
  sale:           'bg-blue-500/10 text-blue-400',
  commission:     'bg-purple-500/10 text-purple-400',
  escrow_release: 'bg-teal-500/10 text-teal-400',
  withdrawal:     'bg-red-500/10 text-red-400',
  refund:         'bg-cyan-500/10 text-cyan-400',
  // legacy
  fund:           'bg-emerald-500/10 text-emerald-400',
  payment:        'bg-orange-500/10 text-orange-400',
  escrow_hold:    'bg-amber-500/10 text-amber-400',
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
  const [revenue, setRevenue] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [txFilter, setTxFilter] = useState('all');
  const [txSearch, setTxSearch] = useState('');
  const [approvingId, setApprovingId] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const load = async () => {
    setLoading(true);
    try {
      const [txs, ws, revs, wrs] = await Promise.all([
        base44.entities.Transaction.list('-created_date', 200),
        base44.entities.Wallet.list('-created_date', 500),
        base44.entities.Revenue.list('-created_date', 200),
        base44.entities.WithdrawalRequest.filter({ status: 'pending' }, '-created_date', 100),
      ]);
      setTransactions(txs);
      setWallets(ws);
      setRevenue(revs);
      setWithdrawalRequests(wrs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const unsubTx = base44.entities.Transaction.subscribe((e) => {
      if (e.type === 'create') setTransactions(prev => [e.data, ...prev]);
      else if (e.type === 'update') setTransactions(prev => prev.map(t => t.id === e.id ? e.data : t));
    });
    const unsubWR = base44.entities.WithdrawalRequest.subscribe((e) => {
      if (e.type === 'create' && e.data?.status === 'pending') setWithdrawalRequests(prev => [e.data, ...prev]);
      else if (e.type === 'update') setWithdrawalRequests(prev => prev.filter(w => w.id !== e.id));
    });
    return () => { unsubTx(); unsubWR(); };
  }, []);

  // ── Derived metrics ───────────────────────────────────────────────────────
  const totalCommission = revenue.filter(r => r.source_type === 'commission').reduce((s, r) => s + (r.amount || 0), 0);
  const totalWalletBalance = wallets.reduce((s, w) => s + (w.wallet_balance || 0), 0);
  const totalPendingEarnings = wallets.reduce((s, w) => s + (w.pending_earnings || 0), 0);
  const totalAvailableEarnings = wallets.reduce((s, w) => s + (w.available_earnings || 0), 0);
  const pendingWithdrawalAmount = withdrawalRequests.reduce((s, w) => s + (w.amount || 0), 0);

  const chartData = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(), 13 - i);
    const dateStr = d.toISOString().slice(0, 10);
    const commission = revenue.filter(r => r.source_type === 'commission' && r.created_date?.slice(0, 10) === dateStr).reduce((s, r) => s + (r.amount || 0), 0);
    const deposits = transactions.filter(t => ['deposit', 'fund'].includes(t.type) && t.created_date?.slice(0, 10) === dateStr).reduce((s, t) => s + (t.amount || 0), 0);
    const purchases = transactions.filter(t => ['purchase', 'payment'].includes(t.type) && t.created_date?.slice(0, 10) === dateStr).reduce((s, t) => s + (t.amount || 0), 0);
    return { date: format(d, 'MMM d'), Commission: commission, Deposits: deposits, Purchases: purchases };
  });

  const filteredTxs = transactions.filter(tx => {
    const typeMatch = txFilter === 'all' || tx.type === txFilter;
    const searchMatch = !txSearch || tx.user_email?.includes(txSearch) || tx.description?.toLowerCase().includes(txSearch.toLowerCase()) || tx.reference?.includes(txSearch);
    return typeMatch && searchMatch;
  }).slice(0, 100);

  // ── Admin approval actions ─────────────────────────────────────────────────
  const approveWithdrawal = async (wr) => {
    setApprovingId(wr.id);
    try {
      await base44.entities.WithdrawalRequest.update(wr.id, { status: 'approved', reviewed_by: 'admin' });
      await base44.entities.Transaction.filter({ user_email: wr.user_email, type: 'withdrawal', status: 'pending' })
        .then(txs => {
          const match = txs.find(t => t.reference?.includes(wr.reference));
          if (match) return base44.entities.Transaction.update(match.id, { status: 'completed' });
        });
      await base44.entities.Notification.create({
        user_email: wr.user_email,
        type: 'marketplace',
        content: `Your withdrawal of ₦${wr.amount.toLocaleString()} has been approved and will be paid within 1–3 business days.`,
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

  const rejectWithdrawal = async (wr) => {
    if (rejectingId === wr.id) {
      setApprovingId(wr.id);
      try {
        // Restore the balance that was deducted on request
        const walletList = await base44.entities.Wallet.filter({ user_email: wr.user_email });
        const userWallet = walletList[0];
        if (userWallet) {
          await base44.entities.Wallet.update(userWallet.id, {
            available_earnings: (userWallet.available_earnings || 0) + wr.amount,
            total_withdrawn: Math.max(0, (userWallet.total_withdrawn || 0) - wr.amount),
          });
        }
        await base44.entities.WithdrawalRequest.update(wr.id, { status: 'rejected', admin_note: rejectNote || '', reviewed_by: 'admin' });
        await base44.entities.Notification.create({
          user_email: wr.user_email,
          type: 'marketplace',
          content: `Your withdrawal of ₦${wr.amount.toLocaleString()} was not approved.${rejectNote ? ' Reason: ' + rejectNote : ''} The funds have been returned to your available earnings.`,
          is_read: false,
        });
        setWithdrawalRequests(prev => prev.filter(w => w.id !== wr.id));
        setRejectingId(null); setRejectNote('');
        toast.success('Withdrawal rejected and funds restored');
      } catch (e) {
        toast.error(e.message);
      } finally {
        setApprovingId(null);
      }
    } else {
      setRejectingId(wr.id); setRejectNote('');
    }
  };

  const markAsPaid = async (wr) => {
    setApprovingId(wr.id);
    try {
      await base44.entities.WithdrawalRequest.update(wr.id, { status: 'paid' });
      await base44.entities.Notification.create({
        user_email: wr.user_email,
        type: 'marketplace',
        content: `Your withdrawal of ₦${wr.amount.toLocaleString()} has been paid to your ${wr.bank} account!`,
        is_read: false,
      });
      toast.success('Marked as paid and user notified');
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

  const TABS = ['overview', 'withdrawals', 'transactions', 'ledger'];

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Wallet Balances" value={`₦${totalWalletBalance.toLocaleString()}`} sub={`${wallets.length} wallets`} icon={DollarSign} iconColor="blue" />
        <StatCard label="Platform Commission" value={`₦${totalCommission.toLocaleString()}`} sub={`${revenue.length} transactions`} icon={Percent} iconColor="purple" />
        <StatCard label="Pending Earnings (Escrow)" value={`₦${totalPendingEarnings.toLocaleString()}`} sub="Held in escrow" icon={Clock} iconColor="amber" />
        <StatCard label="Pending Withdrawals" value={`₦${pendingWithdrawalAmount.toLocaleString()}`} sub={`${withdrawalRequests.length} requests`} icon={ArrowDownToLine} iconColor="red" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`text-xs px-4 py-2 rounded-t-lg font-semibold capitalize transition-colors ${activeTab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>
            {t === 'withdrawals' && withdrawalRequests.length > 0 ? `${t} (${withdrawalRequests.length})` : t}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="rounded-2xl border border-white/8 bg-[#0d1220] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-sm">Financial Flow (Last 14 Days)</h3>
            <div className="flex gap-3 text-xs">
              {[['#8b5cf6','Commission'],['#3b82f6','Deposits'],['#f59e0b','Purchases']].map(([c,l]) => (
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
                {[['Commission','#8b5cf6'],['Deposits','#3b82f6'],['Purchases','#f59e0b']].map(([k,c]) => (
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
              <Area type="monotone" dataKey="Deposits" stroke="#3b82f6" fill="url(#gw-Deposits)" strokeWidth={2} />
              <Area type="monotone" dataKey="Purchases" stroke="#f59e0b" fill="url(#gw-Purchases)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>

          {/* Platform balance breakdown */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/8">
            <div className="text-center">
              <p className="text-white/40 text-xs mb-1">Total Wallet Balances</p>
              <p className="text-blue-400 font-black text-lg">₦{totalWalletBalance.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-white/40 text-xs mb-1">In Escrow (Pending)</p>
              <p className="text-amber-400 font-black text-lg">₦{totalPendingEarnings.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-white/40 text-xs mb-1">Available Earnings</p>
              <p className="text-emerald-400 font-black text-lg">₦{totalAvailableEarnings.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="rounded-2xl border border-white/8 bg-[#0d1220] overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-white/8">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Pending Withdrawal Requests
              {withdrawalRequests.length > 0 && (
                <span className="bg-amber-400/20 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold">{withdrawalRequests.length}</span>
              )}
            </h3>
          </div>
          <div className="p-5 space-y-3">
            {withdrawalRequests.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-4">No pending withdrawal requests</p>
            ) : withdrawalRequests.map(w => (
              <div key={w.id} className="bg-white/[0.03] rounded-xl p-4 border border-white/5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{w.user_name || w.user_email}</p>
                    <p className="text-white/50 text-xs">{w.bank} · {w.account_number} · {w.account_name}</p>
                    <p className="text-white/30 text-xs">{w.user_email} · {w.created_date ? format(new Date(w.created_date), 'MMM d, yyyy') : ''}</p>
                    {w.note && <p className="text-white/40 text-xs italic mt-0.5">"{w.note}"</p>}
                    {w.reference && <p className="text-white/20 text-[10px] font-mono">{w.reference}</p>}
                  </div>
                  <div className="text-right mr-2 flex-shrink-0">
                    <p className="text-amber-400 font-black text-lg">₦{(w.amount || 0).toLocaleString()}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${STATUS_CFG['pending']?.class}`}>Pending</span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button disabled={approvingId === w.id} onClick={() => approveWithdrawal(w)} title="Approve"
                      className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50">
                      {approvingId === w.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <button disabled={approvingId === w.id} onClick={() => rejectWithdrawal(w)}
                      className={`p-1.5 rounded-lg disabled:opacity-50 transition-colors ${rejectingId === w.id ? 'bg-red-500/30 text-red-300' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}>
                      {approvingId === w.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {rejectingId === w.id && (
                  <div className="flex gap-2 items-center">
                    <Input value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                      placeholder="Rejection reason (optional)..."
                      className="bg-white/5 border-white/10 text-white text-xs h-8" autoFocus />
                    <button onClick={() => { setRejectingId(null); setRejectNote(''); }} className="text-white/30 hover:text-white/60 text-xs whitespace-nowrap">Cancel</button>
                    <button onClick={() => rejectWithdrawal(w)} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold">Confirm</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="rounded-2xl border border-white/8 bg-[#0d1220] overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-white/8">
            <h3 className="text-white font-bold text-sm">All Transactions ({transactions.length})</h3>
            <div className="flex gap-2 flex-wrap">
              <Input value={txSearch} onChange={e => setTxSearch(e.target.value)}
                placeholder="Search email / ref / desc..."
                className="bg-white/5 border-white/10 text-white text-xs h-8 w-48 placeholder:text-white/20" />
              <select value={txFilter} onChange={e => setTxFilter(e.target.value)} className="bg-white/5 border border-white/10 text-white text-xs rounded-lg px-3 py-1.5">
                <option value="all" className="bg-[#0d1220]">All Types</option>
                {['deposit','purchase','sale','commission','escrow_release','withdrawal','refund'].map(t => (
                  <option key={t} value={t} className="bg-[#0d1220]">{t.replace(/_/g,' ')}</option>
                ))}
              </select>
              <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-white/70 text-xs rounded-lg hover:bg-white/10">
                <RefreshCw className="w-3.5 h-3.5" />Refresh
              </button>
            </div>
          </div>
          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
            {filteredTxs.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">No transactions found</p>
            ) : filteredTxs.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02]">
                <div className={`text-[10px] px-2 py-0.5 rounded-md font-semibold flex-shrink-0 ${TX_TYPE_CFG[tx.type] || 'bg-gray-500/10 text-gray-400'}`}>
                  {tx.type?.replace(/_/g, ' ')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/70 text-sm truncate">{tx.description || tx.user_email}</p>
                  <p className="text-white/30 text-[10px] font-mono">{tx.reference || tx.user_email}</p>
                  <p className="text-white/30 text-xs">{tx.created_date ? format(new Date(tx.created_date), 'MMM d, yyyy · h:mm a') : ''}</p>
                </div>
                <p className={`font-bold text-sm flex-shrink-0 ${tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ₦{Math.abs(tx.amount || 0).toLocaleString()}
                </p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md flex-shrink-0 ${STATUS_CFG[tx.status]?.class || STATUS_CFG.completed.class}`}>
                  {tx.status || 'completed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'ledger' && (
        <AdminLedgerView />
      )}
    </div>
  );
}

function AdminLedgerView() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Ledger.list('-created_date', 100).then(e => { setEntries(e); setLoading(false); });
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="rounded-2xl border border-white/8 bg-[#0d1220] overflow-hidden">
      <div className="p-5 border-b border-white/8">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <Receipt className="w-4 h-4 text-purple-400" />Double-Entry Ledger
          <span className="text-white/30 text-xs font-normal ml-1">({entries.length} entries — immutable)</span>
        </h3>
      </div>
      <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
        {entries.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-8">No ledger entries yet</p>
        ) : entries.map(e => (
          <div key={e.id} className="px-5 py-3 hover:bg-white/[0.02]">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${e.is_reversal ? 'bg-cyan-500/10 text-cyan-400' : 'bg-purple-500/10 text-purple-400'}`}>
                    {e.is_reversal ? '↩ REVERSAL' : e.entry_type?.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-white/70 text-xs truncate">{e.description}</p>
                <p className="text-white/30 text-[10px] mt-0.5">
                  DR: <span className="text-red-400">{e.debit_account}</span> ({e.debit_type?.replace(/_/g,' ')})
                  {' → '}
                  CR: <span className="text-emerald-400">{e.credit_account}</span> ({e.credit_type?.replace(/_/g,' ')})
                </p>
                {e.transaction_ref && <p className="text-white/20 text-[10px] font-mono">{e.transaction_ref}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-white font-black text-sm">₦{(e.amount || 0).toLocaleString()}</p>
                <p className="text-white/30 text-[10px]">{e.created_date ? format(new Date(e.created_date), 'MMM d, h:mm a') : ''}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}