import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { getOrCreateWallet, recordTransaction } from '@/lib/wallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Wallet, ArrowDownLeft, ArrowUpRight, ShieldCheck, RefreshCw,
  Loader2, Plus, Minus, TrendingUp, CreditCard, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const TX_CONFIG = {
  fund:           { label: 'Funded',        icon: ArrowDownLeft,  color: 'text-emerald-600', bg: 'bg-emerald-50', sign: '+' },
  payment:        { label: 'Payment',       icon: ArrowUpRight,   color: 'text-red-500',     bg: 'bg-red-50',     sign: '-' },
  escrow_hold:    { label: 'Escrow Hold',   icon: ShieldCheck,    color: 'text-amber-600',   bg: 'bg-amber-50',   sign: '-' },
  escrow_release: { label: 'Escrow Credit', icon: ShieldCheck,    color: 'text-emerald-600', bg: 'bg-emerald-50', sign: '+' },
  withdrawal:     { label: 'Withdrawal',    icon: ArrowUpRight,   color: 'text-violet-600',  bg: 'bg-violet-50',  sign: '-' },
  refund:         { label: 'Refund',        icon: RefreshCw,      color: 'text-blue-600',    bg: 'bg-blue-50',    sign: '+' },
};

const FUND_AMOUNTS = [500, 1000, 2000, 5000, 10000];

function FundModal({ open, onClose, user }) {
  const [amount, setAmount] = useState('');
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);

  const finalAmount = custom ? Number(custom) : Number(amount);

  const handleFund = async () => {
    if (!finalAmount || finalAmount < 100) { toast.error('Minimum funding amount is ₦100'); return; }

    if (window.self !== window.top) {
      alert('Payment checkout only works from the published app. Please open the app in a new tab.');
      return;
    }

    setLoading(true);
    try {
      const origin = window.location.origin;
      const res = await base44.functions.invoke('paystackWalletTopUp', {
        amount: finalAmount,
        success_url: `${origin}/marketplace?wallet=funded`,
        cancel_url: `${origin}/marketplace?wallet=cancelled`,
      });

      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error(res.data?.error || 'Could not initialize payment');
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Wallet className="w-5 h-5 text-primary" />Fund Wallet</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-muted-foreground">Select or enter an amount. You'll be redirected to Paystack to complete payment securely.</p>

          <div className="grid grid-cols-3 gap-2">
            {FUND_AMOUNTS.map(a => (
              <button key={a}
                onClick={() => { setAmount(String(a)); setCustom(''); }}
                className={`py-2 rounded-xl border text-sm font-semibold transition-all ${amount === String(a) && !custom ? 'gradient-brand text-white border-transparent' : 'border-border hover:bg-muted'}`}>
                ₦{a.toLocaleString()}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block text-muted-foreground">Or enter custom amount (₦)</label>
            <Input
              type="number"
              placeholder="e.g. 3500"
              value={custom}
              onChange={e => { setCustom(e.target.value); setAmount(''); }}
              className="text-base"
            />
          </div>

          {finalAmount > 0 && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800 text-center font-semibold">
              Pay ₦{finalAmount.toLocaleString()} via Paystack
            </div>
          )}

          <Button onClick={handleFund} disabled={loading || !finalAmount} className="w-full gradient-brand border-0 gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {loading ? 'Redirecting to Paystack...' : 'Pay with Paystack'}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">Secured by Paystack • Cards, Bank Transfer, USSD supported</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const STATUS_BADGE = {
  pending:  { label: 'Pending Review', color: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  approved: { label: 'Approved',       color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  rejected: { label: 'Rejected',       color: 'bg-red-500/15 text-red-600 border-red-500/30' },
};

function WithdrawModal({ open, onClose, wallet, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [bank, setBank] = useState('');
  const [account, setAccount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const withdraw = async () => {
    const amt = Number(amount);
    if (!amt || amt < 100) { toast.error('Minimum withdrawal is ₦100'); return; }
    if (amt > wallet.balance) { toast.error('Insufficient balance'); return; }
    if (!bank || !account || account.length < 10) { toast.error('Please enter valid bank details'); return; }
    setLoading(true);
    try {
      // Create a WithdrawalRequest — admin will approve/reject. Balance NOT deducted yet.
      await base44.entities.WithdrawalRequest.create({
        user_email: wallet.user_email,
        user_name: wallet.user_name || '',
        amount: amt,
        bank,
        account_number: account,
        note: note || '',
        status: 'pending',
        wallet_id: wallet.id,
        reference: `WD-${Date.now()}`,
      });
      toast.success('Withdrawal request submitted! You\'ll be notified once approved.');
      onSuccess(wallet);
      onClose();
      setAmount(''); setBank(''); setAccount(''); setNote('');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowUpRight className="w-5 h-5 text-violet-600" />Withdraw Funds</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="rounded-xl bg-muted p-3 text-center">
            <p className="text-xs text-muted-foreground">Available balance</p>
            <p className="text-2xl font-black text-primary">₦{(wallet?.balance || 0).toLocaleString()}</p>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Amount to withdraw (₦) *</label>
            <Input type="number" placeholder="e.g. 5000" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Bank *</label>
            <select value={bank} onChange={e => setBank(e.target.value)} className="w-full bg-background border border-input text-foreground text-sm rounded-md px-3 py-2">
              <option value="">Select bank...</option>
              {['GTBank','Zenith Bank','Access Bank','First Bank','UBA','Fidelity Bank','FCMB','Stanbic IBTC','Polaris Bank','Keystone Bank'].map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Account Number *</label>
            <Input type="text" placeholder="10-digit account number" maxLength={10} value={account} onChange={e => setAccount(e.target.value.replace(/\D/g, ''))} className="font-mono" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Note (optional)</label>
            <Input placeholder="Reason..." value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-700">⚠️ Withdrawal requests are reviewed by admin. Balance is deducted upon approval within 1–3 business days.</p>
          </div>
          <Button onClick={withdraw} disabled={loading || !amount} className="w-full gap-2 bg-violet-600 hover:bg-violet-700 border-0 text-white">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Minus className="w-4 h-4" />}
            {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TransactionRow({ tx }) {
  const cfg = TX_CONFIG[tx.type] || TX_CONFIG.fund;
  const Icon = cfg.icon;
  const isCredit = cfg.sign === '+';

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{cfg.label}</p>
        <p className="text-[11px] text-muted-foreground truncate">{tx.description}</p>
        <p className="text-[10px] text-muted-foreground">{tx.created_date ? format(new Date(tx.created_date), 'MMM d, yyyy · h:mm a') : ''}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`font-black text-sm ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
          {cfg.sign}₦{Number(tx.amount).toLocaleString()}
        </p>
        <p className="text-[10px] text-muted-foreground">Bal: ₦{Number(tx.balance_after || 0).toLocaleString()}</p>
      </div>
    </div>
  );
}

export default function WalletDashboard({ user }) {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fundOpen, setFundOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    const [w, txs, wrs] = await Promise.all([
      getOrCreateWallet(user.email, user.full_name),
      base44.entities.Transaction.filter({ user_email: user.email }, '-created_date', 50),
      base44.entities.WithdrawalRequest.filter({ user_email: user.email }, '-created_date', 20),
    ]);
    setWallet(w);
    setTransactions(txs);
    setWithdrawalRequests(wrs);
    setLoading(false);
  }, [user?.email]);

  useEffect(() => { load(); }, [load]);

  // Real-time wallet balance updates
  useEffect(() => {
    if (!user?.email) return;
    const unsub = base44.entities.Wallet.subscribe((event) => {
      if (event.data?.user_email !== user.email) return;
      if (event.type === 'update' || event.type === 'create') {
        setWallet(event.data);
      }
    });
    return unsub;
  }, [user?.email]);

  // Real-time transaction feed
  useEffect(() => {
    if (!user?.email) return;
    const unsub = base44.entities.Transaction.subscribe((event) => {
      if (event.data?.user_email !== user.email) return;
      if (event.type === 'create') setTransactions(prev => [event.data, ...prev]);
      if (event.type === 'update') setTransactions(prev => prev.map(t => t.id === event.id ? event.data : t));
    });
    return unsub;
  }, [user?.email]);

  // Real-time withdrawal request updates
  useEffect(() => {
    if (!user?.email) return;
    const unsub = base44.entities.WithdrawalRequest.subscribe((event) => {
      if (event.data?.user_email !== user.email) return;
      if (event.type === 'create') setWithdrawalRequests(prev => [event.data, ...prev]);
      if (event.type === 'update') {
        setWithdrawalRequests(prev => prev.map(w => w.id === event.id ? event.data : w));
        // Reload wallet balance if approved (balance was deducted server-side)
        if (event.data?.status === 'approved') load();
      }
    });
    return unsub;
  }, [user?.email, load]);

  // Handle redirect back from Paystack — verify + credit immediately, then poll as fallback
  const params = new URLSearchParams(window.location.search);
  const walletStatus = params.get('wallet');
  const paystackRef = params.get('reference') || params.get('trxref');

  useEffect(() => {
    if (walletStatus !== 'funded' || !user?.email) return;

    // Clean up URL immediately
    const newParams = new URLSearchParams(window.location.search);
    newParams.delete('wallet');
    newParams.delete('reference');
    newParams.delete('trxref');
    const newSearch = newParams.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${newSearch ? '?' + newSearch : ''}`);

    // Step 1: If Paystack gave us a reference, verify & credit immediately via backend
    const verifyAndCredit = async () => {
      if (paystackRef) {
        try {
          const res = await base44.functions.invoke('paystackWebhookVerify', { reference: paystackRef, user_email: user.email, user_name: user.full_name });
          if (res.data?.credited) {
            await load();
            toast.success('Wallet funded successfully! 🎉');
            return true;
          }
        } catch (_) { /* fall through to polling */ }
      }
      return false;
    };

    // Step 2: Poll for webhook-triggered balance change as fallback
    let baselineBalance = null;
    let attempts = 0;
    const maxAttempts = 12;
    let timerId;

    const poll = async () => {
      attempts++;
      const wallets = await base44.entities.Wallet.filter({ user_email: user.email });
      const w = wallets[0];
      const currentBalance = w?.balance || 0;

      if (baselineBalance === null) baselineBalance = currentBalance;

      if (currentBalance > baselineBalance) {
        setWallet(w);
        await load();
        toast.success('Wallet funded successfully! 🎉');
      } else if (attempts < maxAttempts) {
        timerId = setTimeout(poll, 2000);
      } else {
        await load();
      }
    };

    verifyAndCredit().then(credited => {
      if (!credited) timerId = setTimeout(poll, 1500);
    });

    return () => clearTimeout(timerId);
  }, [walletStatus, user?.email, load]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;

  const stats = [
    { label: 'Total Funded',    value: wallet?.total_funded || 0,    color: 'text-emerald-600' },
    { label: 'Total Spent',     value: wallet?.total_spent || 0,     color: 'text-red-500' },
    { label: 'Total Earned',    value: wallet?.total_earned || 0,    color: 'text-blue-600' },
    { label: 'Total Withdrawn', value: wallet?.total_withdrawn || 0, color: 'text-violet-600' },
  ];

  return (
    <div className="space-y-6">
      {walletStatus === 'funded' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <CreditCard className="w-4 h-4 flex-shrink-0" />
          Payment successful! Verifying with Paystack — your balance will update in a moment...
        </div>
      )}
      {walletStatus === 'cancelled' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Payment was cancelled.
        </div>
      )}

      {/* Balance card */}
      <Card className="gradient-brand border-0 text-white overflow-hidden relative">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium mb-1">Available Balance</p>
              <p className="text-4xl font-black tracking-tight">₦{(wallet?.balance || 0).toLocaleString()}</p>
              <p className="text-white/60 text-xs mt-2">{user?.full_name}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Wallet className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <Button onClick={() => setFundOpen(true)} size="sm" className="bg-white text-primary hover:bg-white/90 font-semibold gap-1.5 flex-1 border-0">
              <Plus className="w-4 h-4" />Add Funds
            </Button>
            <Button onClick={() => setWithdrawOpen(true)} size="sm" className="bg-white/20 hover:bg-white/30 text-white font-semibold gap-1.5 flex-1 border-0">
              <Minus className="w-4 h-4" />Withdraw
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-xl font-black ${s.color}`}>₦{s.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Withdrawal Request Tracker */}
      {withdrawalRequests.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-violet-600" />Withdrawal Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 px-4 pb-3 space-y-2">
            {withdrawalRequests.map(wr => {
              const badge = STATUS_BADGE[wr.status] || STATUS_BADGE.pending;
              return (
                <div key={wr.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">₦{(wr.amount || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground truncate">{wr.bank} •••• {wr.account_number?.slice(-4)}</p>
                    {wr.admin_note && <p className="text-xs text-muted-foreground mt-0.5 italic">"{wr.admin_note}"</p>}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg border ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Transaction history */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />Transaction History
            <Badge variant="outline" className="ml-auto">{transactions.length} records</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 px-6">
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No transactions yet. Fund your wallet to get started!</p>
            </div>
          ) : (
            <div className="pb-2">
              {transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
            </div>
          )}
        </CardContent>
      </Card>

      <FundModal open={fundOpen} onClose={() => setFundOpen(false)} user={user} />
      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} wallet={wallet} onSuccess={w => { setWallet(w); load(); }} />
    </div>
  );
}