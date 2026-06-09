import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Percent, Megaphone, Building2, Wallet,
  BarChart3, Bell, Settings, ChevronLeft, ChevronRight, Zap, X, Flag
} from 'lucide-react';

const NAV = [
  { label: 'Overview',       path: '/admin',              icon: LayoutDashboard },
  { label: 'Commission',     path: '/admin/commission',   icon: Percent },
  { label: 'Advertisements', path: '/admin/ads',          icon: Megaphone },
  { label: 'Advertisers',    path: '/admin/advertisers',  icon: Building2 },
  { label: 'Wallet & Revenue', path: '/admin/wallet',     icon: Wallet },
  { label: 'Analytics',      path: '/admin/analytics',    icon: BarChart3 },
  { label: 'Reports',        path: '/admin/reports',      icon: Flag },
  { label: 'Notifications',  path: '/admin/notifications', icon: Bell },
  { label: 'Settings',       path: '/admin/settings',     icon: Settings },
];

export default function AdminSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { pathname } = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onMobileClose} />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-screen z-50 flex flex-col transition-all duration-300',
        'bg-[#0a0e1a] border-r border-white/5',
        collapsed ? 'w-16' : 'w-64',
        // Mobile: slide in/out
        'lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/5">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-black text-sm tracking-tight">StudentOS</p>
                <p className="text-[10px] text-blue-400 font-semibold tracking-widest uppercase">Admin</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto">
              <Zap className="w-4 h-4 text-white" />
            </div>
          )}
          <button onClick={onMobileClose} className="lg:hidden text-white/50 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(({ label, path, icon: Icon }) => {
            const active = pathname === path || (path !== '/admin' && pathname.startsWith(path));
            return (
              <Link
                key={path} to={path}
                onClick={onMobileClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                  active
                    ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/20 text-white border border-blue-500/30'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                )}>
                <Icon className={cn('w-4.5 h-4.5 flex-shrink-0 w-[18px] h-[18px]', active ? 'text-blue-400' : '')} />
                {!collapsed && <span className="text-sm font-medium">{label}</span>}
                {active && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={onToggle}
          className="hidden lg:flex items-center justify-center h-10 border-t border-white/5 text-white/30 hover:text-white/70 transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>
    </>
  );
}