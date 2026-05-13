import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShoppingBag, Search, Plus, Tag, Star, Package, BookOpen, Monitor, Loader2, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const CAT_ICONS = { textbook: BookOpen, course: Monitor, notes: Package, tutoring: Star, equipment: Package, digital: Monitor, other: Tag };
const CAT_COLORS = { textbook: 'bg-blue-100 text-blue-700', course: 'bg-purple-100 text-purple-700', notes: 'bg-green-100 text-green-700', tutoring: 'bg-amber-100 text-amber-700', equipment: 'bg-rose-100 text-rose-700', digital: 'bg-cyan-100 text-cyan-700', other: 'bg-gray-100 text-gray-700' };
const COND_COLORS = { new: 'bg-green-100 text-green-700', like_new: 'bg-emerald-100 text-emerald-700', good: 'bg-blue-100 text-blue-700', fair: 'bg-amber-100 text-amber-700' };

export default function Marketplace() {
  const { user } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', price: '', category: 'textbook', condition: 'good', subject: '', grade_level: '', is_digital: false });

  useEffect(() => {
    base44.entities.MarketItem.filter({ status: 'available' }, '-created_date', 50)
      .then(setItems).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.price) return;
    setCreating(true);
    let image_url = '';
    if (imageFile) {
      const r = await base44.integrations.Core.UploadFile({ file: imageFile });
      image_url = r.file_url;
    }
    await base44.entities.MarketItem.create({
      ...form, price: Number(form.price), image_url,
      seller_email: user.email, seller_name: user.full_name,
      seller_avatar: user.avatar_url || '', status: 'available', views: 0,
    });
    const updated = await base44.entities.MarketItem.filter({ status: 'available' }, '-created_date', 50);
    setItems(updated);
    setOpen(false);
    setForm({ title: '', description: '', price: '', category: 'textbook', condition: 'good', subject: '', grade_level: '', is_digital: false });
    setImageFile(null);
    setCreating(false);
  };

  const filtered = items.filter(i =>
    (catFilter === 'all' || i.category === catFilter) &&
    (i.title?.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black">Marketplace</h1>
          <p className="text-muted-foreground mt-1">Buy and sell educational resources</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand border-0 gap-2"><Plus className="w-4 h-4" />List Item</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>List an Item</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2 max-h-[70vh] overflow-y-auto pr-1">
              <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Calculus Textbook" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Price ($) *</Label><Input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" /></div>
                <div><Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.keys(CAT_ICONS).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Condition</Label>
                  <Select value={form.condition} onValueChange={v => setForm(p => ({ ...p, condition: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{['new', 'like_new', 'good', 'fair'].map(k => <SelectItem key={k} value={k}>{k.replace('_', ' ')}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Subject</Label><Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Math" /></div>
              </div>
              <div>
                <Label>Photo</Label>
                <input type="file" accept="image/*" className="mt-1 block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-primary/10 file:text-primary"
                  onChange={e => setImageFile(e.target.files[0])} />
              </div>
              <Button onClick={handleCreate} disabled={creating || !form.title || !form.price} className="w-full gradient-brand border-0">
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}List Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'textbook', 'course', 'notes', 'tutoring', 'digital'].map(c => (
            <Button key={c} size="sm" variant={catFilter === c ? 'default' : 'outline'} onClick={() => setCatFilter(c)} className={catFilter === c ? 'gradient-brand border-0' : ''}>
              {c === 'all' ? 'All' : c}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item, i) => {
            const si = item.seller_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
            const CatIcon = CAT_ICONS[item.category] || Tag;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                <Card className="overflow-hidden hover:shadow-lg transition-all group">
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center gradient-brand opacity-10">
                        <CatIcon className="w-12 h-12 text-primary" />
                      </div>
                    )}
                    <Badge className={`absolute top-2 left-2 text-[10px] ${COND_COLORS[item.condition] || ''}`}>
                      {item.condition?.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Badge className={`text-[10px] ${CAT_COLORS[item.category] || ''}`}>{item.category}</Badge>
                    </div>
                    <h3 className="font-semibold text-sm line-clamp-2 leading-tight">{item.title}</h3>
                    {item.subject && <p className="text-xs text-muted-foreground mt-0.5">{item.subject}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="h-5 w-5"><AvatarImage src={item.seller_avatar} /><AvatarFallback className="gradient-brand text-white text-[9px]">{si}</AvatarFallback></Avatar>
                      <span className="text-xs text-muted-foreground truncate">{item.seller_name}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-black text-primary">${item.price}</span>
                      <Button size="sm" className="h-7 text-xs gradient-brand border-0">
                        {item.is_digital ? 'Buy' : 'Contact'}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No items found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}