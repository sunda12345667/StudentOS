import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingBag, Search, Plus, Loader2, SlidersHorizontal, TrendingUp, Package, ShieldCheck } from 'lucide-react';
import ItemCard, { CAT_CONFIG } from '@/components/marketplace/ItemCard';
import ItemDetail from '@/components/marketplace/ItemDetail';
import CreateListing from '@/components/marketplace/CreateListing';
import MyListings from '@/components/marketplace/MyListings';
import OrderManagement from '@/components/marketplace/OrderManagement';

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
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-black">Marketplace</h1>
          </div>
          <p className="text-muted-foreground">Buy & sell textbooks, notes, tutorials and more</p>
        </div>
        <Button className="gradient-brand border-0 gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" />List Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: Package, label: 'Listings', value: stats.total, color: 'text-primary bg-primary/10' },
          { icon: TrendingUp, label: 'Digital Items', value: stats.digital, color: 'text-emerald-600 bg-emerald-50' },
          { icon: ShoppingBag, label: 'Categories', value: stats.categories, color: 'text-violet-600 bg-violet-50' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-xl leading-none">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="browse">
        <TabsList className="mb-6">
          <TabsTrigger value="browse" className="gap-1.5"><ShoppingBag className="w-4 h-4" />Browse</TabsTrigger>
          <TabsTrigger value="my-listings" className="gap-1.5"><Package className="w-4 h-4" />My Listings</TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5"><ShieldCheck className="w-4 h-4" />Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          {/* Search + Filters */}
          <div className="flex flex-col gap-3 mb-5">
            <div className="flex gap-3">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items, subjects..." className="pl-9" />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-44"><SlidersHorizontal className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
                <SelectContent>{SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Category filters */}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setCatFilter('all')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${catFilter === 'all' ? 'gradient-brand text-white border-transparent' : 'border-border hover:bg-muted text-muted-foreground'}`}>
                🔍 All
              </button>
              {Object.entries(CAT_CONFIG).map(([k, v]) => {
                const Icon = v.icon;
                return (
                  <button key={k} onClick={() => setCatFilter(catFilter === k ? 'all' : k)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${catFilter === k ? `${v.color} border-current/30` : 'border-border hover:bg-muted text-muted-foreground'}`}>
                    <Icon className="w-3.5 h-3.5" />{v.label}
                  </button>
                );
              })}
            </div>

            {/* Type filter */}
            <div className="flex gap-2">
              {[['all', 'All Types'], ['digital', '📱 Digital'], ['physical', '📦 Physical']].map(([v, l]) => (
                <button key={v} onClick={() => setTypeFilter(v)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${typeFilter === v ? 'bg-primary/10 text-primary border-primary/30' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">{available.length} item{available.length !== 1 ? 's' : ''} found</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
      </Tabs>

      {/* Modals */}
      <ItemDetail item={selectedItem} open={!!selectedItem} onClose={() => setSelectedItem(null)} currentUser={user} />
      <CreateListing open={createOpen} onClose={() => setCreateOpen(false)} user={user} onCreated={load} />
    </div>
  );
}