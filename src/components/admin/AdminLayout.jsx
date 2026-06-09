import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

const PAGE_META = {
  '/admin':               { title: 'Overview Dashboard',      subtitle: 'Platform performance at a glance' },
  '/admin/commission':    { title: 'Commission Management',   subtitle: 'Track and manage platform commissions' },
  '/admin/ads':           { title: 'Advertisement Management', subtitle: 'Campaigns, placements & performance' },
  '/admin/advertisers':   { title: 'Advertiser Management',   subtitle: 'Companies and brands on the platform' },
  '/admin/wallet':        { title: 'Wallet & Revenue',        subtitle: 'Platform earnings and financial flow' },
  '/admin/analytics':     { title: 'Analytics Center',        subtitle: 'Deep-dive platform insights' },
  '/admin/reports':       { title: 'Content Reports',         subtitle: 'Review and moderate reported posts' },
  '/admin/notifications': { title: 'Notifications',           subtitle: 'System alerts and updates' },
  '/admin/settings':      { title: 'Platform Settings',       subtitle: 'Configure your platform' },
};

export default function AdminLayout({ user }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const meta = PAGE_META[pathname] || PAGE_META['/admin'];

  return (
    <div className="min-h-screen bg-[#060911] text-white flex">
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <AdminTopbar
          user={user}
          onMenuOpen={() => setMobileOpen(true)}
          title={meta.title}
          subtitle={meta.subtitle}
        />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}