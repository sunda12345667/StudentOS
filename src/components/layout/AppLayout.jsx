import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileTopbar from './MobileTopbar';
import BottomNav from './BottomNav';

export default function AppLayout() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.email) {
        base44.entities.UserProfile.filter({ user_email: u.email })
          .then(profiles => { if (profiles.length > 0) setProfile(profiles[0]); })
          .catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const enrichedUser = user ? { ...user, avatar_url: profile?.avatar_url || user.avatar } : null;
  const sidebarWidth = isMobile ? 0 : collapsed ? 64 : 240;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sidebar user={enrichedUser} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      )}

      {/* Topbar — mobile gets dedicated component */}
      {isMobile
        ? <MobileTopbar user={enrichedUser} />
        : <Topbar user={enrichedUser} sidebarCollapsed={collapsed} isMobile={false} />
      }

      {/* Main content */}
      <main
        className="min-h-screen transition-all duration-300"
        style={{
          paddingTop: isMobile ? 56 : 64,
          paddingLeft: sidebarWidth,
          paddingBottom: isMobile ? 96 : 0,
        }}
      >
        <Outlet context={{ user: enrichedUser, profile, refreshProfile: () => {} }} />
      </main>

      {/* Bottom nav — mobile only */}
      {isMobile && <BottomNav user={enrichedUser} />}
    </div>
  );
}