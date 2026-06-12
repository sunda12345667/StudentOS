import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

const TYPE_LABELS = {
  course: 'Course', community: 'Community', campus_group: 'Study Group',
  assignment: 'Assignment', market_item: 'Listing', post: 'Post',
};
const TYPE_COLORS = {
  course: 'bg-blue-100 text-blue-700', community: 'bg-purple-100 text-purple-700',
  campus_group: 'bg-green-100 text-green-700', assignment: 'bg-amber-100 text-amber-700',
  market_item: 'bg-orange-100 text-orange-700', post: 'bg-gray-100 text-gray-700',
};

const RESTORE_HANDLERS = {
  course: (item) => base44.entities.Course.create(item.item_data),
  community: (item) => base44.entities.Community.create(item.item_data),
  campus_group: (item) => base44.entities.CampusGroup.create(item.item_data),
  assignment: (item) => base44.entities.Assignment.create(item.item_data),
  market_item: (item) => base44.entities.MarketItem.create(item.item_data),
  post: (item) => base44.entities.Post.create(item.item_data),
};

export default function RecycleBin({ userEmail }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  useEffect(() => { load(); }, [userEmail]);

  const load = async () => {
    setLoading(true);
    const all = await base44.entities.DeletedItem.filter(
      { deleted_by_email: userEmail, restored: false, permanently_deleted: false },
      '-created_date', 100
    );
    // Filter out items past 30-day window
    const now = new Date();
    const active = all.filter(item => {
      if (!item.restore_by) return true;
      return new Date(item.restore_by) > now;
    });
    setItems(active);
    setLoading(false);
  };

  const handleRestore = async (item) => {
    setActionId(item.id);
    try {
      const handler = RESTORE_HANDLERS[item.item_type];
      if (handler) {
        const { id, created_date, updated_date, created_by_id, ...data } = item.item_data || {};
        await handler({ ...item, item_data: data });
      }
      await base44.entities.DeletedItem.update(item.id, { restored: true });
      setItems(prev => prev.filter(i => i.id !== item.id));
    } finally {
      setActionId(null);
    }
  };

  const handlePermanentDelete = async (item) => {
    setActionId(item.id);
    await base44.entities.DeletedItem.update(item.id, { permanently_deleted: true });
    setItems(prev => prev.filter(i => i.id !== item.id));
    setActionId(null);
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Trash2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Recycle Bin is empty</p>
          <p className="text-sm mt-1">Deleted items appear here for 30 days</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-1">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Items are permanently deleted after 30 days from deletion.
          </div>
          {items.map(item => {
            const title = item.item_data?.title || item.item_data?.name || item.item_id;
            const expiresIn = item.restore_by ? formatDistanceToNow(parseISO(item.restore_by), { addSuffix: true }) : 'in 30 days';
            const isActing = actionId === item.id;
            return (
              <Card key={item.id} className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-[10px] ${TYPE_COLORS[item.item_type] || 'bg-gray-100 text-gray-700'}`}>
                      {TYPE_LABELS[item.item_type] || item.item_type}
                    </Badge>
                    <span className="font-semibold text-sm truncate">{title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Expires {expiresIn}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                    onClick={() => handleRestore(item)} disabled={isActing}>
                    {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                    Restore
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handlePermanentDelete(item)} disabled={isActing}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}