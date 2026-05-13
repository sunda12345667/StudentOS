import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import AdvertiserLayout from '@/components/advertiser/AdvertiserLayout';
import AdvertiserDashboard from './AdvertiserDashboard';
import AdvertiserCampaigns from './AdvertiserCampaigns';
import AdvertiserWallet from './AdvertiserWallet';
import AdvertiserInvoices from './AdvertiserInvoices';
import AdvertiserLogin from './AdvertiserLogin';

export default function AdvertiserPortal() {
  const [advertiser, setAdvertiser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { pathname } = useLocation();

  const loadAdvertiser = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      if (!user) { setAdvertiser(null); setLoading(false); return; }
      const list = await base44.entities.Advertiser.filter({ contact_email: user.email });
      setAdvertiser(list[0] || null);
    } catch {
      setAdvertiser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAdvertiser(); }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#060911] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl">
            <span className="text-white font-black text-2xl">E</span>
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-white/40" />
          <p className="text-white/30 text-sm">Loading Advertiser Portal...</p>
        </div>
      </div>
    );
  }

  // Not logged in or not an advertiser → show login
  if (!advertiser && !pathname.includes('/advertiser/login')) {
    return <AdvertiserLogin onSuccess={loadAdvertiser} />;
  }

  return (
    <AdvertiserLayout advertiser={advertiser}>
      <Routes>
        <Route index element={<AdvertiserDashboard advertiser={advertiser} />} />
        <Route path="campaigns" element={<AdvertiserCampaigns advertiser={advertiser} />} />
        <Route path="wallet" element={<AdvertiserWallet advertiser={advertiser} onBalanceUpdate={loadAdvertiser} />} />
        <Route path="invoices" element={<AdvertiserInvoices advertiser={advertiser} />} />
        <Route path="*" element={<Navigate to="/advertiser" replace />} />
      </Routes>
    </AdvertiserLayout>
  );
}