import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Truck, MapPin, Download, ShieldCheck, Loader2, CheckCircle2, ArrowRight, Clock } from 'lucide-react';
import { toast } from 'sonner';

const DELIVERY_OPTIONS = [
  { value: 'pickup', icon: MapPin, label: 'Pickup', desc: 'Meet the seller in person', color: 'border-blue-200 bg-blue-50 text-blue-700' },
  { value: 'delivery', icon: Truck, label: 'Delivery', desc: 'Seller delivers to your address', color: 'border-green-200 bg-green-50 text-green-700' },
  { value: 'digital', icon: Download, label: 'Digital / Online', desc: 'Receive via link or email', color: 'border-purple-200 bg-purple-50 text-purple-700' },
];

export default function PlaceOrder({ item, open, onClose, buyer }) {
  const [delivery, setDelivery] = useState(item?.is_digital ? 'digital' : 'pickup');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(1); // 1=options 2=escrow confirm 3=done
  const [saving, setSaving] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  if (!item) return null;

  const placeOrder = async () => {
    setSaving(true);
    try {
      const res = await base44.functions.invoke('purchaseProduct', {
        item_id: item.id,
        delivery_option: delivery,
        delivery_address: address,
        notes,
      });
      if (res.data?.error) {
        toast.error(res.data.error);
        return;
      }
      setOrderResult(res.data);
      toast.success(res.data.message || 'Order placed successfully!');
      setStep(3);
    } catch (e) {
      toast.error(e?.message || 'Purchase failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Place Order</DialogTitle></DialogHeader>

        {step === 1 && (
          <div className="space-y-4 mt-2">
            <div className="rounded-xl border p-3 flex items-center gap-3 bg-muted/50">
              <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full gradient-brand opacity-50" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.seller_name}</p>
              </div>
              <p className="font-black text-primary text-lg">₦{Number(item.price).toLocaleString()}</p>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Delivery Option</p>
              <div className="space-y-2">
                {DELIVERY_OPTIONS.filter(d => item.is_digital ? d.value === 'digital' : d.value !== 'digital').map(opt => {
                  const Icon = opt.icon;
                  return (
                    <button key={opt.value} onClick={() => setDelivery(opt.value)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${delivery === opt.value ? opt.color : 'border-border hover:bg-muted'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${delivery === opt.value ? '' : 'bg-muted'}`}>
                        <Icon className={`w-4 h-4 ${delivery === opt.value ? '' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{opt.label}</p>
                        <p className="text-[11px] opacity-70">{opt.desc}</p>
                      </div>
                      {delivery === opt.value && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {delivery === 'delivery' && (
              <div><label className="text-xs font-medium mb-1 block">Delivery Address</label>
                <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, City, State..." />
              </div>
            )}

            <div><label className="text-xs font-medium mb-1 block">Notes to Seller (optional)</label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any special instructions..." />
            </div>

            <Button onClick={() => setStep(2)} disabled={delivery === 'delivery' && !address.trim()} className="w-full gradient-brand border-0 gap-2">
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 mt-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
              <ShieldCheck className="w-10 h-10 text-amber-600 mx-auto mb-2" />
              <p className="font-bold text-amber-900">Escrow Protection</p>
              <p className="text-xs text-amber-800 mt-1">₦<strong>{Number(item.price).toLocaleString()}</strong> will be deducted from your wallet and held securely until you confirm receipt. The seller only gets paid after you're satisfied.</p>
            </div>
            <div className="rounded-xl bg-muted p-4 space-y-2 text-sm">
              {[
                ['Item', item.title],
                ['Price', `₦${Number(item.price).toLocaleString()}`],
                ['Delivery', DELIVERY_OPTIONS.find(d => d.value === delivery)?.label],
                delivery === 'delivery' && ['Address', address],
              ].filter(Boolean).map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium text-right max-w-[60%] truncate">{v}</span></div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={placeOrder} disabled={saving} className="flex-1 gradient-brand border-0 gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Confirm & Pay
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
            <h3 className="font-black text-xl">
              {item.is_digital ? 'Payment Received!' : 'Order Placed!'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {item.is_digital
                ? 'Your payment is secured. The seller will approve your order and your download will be ready shortly.'
                : 'Payment held in escrow. The seller will process your order shortly.'}
            </p>
            {item.is_digital && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700 flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0" />
                Check your <strong>Library tab</strong> in Orders once the seller approves.
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={onClose}>
              {item.is_digital ? 'View My Orders' : 'View Orders'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}