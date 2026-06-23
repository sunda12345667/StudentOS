import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Truck, CheckCircle2, XCircle, Clock, Package, Loader2, AlertTriangle, ShoppingBag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const STATUS_CONFIG = {
  pending:     { label: 'Pending',      color: 'bg-gray-100 text-gray-600',    icon: Clock },
  escrow_held: { label: 'Escrow Held',  color: 'bg-amber-100 text-amber-700',  icon: ShieldCheck },
  shipped:     { label: 'Shipped',      color: 'bg-blue-100 text-blue-700',    icon: Truck },
  delivered:   { label: 'Delivered',    color: 'bg-indigo-100 text-indigo-700',icon: Package },
  completed:   { label: 'Completed',    color: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
  disputed:    { label: 'Disputed',     color: 'bg-red-100 text-red-700',      icon: AlertTriangle },
  cancelled:   { label: 'Cancelled',    color: 'bg-gray-100 text-gray-500',    icon: XCircle },
};

function OrderCard({ order, isBuyer, onAction }) {
  const [trackingInput, setTrackingInput] = useState(order.tracking_info || '');
  const [processing, setProcessing] = useState(false);
  const stCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const Icon = stCfg.icon;

  const handleActionClick = async (action, tracking = '') => {
    setProcessing(true);
    try {
      await onAction(order, action, tracking);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden flex-shrink-0">
            {order.item_image ? <img src={order.item_image} className="w-full h-full object-cover" /> : <div className="w-full h-full gradient-brand opacity-40" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{order.item_title}</p>
            <p className="text-xs text-muted-foreground">{isBuyer ? `Seller: ${order.seller_name}` : `Buyer: ${order.buyer_name}`}</p>
            <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(order.created_date), { addSuffix: true })}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-black text-primary">₦{Number(order.price).toLocaleString()}</p>
            <Badge className={`${stCfg.color} border-0 text-[10px] gap-0.5 mt-1`}><Icon className="w-2.5 h-2.5" />{stCfg.label}</Badge>
          </div>
        </div>

        {order.delivery_option && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            {order.delivery_option === 'pickup' ? '📍' : order.delivery_option === 'digital' ? '📱' : '🚚'}
            {order.delivery_option === 'delivery' ? `Delivery to: ${order.delivery_address}` : order.delivery_option}
            {order.tracking_info && ` · Tracking: ${order.tracking_info}`}
          </p>
        )}

        {/* Seller actions */}
        {!isBuyer && (
          <div className="flex gap-2 flex-wrap">
            {order.status === 'escrow_held' && (
              <>
                <div className="flex gap-2 flex-1">
                  <Input value={trackingInput} onChange={e => setTrackingInput(e.target.value)} placeholder="Tracking #" className="h-8 text-xs flex-1" />
                  <Button size="sm" disabled={processing} className="h-8 text-xs gradient-brand border-0 whitespace-nowrap" onClick={() => handleActionClick('shipped', trackingInput)}>
                    {processing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} Mark Shipped
                  </Button>
                </div>
              </>
            )}
            {order.status === 'pending' && (
              <Button size="sm" variant="outline" disabled={processing} className="h-8 text-xs text-destructive" onClick={() => handleActionClick('cancelled')}>
                {processing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} Cancel
              </Button>
            )}
          </div>
        )}

        {/* Buyer actions */}
        {isBuyer && (
          <div className="flex gap-2 flex-wrap">
            {(order.status === 'shipped' || order.status === 'delivered') && (
              <Button size="sm" disabled={processing} className="h-8 text-xs gradient-brand border-0 gap-1" onClick={() => handleActionClick('completed')}>
                {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />} Release Payment
              </Button>
            )}
            {order.status === 'escrow_held' && (
              <Button size="sm" variant="outline" disabled={processing} className="h-8 text-xs text-destructive" onClick={() => handleActionClick('disputed')}>
                {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <AlertTriangle className="w-3.5 h-3.5 mr-1" />} Dispute
              </Button>
            )}
            {order.status === 'pending' && (
              <Button size="sm" variant="outline" disabled={processing} className="h-8 text-xs text-destructive" onClick={() => handleActionClick('cancelled')}>
                {processing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} Cancel
              </Button>
            )}
          </div>
        )}

        {order.status === 'completed' && !order.escrow_released && (
          <div className="p-2 rounded-lg bg-green-50 border border-green-100 text-xs text-green-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />Payment released to seller. Transaction complete!
          </div>
        )}
      </Card>
    </motion.div>
  );
}

export default function OrderManagement({ user }) {
  const [buying, setBuying] = useState([]);
  const [selling, setSelling] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    Promise.all([
      base44.entities.Order.filter({ buyer_email: user.email }, '-created_date', 30),
      base44.entities.Order.filter({ seller_email: user.email }, '-created_date', 30),
    ]).then(([b, s]) => { setBuying(b); setSelling(s); }).finally(() => setLoading(false));
  }, [user?.email]);

  const handleAction = async (order, action, tracking = '') => {
    const updates = { status: action };
    if (action === 'shipped' && tracking) updates.tracking_info = tracking;

    if (action === 'completed') {
      // Delegate atomic escrow release to backend (handles ledger, wallet, notifications)
      const res = await base44.functions.invoke('releaseEscrow', { order_id: order.id, trigger: 'buyer_confirmed' });
      if (res.data?.error) { toast.error(res.data.error); return; }
      await base44.entities.MarketItem.update(order.item_id, { status: 'sold' }).catch(() => {});
      // Status already updated by releaseEscrow backend
      setBuying(prev => prev.map(o => o.id === order.id ? { ...o, status: 'completed', escrow_released: true } : o));
      setSelling(prev => prev.map(o => o.id === order.id ? { ...o, status: 'completed', escrow_released: true } : o));
      toast.success('Payment released to seller!');
      return;
    }

    if (action === 'cancelled') {
      updates.status = 'cancelled';
      await base44.entities.MarketItem.update(order.item_id, { status: 'available' }).catch(() => {});
    }

    await base44.entities.Order.update(order.id, updates);
    setBuying(prev => prev.map(o => o.id === order.id ? { ...o, ...updates } : o));
    setSelling(prev => prev.map(o => o.id === order.id ? { ...o, ...updates } : o));
    toast.success(`Order ${action}`);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <Tabs defaultValue="buying">
      <TabsList className="mb-4">
        <TabsTrigger value="buying" className="gap-1.5"><ShoppingBag className="w-4 h-4" />Buying ({buying.length})</TabsTrigger>
        <TabsTrigger value="selling" className="gap-1.5"><Package className="w-4 h-4" />Selling ({selling.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="buying">
        {buying.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground"><ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No orders yet</p></div>
        ) : <div className="space-y-3">{buying.map(o => <OrderCard key={o.id} order={o} isBuyer onAction={handleAction} />)}</div>}
      </TabsContent>
      <TabsContent value="selling">
        {selling.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground"><Package className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No incoming orders</p></div>
        ) : <div className="space-y-3">{selling.map(o => <OrderCard key={o.id} order={o} isBuyer={false} onAction={handleAction} />)}</div>}
      </TabsContent>
    </Tabs>
  );
}