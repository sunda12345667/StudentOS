import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { LayoutDashboard, Megaphone, Wallet, FileText, LogOut, Menu, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const NAV = [
  { path: '/advertiser', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/advertiser/campaigns', label: 'Campaigns', icon: Megaphone },
  { path: '/advertiser/wallet', label: 'Wallet', icon: Wallet },
  { path: '/advertiser/invoices', label: 'Invoices', icon: FileText },
];

export default function AdvertiserLayout({ advertiser }) {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#060911] text-white flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-[#0a0e1a] border-r border-white/8 flex flex-col transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-black text-white text-sm">E</div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">EduVerse</p>
              <p className="text-white/30 text-[9px]">Advertiser Portal</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-white/40"><X className="w-4 h-4" /></button>
        </div>

        {/* Advertiser info */}
        {advertiser && (
          <div className="px-4 py-3 border-b border-white/8">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-base font-black text-white flex-shrink-0">
                {(advertiser.company_name || 'A')[0]}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{advertiser.company_name}</p>
                <p className="text-white/40 text-[10px] truncate">{advertiser.contact_email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = pathname === path;
            return (
              <Link key={path} to={path} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${active ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                <Icon className="w-4 h-4" />{label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/8">
          <button onClick={() => base44.auth.logout('/login')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all w-full">
            <LogOut className="w-4 h-4" />Sign Out
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-60">
        <header className="sticky top-0 z-30 h-14 px-5 flex items-center border-b border-white/8 bg-[#0a0e1a]/80 backdrop-blur-xl">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-white/50 hover:text-white mr-3">
            <Menu className="w-5 h-5" />
          </button>
          <p className="text-white/40 text-sm">Advertiser Portal</p>
        </header>
        <main className="flex-1 p-5 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}