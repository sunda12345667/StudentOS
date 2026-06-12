import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Edit2, Trash2, Ban, CheckCircle, Loader2, Package, ShoppingBag, AlertTriangle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const STATUS_COLORS = {
  available: 'bg-emerald-500/20 text-emerald-300',
  sold: 'bg-blue-500/20 text-blue-300',
  reserved: 'bg-amber-500/20 text-amber-300',
  suspended: 'bg-red-500/20 text-red-300',
};

const CAT_LABELS = {
  textbook: 'Textbook', notes: 'Notes', past_questions: 'Past Questions',
  materials: 'Materials', gadgets: 'Gadgets', handouts: 'Handouts',
  course: 'Course', tutorial: 'Tutorial',
};

export default function AdminMarketplacePanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(null);

  const load = async () => {
    setLoading(true);
    const all = await base44.entities.MarketItem.list('-created_date', 200);
    setItems(all);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEdit = (item) => {
    setEditItem(item);
    setEditForm({
      title: item.title,
      description: item.description || '',
      price: item.price,
      category: item.category,
      status: item.status,
      subject: item.subject || '',
      grade_level: item.grade_level || '',
    });
  };

  const saveEdit = async () => {
    if (!editItem) return;
    setSaving(true);
    await base44.entities.MarketItem.update(editItem.id, {
      ...editForm, price: Number(editForm.price),
    });
    setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, ...editForm, price: Number(editForm.price) } : i));
    toast.success('Listing updated');
    setEditItem(null);
    setSaving(false);
  };

  const setStatus = async (item, status) => {
    setActing(item.id);
    await base44.entities.MarketItem.update(item.id, { status });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status } : i));
    toast.success(`Item marked as ${status}`);
    setActing(null);
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    setActing(item.id);
    await base44.entities.MarketItem.delete(item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
    toast.success('Item deleted');
    setActing(null);
  };

  const filtered = items.filter(item => {
    const matchSearch = !search || item.title?.toLowerCase().includes(search.toLowerCase()) || item.seller_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: items.length,
    available: items.filter(i => i.status === 'available').length,
    sold: items.filter(i => i.status === 'sold').length,
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Listings', value: stats.total, color: 'text-white' },
          { label: 'Available', value: stats.available, color: 'text-emerald-400' },
          { label: 'Sold', value: stats.sold, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-white/40 mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or seller..."
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'available', 'sold', 'reserved'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${statusFilter === s ? 'bg-primary text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-white/40" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-white/30">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No listings found</p>
            </div>
          ) : filtered.map(item => (
            <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/8 p-4 hover:bg-white/8 transition-colors">
              {item.image_url ? (
                <img src={item.image_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-white/30" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-semibold text-sm truncate">{item.title}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status] || STATUS_COLORS.available}`}>
                    {item.status}
                  </span>
                  <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                    {CAT_LABELS[item.category] || item.category}
                  </span>
                </div>
                <p className="text-xs text-white/40 mt-0.5">
                  by {item.seller_name || item.seller_email} · ₦{item.price?.toLocaleString()} · {item.views || 0} views
                  {item.created_date && ` · ${formatDistanceToNow(new Date(item.created_date), { addSuffix: true })}`}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Button size="sm" variant="ghost"
                  className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                  onClick={() => openEdit(item)} title="Edit">
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                {item.status === 'available' && (
                  <Button size="sm" variant="ghost"
                    className="h-8 w-8 p-0 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                    disabled={acting === item.id}
                    onClick={() => setStatus(item, 'reserved')} title="Suspend">
                    <Ban className="w-3.5 h-3.5" />
                  </Button>
                )}
                {item.status === 'reserved' && (
                  <Button size="sm" variant="ghost"
                    className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                    disabled={acting === item.id}
                    onClick={() => setStatus(item, 'available')} title="Restore">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button size="sm" variant="ghost"
                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  disabled={acting === item.id}
                  onClick={() => deleteItem(item)} title="Delete">
                  {acting === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-primary" />Edit Listing
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Title</Label>
              <Input value={editForm.title || ''} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div><Label>Description</Label>
              <Textarea value={editForm.description || ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Price (₦)</Label>
                <Input type="number" value={editForm.price || ''} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))} /></div>
              <div><Label>Status</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="reserved">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Subject</Label>
                <Input value={editForm.subject || ''} onChange={e => setEditForm(p => ({ ...p, subject: e.target.value }))} /></div>
              <div><Label>Grade / Level</Label>
                <Input value={editForm.grade_level || ''} onChange={e => setEditForm(p => ({ ...p, grade_level: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveEdit} disabled={saving} className="flex-1 gradient-brand border-0">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}