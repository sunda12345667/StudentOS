import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2, XCircle, Loader2, RefreshCw, Search,
  Clock, Banknote, User, Hash, ArrowDownToLine, Pencil,
  ChevronDown, ChevronUp, Send
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_CFG = {
  pending:      { label: 'Pending',      class: 'bg-amber-400/15 text-amber-400 border border-amber-400/20' },
  under_review: { label: 'Under Review', class: 'bg-blue-400/15 text-blue-400 border border-blue-400/20' },
  processing:   { label: 'Processing',   class: 'bg-sky-400/15 text-sky-400 border border-sky-400/20' },
  approved:     { label: 'Approved',     class: 'bg-emerald-400/15 text-emerald-400 border border-emerald-400/20' },
  paid:         { label: 'Paid',         class: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' },
  rejected:     { label: 'Rejected',     class: 'bg-red-400/15 text-red-400 border border-red-400/20' },
};

const ALL_STATUSES = ['pending', 'under_review', 'processing', 'approved', 'paid', 'rejected'];

function WithdrawalCard({ wr, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [adminNote, setAdminNote] = useState(wr.admin_note || '');
  const [editingAmount, setEditingAmount] = useState(false);
  const [newAmount, setNewAmount] = useState(String(wr.amount));

  const isActive = !['paid', 'rejected'].includes(wr.status);
  const statusCfg = STATUS_CFG[wr.status] || STATUS_CFG.pending;

  const updateStatus = async (newStatus, extraData = {}) => {
    setActionLoading(true);
    try {
      await base44.entities.WithdrawalRequest.update(wr.id, {
        status: newStatus,
        admin_note: adminNote,
        reviewed_by: 'admin',
        ...extraData,
      });

      // If marking as paid — ensure wallet is updated and send notification
      if (newStatus === 'paid') {
        const wallets = await base44.entities.Wallet.filter({ user_email: wr.user_email });
        const wallet = wallets[0];
        if (wallet) {
          // amount was already deducted on request; just ensure total_withdrawn is accurate
          // Only deduct if not already done (balance check)
          const currentAvailable = wallet.available_earnings || 0;
          // If available_earnings was NOT already deducted (legacy requests), deduct now
          // requestWithdrawal already deducts on submission, so we skip re-deduction
        }
        await base44.entities.Transaction.filter({ reference: wr.reference }).then(txs => {
          if (txs[0]) base44.entities.Transaction.update(txs[0].id, { status: 'completed' });
        }).catch(() => {});
        await base44.entities.Notification.create({
          user_email: wr.user_email,
          type: 'marketplace',
          content: `✅ Your withdrawal of ₦${(wr.amount || 0).toLocaleString()} has been paid to your ${wr.bank} account (${wr.account_name}). Ref: ${wr.reference}`,
          is_read: false,
        });
        toast.success('Marked as paid — user notified');
      }

      // If rejecting — restore funds and notify
      if (newStatus === 'rejected') {
        const wallets = await base44.entities.Wallet.filter({ user_email: wr.user_email });
        const wallet = wallets[0];
        if (wallet) {
          await base44.entities.Wallet.update(wallet.id, {
            available_earnings: (wallet.available_earnings || 0) + wr.amount,
            total_withdrawn: Math.max(0, (wallet.total_withdrawn || 0) - wr.amount),
          });
        }
        await base44.entities.Notification.create({
          user_email: wr.user_email,
          type: 'marketplace',
          content: `❌ Your withdrawal of ₦${(wr.amount || 0).toLocaleString()} was not approved and has been returned to your available earnings.${adminNote ? ' Reason: ' + adminNote : ''}`,
          is_read: false,
        });
        toast.success('Rejected — funds restored and user notified');
        setRejectMode(false);
      }

      if (newStatus === 'approved') {
        await base44.entities.Notification.create({
          user_email: wr.user_email,
          type: 'marketplace',
          content: `✔️ Your withdrawal request of ₦${(wr.amount || 0).toLocaleString()} has been approved and will be processed shortly.`,
          is_read: false,
        });
        toast.success('Approved — user notified');
      }

      if (newStatus === 'processing') {
        await base44.entities.Notification.create({
          user_email: wr.user_email,
          type: 'marketplace',
          content: `🔄 Your withdrawal of ₦${(wr.amount || 0).toLocaleString()} is currently being processed. Funds will arrive soon.`,
          is_read: false,
        });
        toast.success('Marked as processing');
      }

      onStatusChange(wr.id, newStatus, adminNote);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const saveAmount = async () => {
    const amt = parseFloat(newAmount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    try {
      await base44.entities.WithdrawalRequest.update(wr.id, { amount: amt });
      onStatusChange(wr.id, wr.status, wr.admin_note, amt);
      setEditingAmount(false);
      toast.success(`Amount updated to ₦${amt.toLocaleString()}`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/8 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">{wr.user_name || wr.user_email}</p>
          <p className="text-white/40 text-xs truncate">{wr.user_email}</p>
        </div>

        {/* Amount — editable */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {editingAmount ? (
            <>
              <span className="text-amber-400 font-bold text-sm">₦</span>
              <Input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)}
                className="bg-white/5 border-amber-400/40 text-amber-300 text-sm h-8 w-28 font-bold" autoFocus />
              <button onClick={saveAmount} className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"><CheckCircle2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => { setEditingAmount(false); setNewAmount(String(wr.amount)); }} className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10"><XCircle className="w-3.5 h-3.5" /></button>
            </>
          ) : (
            <>
              <p className="text-amber-400 font-black text-lg">₦{(wr.amount || 0).toLocaleString()}</p>
              {isActive && (
                <button onClick={() => setEditingAmount(true)} className="p-1 rounded-md bg-white/5 text-white/30 hover:bg-amber-500/20 hover:text-amber-400">
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </>
          )}
        </div>

        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${statusCfg.class}`}>
          {statusCfg.label}
        </span>

        <button onClick={() => setExpanded(v => !v)} className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/8 pt-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-white/30 mb-0.5">Bank</p>
              <p className="text-white/80 font-semibold">{wr.bank}</p>
            </div>
            <div>
              <p className="text-white/30 mb-0.5">Account Name</p>
              <p className="text-white/80 font-semibold">{wr.account_name}</p>
            </div>
            <div>
              <p className="text-white/30 mb-0.5">Account Number</p>
              <p className="text-white/80 font-mono font-semibold">{wr.account_number}</p>
            </div>
            <div>
              <p className="text-white/30 mb-0.5">Wallet ID</p>
              <p className="text-white/50 font-mono text-[10px]">{wr.wallet_id || '—'}</p>
            </div>
            <div>
              <p className="text-white/30 mb-0.5">Reference</p>
              <p className="text-white/50 font-mono text-[10px]">{wr.reference || '—'}</p>
            </div>
            <div>
              <p className="text-white/30 mb-0.5">Submitted</p>
              <p className="text-white/70">{wr.created_date ? format(new Date(wr.created_date), 'MMM d, yyyy · h:mm a') : '—'}</p>
            </div>
          </div>

          {wr.note && (
            <div className="bg-white/[0.02] rounded-lg p-2 border border-white/5">
              <p className="text-white/30 text-xs">User note:</p>
              <p className="text-white/60 text-xs italic">"{wr.note}"</p>
            </div>
          )}

          {/* Admin note */}
          <div>
            <label className="text-white/30 text-xs block mb-1">Admin note / rejection reason</label>
            <Input
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="Optional note..."
              className="bg-white/5 border-white/10 text-white text-xs h-8"
              disabled={!isActive}
            />
          </div>

          {/* Action buttons — only for active requests */}
          {isActive && (
            <div className="flex flex-wrap gap-2 pt-1">
              {wr.status !== 'processing' && (
                <button onClick={() => updateStatus('processing')} disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors">
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Mark Processing
                </button>
              )}
              {wr.status !== 'approved' && wr.status !== 'paid' && (
                <button onClick={() => updateStatus('approved')} disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors">
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Approve
                </button>
              )}
              {(wr.status === 'approved' || wr.status === 'processing') && (
                <button onClick={() => updateStatus('paid')} disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors">
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Banknote className="w-3.5 h-3.5" />}
                  Mark as Paid
                </button>
              )}
              {!rejectMode ? (
                <button onClick={() => setRejectMode(true)} disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 text-red-400 hover:bg-red-500/25 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors">
                  <XCircle className="w-3.5 h-3.5" />Reject
                </button>
              ) : (
                <div className="flex gap-2 items-center w-full">
                  <span className="text-red-400 text-xs font-semibold">Confirm rejection?</span>
                  <button onClick={() => updateStatus('rejected')} disabled={actionLoading}
                    className="px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-bold disabled:opacity-50">
                    {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes, Reject & Restore Funds'}
                  </button>
                  <button onClick={() => setRejectMode(false)} className="text-white/30 hover:text-white/60 text-xs">Cancel</button>
                </div>
              )}
            </div>
          )}

          {!isActive && wr.admin_note && (
            <div className="bg-white/[0.02] rounded-lg p-2 border border-white/5">
              <p className="text-white/30 text-xs">Admin note:</p>
              <p className="text-white/60 text-xs">{wr.admin_note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminWithdrawals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.WithdrawalRequest.list('-created_date', 200);
      setRequests(all);
    } catch (e) {
      toast.error('Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Real-time updates
  useEffect(() => {
    const unsub = base44.entities.WithdrawalRequest.subscribe((e) => {
      if (e.type === 'create') setRequests(prev => [e.data, ...prev]);
      if (e.type === 'update') setRequests(prev => prev.map(r => r.id === e.data.id ? e.data : r));
      if (e.type === 'delete') setRequests(prev => prev.filter(r => r.id !== e.data.id));
    });
    return unsub;
  }, []);

  const handleStatusChange = (id, newStatus, adminNote, newAmount) => {
    setRequests(prev => prev.map(r => r.id === id
      ? { ...r, status: newStatus, admin_note: adminNote, ...(newAmount != null ? { amount: newAmount } : {}) }
      : r
    ));
  };

  const filtered = requests.filter(r => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || r.user_name?.toLowerCase().includes(q) || r.user_email?.toLowerCase().includes(q)
      || r.account_name?.toLowerCase().includes(q) || r.account_number?.includes(q) || r.reference?.toLowerCase().includes(q) || r.bank?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = requests.filter(r => r.status === s).length;
    return acc;
  }, {});
  const pendingCount = counts.pending || 0;
  const totalPendingAmount = requests.filter(r => r.status === 'pending').reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5 text-amber-400" />
            Withdrawal Management
          </h2>
          <p className="text-white/40 text-xs mt-0.5">{requests.length} total requests · {pendingCount} pending</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 text-white/70 text-xs rounded-lg hover:bg-white/10 disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending', value: counts.pending || 0, amount: totalPendingAmount, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Processing', value: (counts.processing || 0) + (counts.approved || 0), color: 'text-sky-400', bg: 'bg-sky-400/10' },
          { label: 'Paid', value: counts.paid || 0, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Rejected', value: counts.rejected || 0, color: 'text-red-400', bg: 'bg-red-400/10' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border border-white/8 bg-[#0d1220] p-4`}>
            <p className="text-white/40 text-xs mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            {s.amount != null && s.amount > 0 && <p className={`text-xs ${s.color} opacity-70`}>₦{s.amount.toLocaleString()}</p>}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, account, reference..."
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/20 text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 min-w-[160px]">
          <option value="all" className="bg-[#0d1220]">All Statuses</option>
          {ALL_STATUSES.map(s => (
            <option key={s} value={s} className="bg-[#0d1220]">
              {STATUS_CFG[s]?.label} {counts[s] ? `(${counts[s]})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-white/40" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <ArrowDownToLine className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No withdrawal requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(wr => (
            <WithdrawalCard key={wr.id} wr={wr} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}