import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Search, Lock, Globe, Loader2, TrendingUp, Sparkles, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const CAT_ICONS = { subject: '📚', club: '🎭', sports: '⚽', arts: '🎨', science: '🔬', technology: '💻', language: '🌍', general: '💬' };
const CAT_COLORS = { subject: 'from-blue-500 to-indigo-600', club: 'from-purple-500 to-pink-600', sports: 'from-green-500 to-emerald-600', arts: 'from-pink-500 to-rose-600', science: 'from-cyan-500 to-blue-600', technology: 'from-violet-500 to-purple-600', language: 'from-amber-500 to-orange-600', general: 'from-gray-500 to-slate-600' };

export default function Communities() {
  const { user } = useOutletContext();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: 'general', is_private: false });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    base44.entities.Community.list('-created_date', 50).then(setCommunities).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.name) return;
    setCreating(true);
    await base44.entities.Community.create({
      ...form, admin_email: user.email,
      member_emails: [user.email], member_count: 1,
      color: CAT_COLORS[form.category] || 'from-blue-500 to-indigo-600',
    });
    const updated = await base44.entities.Community.list('-created_date', 50);
    setCommunities(updated);
    setOpen(false);
    setForm({ name: '', description: '', category: 'general', is_private: false });
    setCreating(false);
  };

  const handleJoin = async (community) => {
    const members = [...(community.member_emails || []), user.email];
    await base44.entities.Community.update(community.id, { member_emails: members, member_count: members.length });
    setCommunities(prev => prev.map(c => c.id === community.id ? { ...c, member_emails: members, member_count: members.length } : c));
  };

  const filtered = communities.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) &&
    (filter === 'all' || c.category === filter || (filter === 'mine' && c.member_emails?.includes(user?.email)))
  );

  const joinedCount = communities.filter(c => c.member_emails?.includes(user?.email)).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Discovery Hero */}
      <div className="relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-br from-primary via-accent to-purple-700 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="text-white/70 text-sm font-semibold uppercase tracking-widest">Discover</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black leading-tight">Find Your Community</h1>
            <p className="text-white/70 mt-2 text-sm max-w-md">Join groups, share knowledge, and connect with students who share your interests.</p>
            <div className="flex items-center gap-6 mt-4">
              <div className="text-center">
                <p className="text-2xl font-black">{communities.length}</p>
                <p className="text-white/60 text-xs">Communities</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black">{communities.reduce((s, c) => s + (c.member_count || 0), 0).toLocaleString()}</p>
                <p className="text-white/60 text-xs">Members</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black">{joinedCount}</p>
                <p className="text-white/60 text-xs">Joined</p>
              </div>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-white text-primary hover:bg-white/90 border-0 gap-2 font-semibold shadow-lg"><Plus className="w-4 h-4" />Create Community</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create a Community</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Physics Enthusiasts" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CAT_ICONS).map(([k, icon]) => (
                      <SelectItem key={k} value={k}>{icon} {k.charAt(0).toUpperCase() + k.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={creating || !form.name} className="w-full gradient-brand border-0">
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search communities..." className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'mine', 'subject', 'technology', 'science', 'arts'].map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className={filter === f ? 'gradient-brand border-0' : ''}>
              {f === 'mine' ? 'My Communities' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c, i) => {
            const isMember = c.member_emails?.includes(user?.email);
            const colorClass = c.color || 'from-blue-500 to-indigo-600';
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="overflow-hidden hover:shadow-lg transition-all group">
                  <div className={`h-20 bg-gradient-to-br ${colorClass} flex items-center justify-center relative`}>
                    <span className="text-5xl">{CAT_ICONS[c.category] || '💬'}</span>
                    {c.is_private && (
                      <div className="absolute top-2 right-2"><Lock className="w-4 h-4 text-white/70" /></div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold leading-tight">{c.name}</h3>
                      <Badge variant="secondary" className="text-[10px] flex-shrink-0">{c.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{c.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />{c.member_count || 0} members
                      </div>
                      {isMember ? (
                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                            <UserCheck className="w-3.5 h-3.5" />Joined
                          </span>
                          <Link to={`/communities/${c.id}`}>
                            <Button size="sm" variant="secondary" className="h-7 text-xs">View</Button>
                          </Link>
                        </div>
                      ) : (
                        <Button size="sm" className="h-7 text-xs gradient-brand border-0" onClick={() => handleJoin(c)}>
                          <Plus className="w-3 h-3 mr-1" />Join
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No communities found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}