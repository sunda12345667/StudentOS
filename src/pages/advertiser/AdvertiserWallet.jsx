import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Wallet, Plus, ArrowUpRight, Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const TOPUP_PRESETS = [5000, 10000, 25000, 50000, 100000];

export default function AdvertiserWallet({ advertiser, onBalanceUpdate }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleTopUp = async () => {
    const num = Number(amount);
    if (!num || num < 1000) { toast.error('Minimum top-up is ₦1,000'); return; }

    // Check if running in iframe
    if (window.self !== window.top) {
      alert('Payment checkout only works from the published app. Please open the app in a new tab.');
      return;
    }

    setLoading(true);
    try {
      const origin = window.location.origin;
      const res = await base44.functions.invoke('stripeTopUp', {
        amount: num,
        advertiser_id: advertiser.id,
        advertiser_email: advertiser.contact_email,
        advertiser_name: advertiser.company_name,
        success_url: `${origin}/advertiser/wallet?topup=success`,
        cancel_url: `${origin}/advertiser/wallet?topup=cancelled`,
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

  // Check for redirect back from Stripe
  const params = new URLSearchParams(window.location.search);
  const topupStatus = params.get('topup');

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-white font-bold text-xl">Wallet</h1>
        <p className="text-white/40 text-sm mt-1">Manage your advertising balance.</p>
      </div>

      {topupStatus === 'success' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
          <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
          Payment successful! Your balance will update shortly after confirmation.
        </div>
      )}
      {topupStatus === 'cancelled' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Payment was cancelled.
        </div>
      )}

      {/* Balance card */}
      <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-white/50 text-xs">Available Balance</p>
            <p className="text-white font-black text-3xl">₦{Number(advertiser?.balance || 0).toLocaleString()}</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(s => !s)}
          className="w-full bg-blue-600 hover:bg-blue-700 border-0 gap-2">
          <Plus className="w-4 h-4" />Top Up Wallet
        </Button>
      </div>

      {/* Top-up form */}
      {showForm && (
        <div className="rounded-2xl border border-white/8 bg-[#0d1220] p-5 space-y-4">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-400" />Add Funds via Card
          </h3>

          {/* Presets */}
          <div className="grid grid-cols-3 gap-2">
            {TOPUP_PRESETS.map(p => (
              <button key={p} onClick={() => setAmount(String(p))}
                className={`py-2 rounded-xl text-sm font-semibold border transition-all
                  ${amount === String(p) ? 'bg-blue-600/30 border-blue-500/50 text-blue-300' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}>
                ₦{p.toLocaleString()}
              </button>
            ))}
          </div>

          <div>
            <label className="text-white/40 text-xs mb-1.5 block">Or enter custom amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">₦</span>
              <Input
                type="number"
                min="1000"
                className="bg-white/5 border-white/10 text-white pl-7"
                placeholder="e.g. 20000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
            <p className="text-white/20 text-[10px] mt-1">Minimum: ₦1,000</p>
          </div>

          <Button onClick={handleTopUp} disabled={loading || !amount} className="w-full bg-blue-600 hover:bg-blue-700 border-0 gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {loading ? 'Redirecting to Paystack...' : `Pay ₦${amount ? Number(amount).toLocaleString() : '0'} via Paystack`}
          </Button>

          <p className="text-white/20 text-[10px] text-center">Secured by Paystack. You'll be redirected to complete payment.</p>
        </div>
      )}

      {/* Info */}
      <div className="rounded-2xl border border-white/8 bg-[#0d1220] p-4 space-y-2">
        <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">How it works</p>
        <ul className="space-y-1.5 text-white/30 text-xs">
          <li>• Add funds to your wallet using a debit/credit card via Paystack</li>
          <li>• Your balance is used to fund your active ad campaigns</li>
          <li>• Campaign spend is deducted automatically as impressions are served</li>
          <li>• Invoices are generated monthly and sent to your email</li>
        </ul>
      </div>
    </div>
  );
}