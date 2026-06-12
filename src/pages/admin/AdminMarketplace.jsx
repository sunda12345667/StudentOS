import AdminMarketplacePanel from '@/components/admin/AdminMarketplacePanel';
import { ShoppingBag } from 'lucide-react';

export default function AdminMarketplace() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Marketplace Moderation</h1>
          <p className="text-white/40 text-sm">Review, edit, and manage all product listings</p>
        </div>
      </div>
      <AdminMarketplacePanel />
    </div>
  );
}