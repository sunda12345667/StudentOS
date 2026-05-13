import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from './Navbar';

export default function AppLayout() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <main className="pt-14">
        <Outlet context={{ user }} />
      </main>
    </div>
  );
}