import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileTopbar from './MobileTopbar';
import BottomNav from './BottomNav';

// Pages where bottom nav should hide when keyboard opens (chat/input-heavy pages)
const CHAT_PAGES = ['/messages'];

export default function AppLayout() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const location = useLocation();

  const isChatPage = CHAT_PAGES.some(p => location.pathname.startsWith(p));

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Detect virtual keyboard via visualViewport API
  useEffect(() => {
    if (!isMobile || !isChatPage) { setKeyboardOpen(false); return; }
    const vv = window.visualViewport;
    if (!vv) return;
    const threshold = 150; // px shrink to count as keyboard open
    const initialHeight = vv.height;
    const onViewportChange = () => {
      setKeyboardOpen(vv.height < initialHeight - threshold);
    };
    vv.addEventListener('resize', onViewportChange);
    return () => vv.removeEventListener('resize', onViewportChange);
  }, [isMobile, isChatPage, location.pathname]);

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

  // On chat pages, remove bottom padding so the chat can use full viewport
  const bottomPad = isMobile && !isChatPage ? 96 : isMobile && isChatPage ? 0 : 0;

  return (
    <div className="bg-background" style={{ minHeight: '100dvh' }}>
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
        className="transition-all duration-300"
        style={{
          paddingTop: isMobile ? 56 : 64,
          paddingLeft: sidebarWidth,
          paddingBottom: bottomPad,
          minHeight: '100dvh',
        }}
      >
        <Outlet context={{ user: enrichedUser, profile, refreshProfile: () => {}, isMobile, keyboardOpen }} />
      </main>

      {/* Bottom nav — mobile only, hide when keyboard is open on chat pages */}
      {isMobile && (
        <BottomNav
          user={enrichedUser}
          hidden={isChatPage && keyboardOpen}
        />
      )}
    </div>
  );
}