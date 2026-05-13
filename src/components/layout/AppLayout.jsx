import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.email) {
        base44.entities.UserProfile.filter({ user_email: u.email })
          .then(profiles => {
            if (profiles.length > 0) {
              setProfile(profiles[0]);
            }
          }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const enrichedUser = user ? { ...user, avatar_url: profile?.avatar_url || user.avatar } : null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={enrichedUser} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <Topbar user={enrichedUser} sidebarCollapsed={collapsed} />
      <main className={`pt-16 min-h-screen transition-all duration-300 ${collapsed ? 'pl-16' : 'pl-60'}`}>
        <Outlet context={{ user: enrichedUser, profile, refreshProfile: () => {} }} />
      </main>
    </div>
  );
}