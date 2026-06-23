import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { getOrCreateWallet } from '@/lib/wallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Wallet, ArrowDownLeft, ArrowUpRight, ShieldCheck, RefreshCw,
  Loader2, Plus, Minus, TrendingUp, CreditCard, AlertCircle,
  CheckCircle2, User, Clock, Lock, Unlock
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const TX_CONFIG = {
  deposit:        { label: 'Deposit',        icon: ArrowDownLeft,  color: 'text-emerald-600', bg: 'bg-emerald-50',  sign: '+' },
  purchase:       { label: 'Purchase',       icon: ArrowUpRight,   color: 'text-red-500',     bg: 'bg-red-50',      sign: '-' },
  sale:           { label: 'Sale',           icon: ShieldCheck,    color: 'text-amber-600',   bg: 'bg-amber-50',    sign: '+' },
  escrow_release: { label: 'Earnings Released', icon: Unlock,      color: 'text-emerald-600', bg: 'bg-emerald-50',  sign: '+' },
  withdrawal:     { label: 'Withdrawal',     icon: ArrowUpRight,   color: 'text-violet-600',  bg: 'bg-violet-50',   sign: '-' },
  refund:         { label: 'Refund',         icon: RefreshCw,      color: 'text-blue-600',    bg: 'bg-blue-50',     sign: '+' },
  escrow_hold:    { label: 'Escrow Hold',    icon: Lock,           color: 'text-amber-600',   bg: 'bg-amber-50',    sign: '-' },
  commission:     { label: 'Commission',     icon: Minus,          color: 'text-orange-500',  bg: 'bg-orange-50',   sign: '-' },
  // legacy keys
  fund:           { label: 'Funded',         icon: ArrowDownLeft,  color: 'text-emerald-600', bg: 'bg-emerald-50',  sign: '+' },
  payment:        { label: 'Payment',        icon: ArrowUpRight,   color: 'text-red-500',     bg: 'bg-red-50',      sign: '-' },
};

const FUND_AMOUNTS = [500, 1000, 2000, 5000, 10000];

const NIGERIAN_BANKS = [
  { name: 'OPay', code: '999992' },
  { name: 'PalmPay', code: '999991' },
  { name: 'Moniepoint MFB', code: '50515' },
  { name: 'Kuda MFB', code: '50211' },
  { name: 'Carbon (One Finance)', code: '565' },
  { name: 'FairMoney MFB', code: '51318' },
  { name: 'VFD MFB', code: '566' },
  { name: 'Access Bank', code: '044' },
  { name: 'Ecobank', code: '050' },
  { name: 'FCMB', code: '214' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank', code: '011' },
  { name: 'GTCO (GTBank)', code: '058' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Providus Bank', code: '101' },
  { name: 'Stanbic IBTC', code: '221' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'UBA', code: '033' },
  { name: 'Union Bank', code: '032' },
  { name: 'Unity Bank', code: '215' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
];

const STATUS_BADGE = {
  pending:      { label: 'Pending Review', color: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  under_review: { label: 'Under Review',   color: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  approved:     { label: 'Approved',       color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  paid:         { label: 'Paid',           color: 'bg-emerald-600/15 text-emerald-700 border-emerald-600/30' },
  rejected:     { label: 'Rejected',       color: 'bg-red-500/15 text-red-600 border-red-500/30' },
};

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
          <p className="text-sm text-muted-foreground">Deposited funds can be used to buy products. They cannot be withdrawn — only earnings from sales are withdrawable.</p>
          <div className="grid grid-cols-3 gap-2">
            {FUND_AMOUNTS.map(a => (
              <button key={a} onClick={() => { setAmount(String(a)); setCustom(''); }}
                className={`py-2 rounded-xl border text-sm font-semibold transition-all ${amount === String(a) && !custom ? 'gradient-brand text-white border-transparent' : 'border-border hover:bg-muted'}`}>
                ₦{a.toLocaleString()}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block text-muted-foreground">Or enter custom amount (₦)</label>
            <Input type="number" placeholder="e.g. 3500" value={custom} onChange={e => { setCustom(e.target.value); setAmount(''); }} className="text-base" />
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

function WithdrawModal({ open, onClose, wallet, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [account, setAccount] = useState('');
  const [accountName, setAccountName] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [loading, setLoading] = useState(false);

  const available = wallet?.available_earnings || 0;

  const handleClose = () => {
    setAmount(''); setSelectedBank(null); setAccount(''); setAccountName(''); setVerifyError('');
    onClose();
  };

  useEffect(() => {
    setAccountName(''); setVerifyError('');
    if (!selectedBank || account.length !== 10) return;
    const timer = setTimeout(async () => {
      setVerifying(true);
      try {
        const res = await base44.functions.invoke('verifyBankAccount', { account_number: account, bank_code: selectedBank.code });
        if (res.data?.account_name) setAccountName(res.data.account_name);
        else setVerifyError(res.data?.error || 'Account not found. Check details.');
      } catch {
        setVerifyError('Could not verify account.');
      } finally {
        setVerifying(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [account, selectedBank]);

  const withdraw = async () => {
    const amt = Number(amount);
    if (!amt || amt < 5000) { toast.error('Minimum withdrawal is ₦5,000'); return; }
    if (amt > available) { toast.error('Amount exceeds available earnings'); return; }
    if (!accountName) { toast.error('Please verify your account number first'); return; }
    setLoading(true);
    try {
      const res = await base44.functions.invoke('requestWithdrawal', {
        amount: amt, bank: selectedBank.name, bank_code: selectedBank.code,
        account_number: account, account_name: accountName,
      });
      if (res.data?.error) { toast.error(res.data.error); return; }
      toast.success(res.data?.message || 'Withdrawal request submitted!');
      onSuccess();
      handleClose();
    } catch (e) {
      toast.error(e.message || 'Withdrawal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = accountName && Number(amount) >= 5000 && Number(amount) <= available && !verifying;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowUpRight className="w-5 h-5 text-violet-600" />Withdraw Earnings</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="rounded-xl bg-muted p-3 text-center">
            <p className="text-xs text-muted-foreground">Available Earnings</p>
            <p className="text-2xl font-black text-primary">₦{available.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Only released earnings can be withdrawn</p>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Bank / Fintech *</label>
            <select value={selectedBank?.code || ''}
              onChange={e => { const b = NIGERIAN_BANKS.find(b => b.code === e.target.value); setSelectedBank(b || null); setAccount(''); setAccountName(''); setVerifyError(''); }}
              className="w-full bg-background border border-input text-foreground text-sm rounded-md px-3 py-2">
              <option value="">Select bank or fintech...</option>
              {NIGERIAN_BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Account Number *</label>
            <div className="relative">
              <Input type="text" inputMode="numeric" placeholder="10-digit account number" maxLength={10}
                value={account} onChange={e => setAccount(e.target.value.replace(/\D/g, ''))}
                className="font-mono pr-10" disabled={!selectedBank} />
              {verifying && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />}
              {accountName && !verifying && <CheckCircle2 className="absolute right-3 top-2.5 w-4 h-4 text-emerald-500" />}
            </div>
            {accountName && (
              <div className="mt-2 flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <User className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div><p className="text-xs text-emerald-600 font-bold">{accountName}</p><p className="text-[10px] text-emerald-500">Verified ✓</p></div>
              </div>
            )}
            {verifyError && (
              <div className="mt-2 flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">{verifyError}</p>
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Amount (₦) * <span className="text-muted-foreground font-normal">min ₦5,000</span></label>
            <Input type="number" placeholder="e.g. 10000" value={amount} onChange={e => setAmount(e.target.value)} min={5000} max={available} />
            {Number(amount) > available && <p className="text-xs text-red-500 mt-1">Exceeds available earnings</p>}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-700">⚠️ Withdrawals are reviewed by admin and paid within 1–3 business days. Funds are deducted immediately upon request.</p>
          </div>
          <Button onClick={withdraw} disabled={loading || !canSubmit} className="w-full gap-2 bg-violet-600 hover:bg-violet-700 border-0 text-white">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Minus className="w-4 h-4" />}
            {loading ? 'Submitting...' : `Request Withdrawal of ₦${Number(amount || 0).toLocaleString()}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TransactionRow({ tx }) {
  const cfg = TX_CONFIG[tx.type] || TX_CONFIG.deposit;
  const Icon = cfg.icon;
  const isCredit = cfg.sign === '+';

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{cfg.label}</p>
        <p className="text-[11px] text-muted-foreground truncate">{tx.description || tx.item_title}</p>
        <p className="text-[10px] text-muted-foreground">{tx.created_date ? format(new Date(tx.created_date), 'MMM d, yyyy · h:mm a') : ''}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`font-black text-sm ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
          {cfg.sign}₦{Number(tx.amount).toLocaleString()}
        </p>
        {tx.balance_after != null && (
          <p className="text-[10px] text-muted-foreground">Bal: ₦{Number(tx.balance_after).toLocaleString()}</p>
        )}
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
  const [paymentBanner, setPaymentBanner] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const load = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    const [w, txs, wrs] = await Promise.all([
      getOrCreateWallet(user.email, user.full_name),
      base44.entities.Transaction.filter({ user_email: user.email }, '-created_date', 60),
      base44.entities.WithdrawalRequest.filter({ user_email: user.email }, '-created_date', 20),
    ]);
    setWallet(w);
    setTransactions(txs);
    setWithdrawalRequests(wrs);
    setLoading(false);
  }, [user?.email]);

  useEffect(() => { load(); }, [load]);

  // Real-time subscriptions — wallet, transactions, withdrawals
  useEffect(() => {
    if (!user?.email) return;
    const unsubW = base44.entities.Wallet.subscribe((e) => {
      if (e.data?.user_email !== user.email) return;
      if (e.type === 'create' || e.type === 'update') setWallet(e.data);
    });
    const unsubT = base44.entities.Transaction.subscribe((e) => {
      if (e.data?.user_email !== user.email) return;
      if (e.type === 'create') {
        setTransactions(prev => {
          // Avoid duplicates from race between subscription and initial load
          if (prev.some(t => t.id === e.data.id)) return prev;
          return [e.data, ...prev];
        });
      }
      if (e.type === 'update') setTransactions(prev => prev.map(t => t.id === e.data.id ? e.data : t));
    });
    const unsubWR = base44.entities.WithdrawalRequest.subscribe((e) => {
      if (e.data?.user_email !== user.email) return;
      if (e.type === 'create') setWithdrawalRequests(prev => [e.data, ...prev]);
      if (e.type === 'update') {
        setWithdrawalRequests(prev => prev.map(w => w.id === e.data.id ? e.data : w));
        if (e.data?.status === 'approved' || e.data?.status === 'paid') load();
      }
    });
    return () => { unsubW(); unsubT(); unsubWR(); };
  }, [user?.email, load]);

  // Handle Paystack redirect-back after funding
  useEffect(() => {
    if (!user?.email) return;
    const params = new URLSearchParams(window.location.search);
    const walletStatus = params.get('wallet');
    const paystackRef = params.get('reference') || params.get('trxref');

    // Clean URL immediately
    const newParams = new URLSearchParams(window.location.search);
    ['wallet', 'reference', 'trxref'].forEach(k => newParams.delete(k));
    window.history.replaceState({}, '', `${window.location.pathname}${newParams.toString() ? '?' + newParams.toString() : ''}`);

    if (walletStatus === 'cancelled') {
      setPaymentBanner('cancelled');
      setTimeout(() => setPaymentBanner(null), 5000);
      return;
    }

    if (walletStatus !== 'funded') return;

    setPaymentBanner('verifying');

    (async () => {
      try {
        if (paystackRef) {
          const res = await base44.functions.invoke('paystackWebhookVerify', {
            reference: paystackRef,
            user_email: user.email,
            user_name: user.full_name,
          });
          if (res.data?.credited || res.data?.already_credited) {
            await load();
            setPaymentBanner('success');
            toast.success('Wallet funded! 🎉');
            setTimeout(() => setPaymentBanner(null), 5000);
            return;
          }
        }
        // Fallback: just reload and show success
        await load();
        setPaymentBanner('success');
        toast.success('Wallet funded!');
        setTimeout(() => setPaymentBanner(null), 5000);
      } catch {
        await load();
        setPaymentBanner(null);
        toast.error('Could not verify payment. If funds were deducted, contact support.');
      }
    })();
  }, [user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;

  const walletBal = wallet?.wallet_balance || 0;
  const pendingEarnings = wallet?.pending_earnings || 0;
  const availableEarnings = wallet?.available_earnings || 0;

  const TABS = ['all', 'purchases', 'earnings', 'withdrawals'];
  const filteredTxs = transactions.filter(tx => {
    if (activeTab === 'all') return true;
    if (activeTab === 'purchases') return ['purchase', 'payment', 'refund'].includes(tx.type);
    if (activeTab === 'earnings') return ['sale', 'escrow_release', 'escrow_hold', 'commission'].includes(tx.type);
    if (activeTab === 'withdrawals') return tx.type === 'withdrawal';
    return true;
  });

  return (
    <div className="space-y-6">
      {paymentBanner === 'verifying' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm">
          <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
          Payment received! Verifying with Paystack...
        </div>
      )}
      {paymentBanner === 'success' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <CreditCard className="w-4 h-4 flex-shrink-0" />
          Wallet funded successfully! Balance updated.
        </div>
      )}
      {paymentBanner === 'cancelled' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Payment was cancelled. No funds were deducted.
        </div>
      )}
      {wallet?.is_frozen && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
          <Lock className="w-4 h-4 flex-shrink-0" />
          Your account is frozen. Contact support. {wallet.freeze_reason && `Reason: ${wallet.freeze_reason}`}
        </div>
      )}

      {/* Three balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Wallet Balance */}
        <Card className="gradient-brand border-0 text-white">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Wallet className="w-5 h-5 text-white" /></div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">For Spending</span>
            </div>
            <p className="text-white/70 text-xs font-medium mb-0.5">Wallet Balance</p>
            <p className="text-3xl font-black">₦{walletBal.toLocaleString()}</p>
            <p className="text-white/50 text-[10px] mt-1">Use for purchases & ads</p>
            <Button onClick={() => setFundOpen(true)} size="sm" className="w-full mt-3 bg-white text-primary hover:bg-white/90 font-semibold gap-1.5 border-0 text-xs">
              <Plus className="w-3.5 h-3.5" />Add Funds
            </Button>
          </CardContent>
        </Card>

        {/* Pending Earnings */}
        <Card className="border border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div>
              <span className="text-[10px] bg-amber-200/60 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Locked</span>
            </div>
            <p className="text-muted-foreground text-xs font-medium mb-0.5">Pending Earnings</p>
            <p className="text-3xl font-black text-amber-600">₦{pendingEarnings.toLocaleString()}</p>
            <p className="text-muted-foreground text-[10px] mt-1">Releasing after hold period</p>
            <div className="mt-3 text-[10px] text-amber-600 font-medium bg-amber-100 rounded-lg px-2 py-1.5">
              Physical orders: held until buyer confirms receipt or 14-day auto-release
            </div>
          </CardContent>
        </Card>

        {/* Available Earnings */}
        <Card className="border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/10 dark:border-emerald-800">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><Unlock className="w-5 h-5 text-emerald-600" /></div>
              <span className="text-[10px] bg-emerald-200/60 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Withdrawable</span>
            </div>
            <p className="text-muted-foreground text-xs font-medium mb-0.5">Available Earnings</p>
            <p className="text-3xl font-black text-emerald-600">₦{availableEarnings.toLocaleString()}</p>
            <p className="text-muted-foreground text-[10px] mt-1">Ready to withdraw to bank</p>
            <Button onClick={() => setWithdrawOpen(true)} size="sm"
              disabled={availableEarnings < 5000 || wallet?.is_frozen}
              className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 border-0 text-xs disabled:opacity-50">
              <Minus className="w-3.5 h-3.5" />{availableEarnings < 5000 ? 'Min ₦5,000' : 'Withdraw'}
            </Button>
          </CardContent>
        </Card>
      </div>

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
              <p className={`text-lg font-black ${s.color}`}>₦{s.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Withdrawal History */}
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
                    <p className="text-xs text-muted-foreground">{wr.account_name || ''} · {wr.bank}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{wr.account_number}</p>
                    <p className="text-[10px] text-muted-foreground">{wr.created_date ? format(new Date(wr.created_date), 'MMM d, yyyy · h:mm a') : ''}</p>
                    {wr.admin_note && <p className="text-xs text-amber-600 mt-0.5 italic">Note: "{wr.admin_note}"</p>}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg border ${badge.color}`}>{badge.label}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Transaction history with tabs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />Transaction History
            <Badge variant="outline" className="ml-auto">{transactions.length} records</Badge>
          </CardTitle>
          <div className="flex gap-1 mt-2">
            {TABS.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition-colors ${activeTab === t ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                {t}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0 px-6">
          {filteredTxs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No transactions here yet.</p>
            </div>
          ) : (
            <div className="pb-2">{filteredTxs.map(tx => <TransactionRow key={tx.id} tx={tx} />)}</div>
          )}
        </CardContent>
      </Card>

      <FundModal open={fundOpen} onClose={() => setFundOpen(false)} user={user} />
      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} wallet={wallet} onSuccess={() => load()} />
    </div>
  );
}