import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  ShieldCheck, Truck, CheckCircle2, XCircle, Clock, Package,
  Loader2, AlertTriangle, ShoppingBag, Download, RefreshCw, BookOpen
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
  paid:        { label: 'Awaiting Approval', color: 'bg-blue-100 text-blue-700',    icon: Clock },
  processing:  { label: 'Processing',        color: 'bg-amber-100 text-amber-700',  icon: Clock },
  shipped:     { label: 'Shipped',           color: 'bg-indigo-100 text-indigo-700',icon: Truck },
  delivered:   { label: 'Delivered',         color: 'bg-purple-100 text-purple-700',icon: Package },
  completed:   { label: 'Completed',         color: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
  disputed:    { label: 'Disputed',          color: 'bg-red-100 text-red-700',      icon: AlertTriangle },
  cancelled:   { label: 'Cancelled',         color: 'bg-gray-100 text-gray-500',    icon: XCircle },
  refunded:    { label: 'Refunded',          color: 'bg-gray-100 text-gray-500',    icon: RefreshCw },
};

function OrderCard({ order, isBuyer, onAction }) {
  const [trackingInput, setTrackingInput] = useState(order.tracking_info || '');
  const [processingAction, setProcessingAction] = useState(null);
  const stCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.paid;
  const Icon = stCfg.icon;

  const handleAction = async (action, extra = {}) => {
    setProcessingAction(action);
    try {
      await onAction(order, action, extra);
    } finally {
      setProcessingAction(null);
    }
  };

  const isProcessing = (action) => processingAction === action;
  const anyProcessing = processingAction !== null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} layout>
      <Card className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden flex-shrink-0">
            {order.item_image
              ? <img src={order.item_image} className="w-full h-full object-cover" alt={order.item_title} />
              : <div className="w-full h-full gradient-brand opacity-40" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{order.item_title}</p>
            <p className="text-xs text-muted-foreground">{isBuyer ? `Seller: ${order.seller_name}` : `Buyer: ${order.buyer_name}`}</p>
            <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(order.created_date), { addSuffix: true })}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-black text-primary">₦{Number(order.price).toLocaleString()}</p>
            <Badge className={`${stCfg.color} border-0 text-[10px] gap-0.5 mt-1`}>
              <Icon className="w-2.5 h-2.5" />{stCfg.label}
            </Badge>
          </div>
        </div>

        {/* Delivery info */}
        {order.delivery_option && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            {order.delivery_option === 'pickup' ? '📍' : order.delivery_option === 'digital' ? '📱' : '🚚'}
            {order.delivery_option === 'delivery' ? `Delivery to: ${order.delivery_address}` : order.delivery_option}
            {order.tracking_info && ` · Tracking: ${order.tracking_info}`}
          </p>
        )}

        {/* Digital download (buyer, completed digital order) */}
        {isBuyer && order.item_type === 'digital' && order.status === 'completed' && (
          order.file_url
            ? <a href={order.file_url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="h-8 text-xs gap-1 w-full gradient-brand border-0">
                  <Download className="w-3.5 h-3.5" /> Download File
                </Button>
              </a>
            : <p className="text-xs text-muted-foreground text-center py-1">No downloadable file attached to this item.</p>
        )}

        {/* Awaiting seller approval banner for digital */}
        {isBuyer && order.item_type === 'digital' && order.status === 'paid' && (
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700 flex items-center gap-2">
            <Clock className="w-4 h-4 flex-shrink-0" />
            Payment received. Waiting for the seller to approve your order.
          </div>
        )}

        {/* ── SELLER ACTIONS ── */}
        {!isBuyer && (
          <div className="flex gap-2 flex-wrap">
            {/* Approve: paid → processing */}
            {order.status === 'paid' && (
              <>
                <Button size="sm" disabled={anyProcessing} className="h-8 text-xs gradient-brand border-0 gap-1 flex-1"
                  onClick={() => handleAction('approve')}>
                  {isProcessing('approve') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Approve Order
                </Button>
                <Button size="sm" variant="outline" disabled={anyProcessing} className="h-8 text-xs text-destructive"
                  onClick={() => handleAction('cancel')}>
                  {isProcessing('cancel') ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Cancel
                </Button>
              </>
            )}

            {/* Mark Shipped: processing → shipped */}
            {order.status === 'processing' && order.item_type === 'physical' && (
              <div className="flex gap-2 flex-1">
                <Input value={trackingInput} onChange={e => setTrackingInput(e.target.value)}
                  placeholder="Tracking # (optional)" className="h-8 text-xs flex-1" />
                <Button size="sm" disabled={anyProcessing} className="h-8 text-xs gradient-brand border-0 whitespace-nowrap"
                  onClick={() => handleAction('mark_shipped', { tracking_info: trackingInput })}>
                  {isProcessing('mark_shipped') ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Truck className="w-3.5 h-3.5 mr-1" />}
                  Mark Shipped
                </Button>
              </div>
            )}

            {/* Mark Delivered: shipped → delivered */}
            {order.status === 'shipped' && (
              <Button size="sm" disabled={anyProcessing} className="h-8 text-xs gradient-brand border-0 gap-1 flex-1"
                onClick={() => handleAction('mark_delivered')}>
                {isProcessing('mark_delivered') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />}
                Mark Delivered
              </Button>
            )}
          </div>
        )}

        {/* ── BUYER ACTIONS ── */}
        {isBuyer && (
          <div className="flex gap-2 flex-wrap">
            {/* Confirm receipt (releases escrow immediately) */}
            {['shipped', 'delivered', 'processing'].includes(order.status) && !order.escrow_released && (
              <Button size="sm" disabled={anyProcessing} className="h-8 text-xs gradient-brand border-0 gap-1 flex-1"
                onClick={() => handleAction('confirm_received')}>
                {isProcessing('confirm_received') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                Confirm & Release Payment
              </Button>
            )}

            {/* Cancel (only before seller ships) */}
            {['paid', 'processing'].includes(order.status) && (
              <Button size="sm" variant="outline" disabled={anyProcessing} className="h-8 text-xs text-destructive"
                onClick={() => handleAction('cancel')}>
                {isProcessing('cancel') ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                Cancel Order
              </Button>
            )}

            {/* Dispute */}
            {['shipped', 'delivered'].includes(order.status) && (
              <Button size="sm" variant="outline" disabled={anyProcessing} className="h-8 text-xs text-destructive"
                onClick={() => handleAction('dispute')}>
                {isProcessing('dispute') ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <AlertTriangle className="w-3.5 h-3.5 mr-1" />}
                Dispute
              </Button>
            )}
          </div>
        )}

        {/* Completion banner */}
        {order.status === 'completed' && (
          <div className="p-2 rounded-lg bg-green-50 border border-green-100 text-xs text-green-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Transaction complete! Payment released to seller.
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

  const loadOrders = useCallback(async () => {
    if (!user?.email) return;
    const [b, s] = await Promise.all([
      base44.entities.Order.filter({ buyer_email: user.email }, '-created_date', 50),
      base44.entities.Order.filter({ seller_email: user.email }, '-created_date', 50),
    ]);
    setBuying(b);
    setSelling(s);
    setLoading(false);
  }, [user?.email]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Real-time subscription — update order in state instantly when backend changes it
  useEffect(() => {
    if (!user?.email) return;
    const unsub = base44.entities.Order.subscribe((event) => {
      const updated = event.data;
      if (!updated) return;
      if (updated.buyer_email === user.email) {
        setBuying(prev => {
          const exists = prev.find(o => o.id === updated.id);
          if (exists) return prev.map(o => o.id === updated.id ? { ...o, ...updated } : o);
          if (event.type === 'create') return [updated, ...prev];
          return prev;
        });
      }
      if (updated.seller_email === user.email) {
        setSelling(prev => {
          const exists = prev.find(o => o.id === updated.id);
          if (exists) return prev.map(o => o.id === updated.id ? { ...o, ...updated } : o);
          if (event.type === 'create') return [updated, ...prev];
          return prev;
        });
      }
    });
    return unsub;
  }, [user?.email]);

  const handleAction = async (order, action, extra = {}) => {
    // Optimistic UI update first
    const optimisticStatus = {
      approve: 'processing',
      mark_shipped: 'shipped',
      mark_delivered: 'delivered',
      confirm_received: 'completed',
      cancel: 'cancelled',
      dispute: 'disputed',
    }[action];

    if (optimisticStatus) {
      const patch = { status: optimisticStatus, ...(action === 'confirm_received' ? { escrow_released: true } : {}), ...(extra.tracking_info ? { tracking_info: extra.tracking_info } : {}) };
      setBuying(prev => prev.map(o => o.id === order.id ? { ...o, ...patch } : o));
      setSelling(prev => prev.map(o => o.id === order.id ? { ...o, ...patch } : o));
    }

    const res = await base44.functions.invoke('updateOrderStatus', {
      order_id: order.id,
      action,
      ...extra,
    });

    if (res.data?.error) {
      // Revert optimistic update on error
      toast.error(res.data.error);
      loadOrders(); // Reload true state
      return;
    }

    // Confirm with server state
    if (res.data?.order) {
      const serverOrder = res.data.order;
      setBuying(prev => prev.map(o => o.id === order.id ? { ...o, ...serverOrder } : o));
      setSelling(prev => prev.map(o => o.id === order.id ? { ...o, ...serverOrder } : o));
    }

    const successMessages = {
      approve: 'Order approved!',
      mark_shipped: 'Order marked as shipped.',
      mark_delivered: 'Order marked as delivered.',
      confirm_received: 'Payment released to seller!',
      cancel: 'Order cancelled and refunded.',
      dispute: 'Dispute raised. Our team will review it.',
    };
    toast.success(successMessages[action] || 'Order updated.');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const digitalPurchases = buying.filter(o => o.item_type === 'digital' && o.status === 'completed');

  return (
    <Tabs defaultValue="buying">
      <TabsList className="mb-4 flex">
        <TabsTrigger value="buying" className="gap-1.5 flex-1">
          <ShoppingBag className="w-4 h-4" />Orders ({buying.length})
        </TabsTrigger>
        <TabsTrigger value="library" className="gap-1.5 flex-1">
          <BookOpen className="w-4 h-4" />Library ({digitalPurchases.length})
        </TabsTrigger>
        <TabsTrigger value="selling" className="gap-1.5 flex-1">
          <Package className="w-4 h-4" />Selling ({selling.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="buying">
        {buying.length === 0
          ? <div className="text-center py-12 text-muted-foreground"><ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No orders yet</p></div>
          : <AnimatePresence><div className="space-y-3">{buying.map(o => <OrderCard key={o.id} order={o} isBuyer onAction={handleAction} />)}</div></AnimatePresence>
        }
      </TabsContent>

      <TabsContent value="library">
        {digitalPurchases.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No purchased items yet</p>
            <p className="text-xs mt-1">Approved digital purchases will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {digitalPurchases.map(o => (
              <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                      {o.item_image
                        ? <img src={o.item_image} className="w-full h-full object-cover" alt={o.item_title} />
                        : <div className="w-full h-full gradient-brand opacity-40 flex items-center justify-center"><Download className="w-5 h-5 text-white" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{o.item_title}</p>
                      <p className="text-xs text-muted-foreground">by {o.seller_name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Purchased {o.buyer_confirmed_at ? format(new Date(o.buyer_confirmed_at), 'MMM d, yyyy') : format(new Date(o.created_date), 'MMM d, yyyy')}
                        {' · '}Order #{o.reference || o.id.slice(0, 8)}
                      </p>
                      <p className="text-xs font-semibold text-primary mt-0.5">₦{Number(o.price).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    {o.file_url
                      ? <a href={o.file_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="w-full h-9 text-xs gap-2 gradient-brand border-0">
                            <Download className="w-4 h-4" /> Download Now
                          </Button>
                        </a>
                      : <p className="text-xs text-muted-foreground text-center py-2">No file attached — contact seller.</p>
                    }
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="selling">
        {selling.length === 0
          ? <div className="text-center py-12 text-muted-foreground"><Package className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No incoming orders</p></div>
          : <AnimatePresence><div className="space-y-3">{selling.map(o => <OrderCard key={o.id} order={o} isBuyer={false} onAction={handleAction} />)}</div></AnimatePresence>
        }
      </TabsContent>
    </Tabs>
  );
}