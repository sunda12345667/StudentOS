import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const ICON_MAP = {
  marketplace: '🛒',
  like: '❤️',
  comment: '💬',
  follow: '👤',
  achievement: '🏆',
  grade: '📝',
  announcement: '📢',
};

// Request browser push permission once and return whether it's granted
async function requestPushPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// Fire a native browser/OS notification
function sendBrowserNotification(title, body, icon) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: `studentos-${Date.now()}`,
      requireInteraction: false,
    });
    // Auto-close after 6s
    setTimeout(() => n.close(), 6000);
    n.onclick = () => { window.focus(); n.close(); };
  } catch (_) { /* silently ignore – e.g. service worker not ready */ }
}

/**
 * Subscribe to real-time Notification entity updates and show both
 * an in-app Sonner toast AND a native browser push notification.
 * Must be mounted once in AppLayout.
 */
export default function useRealtimeNotifications(userEmail) {
  const seenIds = useRef(new Set());
  const pushGranted = useRef(false);

  // Request push permission once on mount
  useEffect(() => {
    requestPushPermission().then(granted => { pushGranted.current = granted; });
  }, []);

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

      // 1. In-app Sonner toast (always shown)
      toast(`${icon} ${notif.content}`, {
        duration: 5000,
        action: notif.link ? {
          label: 'View',
          onClick: () => { window.location.href = notif.link; },
        } : undefined,
      });

      // 2. Native browser / OS push notification (when tab is hidden or user has granted permission)
      if (pushGranted.current) {
        const titleMap = {
          marketplace: 'StudentOS Marketplace',
          like: 'Someone liked your post',
          comment: 'New comment',
          follow: 'New follower',
          achievement: 'Achievement unlocked!',
          grade: 'New grade',
          announcement: 'Announcement',
        };
        const title = titleMap[notif.type] || 'StudentOS';
        sendBrowserNotification(title, notif.content, '/favicon.ico');
      }
    });

    return unsub;
  }, [userEmail]);
}