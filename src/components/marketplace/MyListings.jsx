import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CAT_CONFIG } from './ItemCard';
import { Eye, Trash2, CheckCircle2, Clock, Loader2, PackageOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  available: { label: 'Available', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  reserved:  { label: 'Reserved',  color: 'bg-amber-100 text-amber-700', icon: Clock },
  sold:      { label: 'Sold',      color: 'bg-gray-100 text-gray-600',   icon: CheckCircle2 },
};

export default function MyListings({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      base44.entities.MarketItem.filter({ seller_email: user.email }, '-created_date', 50)
        .then(setItems).finally(() => setLoading(false));
    }
  }, [user?.email]);

  const updateStatus = async (item, status) => {
    await base44.entities.MarketItem.update(item.id, { status });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status } : i));
    toast.success(`Item marked as ${status}`);
  };

  const deleteItem = async (id) => {
    await base44.entities.MarketItem.delete(id);
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Listing removed');
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (items.length === 0) return (
    <div className="text-center py-16 text-muted-foreground">
      <PackageOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p className="font-medium">No listings yet</p>
      <p className="text-sm mt-1">Start selling by clicking "List Item"</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const cfg = CAT_CONFIG[item.category] || CAT_CONFIG.textbook;
        const Icon = cfg.icon;
        const stCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.available;
        const StIcon = stCfg.icon;
        return (
          <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="p-4 flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cfg.grad} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-7 h-7 text-white/80" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className={`${stCfg.color} border-0 text-[10px] gap-0.5`}><StIcon className="w-2.5 h-2.5" />{stCfg.label}</Badge>
                      <span className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(item.created_date), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <p className="font-black text-primary text-lg flex-shrink-0">${Number(item.price).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Eye className="w-3.5 h-3.5" />{item.views || 0} views</span>
                  {item.status === 'available' && (
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => updateStatus(item, 'sold')}>Mark Sold</Button>
                  )}
                  {item.status === 'available' && (
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => updateStatus(item, 'reserved')}>Mark Reserved</Button>
                  )}
                  {item.status !== 'available' && (
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => updateStatus(item, 'available')}>Relist</Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive ml-auto" onClick={() => deleteItem(item.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}