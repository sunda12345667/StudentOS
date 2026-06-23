import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { ShoppingBag, ShieldCheck, RefreshCw, Package, AlertTriangle } from 'lucide-react';

const ICON_MAP = {
  marketplace: '🛒',
  like: '❤️',
  comment: '💬',
  follow: '👤',
  achievement: '🏆',
  grade: '📝',
  announcement: '📢',
};

/**
 * Subscribe to real-time Notification entity updates and show toasts for
 * new notifications belonging to the current user.
 * Must be mounted once in AppLayout or a top-level component.
 */
export default function useRealtimeNotifications(userEmail) {
  // Track IDs we've already toasted so we don't double-fire on re-subscribe
  const seenIds = useRef(new Set());

  useEffect(() => {
    if (!userEmail) return;

    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.type !== 'create') return;
      const notif = event.data;
      if (!notif) return;
      if (notif.user_email !== userEmail) return;
      if (seenIds.current.has(notif.id)) return;
      seenIds.current.add(notif.id);

      const icon = ICON_MAP[notif.type] || '🔔';
      toast(`${icon} ${notif.content}`, {
        duration: 5000,
        action: notif.link ? {
          label: 'View',
          onClick: () => { window.location.href = notif.link; },
        } : undefined,
      });
    });

    return unsub;
  }, [userEmail]);
}