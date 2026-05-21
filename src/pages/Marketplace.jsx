import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingBag, Search, Plus, Loader2, SlidersHorizontal, TrendingUp, Package, ShieldCheck, BarChart2, Wallet } from 'lucide-react';
import ItemCard, { CAT_CONFIG } from '@/components/marketplace/ItemCard';
import ItemDetail from '@/components/marketplace/ItemDetail';
import CreateListing from '@/components/marketplace/CreateListing';
import MyListings from '@/components/marketplace/MyListings';
import OrderManagement from '@/components/marketplace/OrderManagement';
import SellerAnalytics from '@/components/marketplace/SellerAnalytics';
import WalletDashboard from '@/components/marketplace/WalletDashboard';

const SORT_OPTIONS = [
  { value: '-created_date', label: 'Newest First' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: '-views', label: 'Most Viewed' },
];

export default function Marketplace() {
  const { user } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // all | digital | physical
  const [sortBy, setSortBy] = useState('-created_date');
  const [selectedItem, setSelectedItem] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = () => {
    setLoading(true);
    base44.entities.MarketItem.list(sortBy, 100)
      .then(setItems).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [sortBy]);

  const openItem = async (item) => {
    setSelectedItem(item);
    if (item.seller_email !== user?.email) {
      await base44.entities.MarketItem.update(item.id, { views: (item.views || 0) + 1 }).catch(() => {});
    }
  };

  const filtered = items.filter(item => {
    const matchSearch = !search || item.title?.toLowerCase().includes(search.toLowerCase()) || item.description?.toLowerCase().includes(search.toLowerCase()) || item.subject?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || item.category === catFilter;
    const matchType = typeFilter === 'all' || (typeFilter === 'digital' ? item.is_digital : !item.is_digital);
    return matchSearch && matchCat && matchType;
  });

  const available = filtered.filter(i => i.status === 'available');
  const stats = {
    total: items.filter(i => i.status === 'available').length,
    digital: items.filter(i => i.is_digital && i.status === 'available').length,
    categories: [...new Set(items.map(i => i.category))].length,
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <ShoppingBag className="w-6 h-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-black">Marketplace</h1>
          </div>
          <p className="text-muted-foreground text-sm hidden sm:block">Buy & sell textbooks, notes, tutorials and more</p>
        </div>
        <Button className="gradient-brand border-0 gap-2 h-9 text-sm flex-shrink-0" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">List Item</span>
          <span className="sm:hidden">Sell</span>
        </Button>
      </div>

      {/* Stats — compact on mobile */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
        {[
          { icon: Package, label: 'Listings', value: stats.total, color: 'text-primary bg-primary/10' },
          { icon: TrendingUp, label: 'Digital', value: stats.digital, color: 'text-emerald-600 bg-emerald-50' },
          { icon: ShoppingBag, label: 'Categories', value: stats.categories, color: 'text-violet-600 bg-violet-50' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="font-black text-lg sm:text-xl leading-none">{s.value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="browse">
        {/* Horizontal scroll tabs on mobile */}
        <div className="overflow-x-auto pb-1 mb-4 sm:mb-6 -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide">
          <TabsList className="w-max min-w-full">
            <TabsTrigger value="browse" className="gap-1 sm:gap-1.5 text-xs sm:text-sm"><ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Browse</TabsTrigger>
            <TabsTrigger value="my-listings" className="gap-1 sm:gap-1.5 text-xs sm:text-sm"><Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />My Items</TabsTrigger>
            <TabsTrigger value="orders" className="gap-1 sm:gap-1.5 text-xs sm:text-sm"><ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Orders</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1 sm:gap-1.5 text-xs sm:text-sm"><BarChart2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Analytics</TabsTrigger>
            <TabsTrigger value="wallet" className="gap-1 sm:gap-1.5 text-xs sm:text-sm"><Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Wallet</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="browse">
          {/* Search bar — sticky feel on mobile */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items, subjects..." className="pl-9 h-10" />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-10 sm:w-44 flex-shrink-0 px-2 sm:px-3">
                <SlidersHorizontal className="w-4 h-4 sm:mr-2" />
                <SelectValue className="hidden sm:block" />
              </SelectTrigger>
              <SelectContent>{SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Category filters — horizontal scroll on mobile */}
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide mb-3">
            <div className="flex gap-2 pb-1 w-max sm:w-auto sm:flex-wrap">
              <button onClick={() => setCatFilter('all')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all whitespace-nowrap ${catFilter === 'all' ? 'gradient-brand text-white border-transparent' : 'border-border hover:bg-muted text-muted-foreground'}`}>
                🔍 All
              </button>
              {Object.entries(CAT_CONFIG).map(([k, v]) => {
                const Icon = v.icon;
                return (
                  <button key={k} onClick={() => setCatFilter(catFilter === k ? 'all' : k)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all whitespace-nowrap ${catFilter === k ? `${v.color} border-current/30` : 'border-border hover:bg-muted text-muted-foreground'}`}>
                    <Icon className="w-3.5 h-3.5" />{v.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Type filter */}
          <div className="flex gap-2 mb-4">
            {[['all', 'All'], ['digital', '📱 Digital'], ['physical', '📦 Physical']].map(([v, l]) => (
              <button key={v} onClick={() => setTypeFilter(v)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${typeFilter === v ? 'bg-primary/10 text-primary border-primary/30' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                {l}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3">{available.length} item{available.length !== 1 ? 's' : ''} found</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
                {available.map((item, i) => (
                  <ItemCard key={item.id} item={item} index={i} onClick={() => openItem(item)} />
                ))}
                {available.length === 0 && (
                  <div className="col-span-full text-center py-16 text-muted-foreground">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No items found</p>
                    <p className="text-sm mt-1">Try different filters or be the first to list!</p>
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="my-listings">
          <MyListings user={user} />
        </TabsContent>

        <TabsContent value="orders">
          <OrderManagement user={user} />
        </TabsContent>

        <TabsContent value="analytics">
          <SellerAnalytics user={user} />
        </TabsContent>

        <TabsContent value="wallet">
          <WalletDashboard user={user} />
        </TabsContent>
      </Tabs>

      {/* Floating sell button on mobile */}
      <button
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-24 right-4 z-40 md:hidden w-14 h-14 gradient-brand rounded-full shadow-2xl flex items-center justify-center text-white"
        style={{ boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      <ItemDetail item={selectedItem} open={!!selectedItem} onClose={() => setSelectedItem(null)} currentUser={user} />
      <CreateListing open={createOpen} onClose={() => setCreateOpen(false)} user={user} onCreated={load} />
    </div>
  );
}