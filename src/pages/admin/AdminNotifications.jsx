import { useState } from 'react';
import { Bell, DollarSign, Megaphone, Building2, ShieldCheck, AlertTriangle, CheckCheck, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DEMO_NOTIFICATIONS = [
  { id: 1, type: 'revenue', title: 'New commission earned', message: 'Commission of ₦1,400 from HP Laptop sale (Emeka B.)', time: '2 minutes ago', read: false },
  { id: 2, type: 'advertiser', title: 'New advertiser registered', message: 'PrepMaster Academy submitted an advertiser application', time: '18 minutes ago', read: false },
  { id: 3, type: 'ad', title: 'Ad campaign pending approval', message: 'JAMB Prep Course campaign from PrepMaster Academy awaiting review', time: '35 minutes ago', read: false },
  { id: 4, type: 'revenue', title: 'Ad revenue received', message: 'TechCorp Campaign generated ₦3,200 in ad revenue today', time: '1 hour ago', read: false },
  { id: 5, type: 'system', title: 'New school joined', message: 'Covenant University joined EduVerse with 450 students', time: '2 hours ago', read: true },
  { id: 6, type: 'transaction', title: 'Withdrawal request', message: 'Platform payout request of ₦20,000 pending processing', time: '5 hours ago', read: true },
  { id: 7, type: 'ad', title: 'Campaign completed', message: 'FoodieGo App Campus Food campaign has ended successfully', time: '1 day ago', read: true },
  { id: 8, type: 'revenue', title: 'Daily earnings milestone', message: 'Daily earnings crossed ₦10,000 threshold for the first time!', time: '1 day ago', read: true },
  { id: 9, type: 'system', title: 'System alert', message: 'Marketplace listings surpassed 500 active items', time: '2 days ago', read: true },
  { id: 10, type: 'advertiser', title: 'Advertiser verified', message: 'AccessBank account has been verified by admin', time: '3 days ago', read: true },
];

const TYPE_CFG = {
  revenue:     { icon: DollarSign,  color: 'bg-emerald-500/15 text-emerald-400', border: 'border-emerald-500/20' },
  advertiser:  { icon: Building2,   color: 'bg-blue-500/15 text-blue-400',       border: 'border-blue-500/20' },
  ad:          { icon: Megaphone,   color: 'bg-purple-500/15 text-purple-400',   border: 'border-purple-500/20' },
  transaction: { icon: DollarSign,  color: 'bg-amber-500/15 text-amber-400',     border: 'border-amber-500/20' },
  system:      { icon: AlertTriangle, color: 'bg-red-500/15 text-red-400',       border: 'border-red-500/20' },
};

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const [filter, setFilter] = useState('all');

  const markAllRead = () => setNotifications(n => n.map(x => ({ ...x, read: true })));
  const markRead = id => setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  const deleteNotif = id => setNotifications(n => n.filter(x => x.id !== id));

  const filtered = filter === 'all'
    ? notifications
    : filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-white font-bold">Notifications</h2>
            <p className="text-white/40 text-xs">{unreadCount} unread</p>
          </div>
        </div>
        <Button onClick={markAllRead} size="sm" variant="outline" className="border-white/20 text-white/60 hover:bg-white/10 gap-1.5 text-xs">
          <CheckCheck className="w-3.5 h-3.5" />Mark all read
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[['all','All'],['unread','Unread'],['revenue','Revenue'],['ad','Ads'],['advertiser','Advertisers'],['transaction','Transactions'],['system','System']].map(([v,l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === v ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/50 hover:text-white border border-white/10'
            }`}>
            {l}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map(notif => {
          const cfg = TYPE_CFG[notif.type] || TYPE_CFG.system;
          const Icon = cfg.icon;
          return (
            <div
              key={notif.id}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                notif.read
                  ? 'bg-white/[0.02] border-white/5'
                  : `bg-white/[0.04] border-white/10`
              }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0" onClick={() => markRead(notif.id)}>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={`text-sm font-semibold ${notif.read ? 'text-white/60' : 'text-white'}`}>{notif.title}</p>
                  {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                </div>
                <p className="text-white/40 text-xs">{notif.message}</p>
                <p className="text-white/25 text-[10px] mt-1">{notif.time}</p>
              </div>
              <button onClick={() => deleteNotif(notif.id)} className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-10 h-10 mx-auto mb-3 text-white/10" />
            <p className="text-white/30 text-sm">No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}