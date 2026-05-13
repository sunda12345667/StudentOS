import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Users, Lock, Globe, Loader2, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

const GROUP_TYPES = {
  department: { label: 'Department', icon: '🏛️', color: 'from-blue-500 to-indigo-600' },
  class: { label: 'Class Group', icon: '📚', color: 'from-green-500 to-emerald-600' },
  faculty: { label: 'Faculty', icon: '🎓', color: 'from-purple-500 to-violet-600' },
  club: { label: 'Club / Society', icon: '🎭', color: 'from-pink-500 to-rose-600' },
  study: { label: 'Study Group', icon: '📖', color: 'from-amber-500 to-orange-600' },
  campus: { label: 'Campus Community', icon: '🏫', color: 'from-cyan-500 to-blue-600' },
  general: { label: 'General', icon: '💬', color: 'from-gray-500 to-slate-600' },
};

export default function CampusGroups() {
  const { user } = useOutletContext();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterScope, setFilterScope] = useState('all');
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', type: 'class', is_private: false });

  useEffect(() => {
    base44.entities.CampusGroup.list('-created_date', 100)
      .then(setGroups).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    await base44.entities.CampusGroup.create({
      ...form,
      admin_email: user.email,
      member_emails: [user.email],
      member_count: 1,
      cover_color: GROUP_TYPES[form.type]?.color || 'from-blue-500 to-indigo-600',
      icon: GROUP_TYPES[form.type]?.icon || '💬',
      timetable: [],
    });
    const updated = await base44.entities.CampusGroup.list('-created_date', 100);
    setGroups(updated);
    setOpen(false);
    setForm({ name: '', description: '', type: 'class', is_private: false });
    setCreating(false);
  };

  const handleJoin = async (group) => {
    if (group.member_emails?.includes(user.email)) return;
    const members = [...(group.member_emails || []), user.email];
    await base44.entities.CampusGroup.update(group.id, { member_emails: members, member_count: members.length });
    setGroups(prev => prev.map(g => g.id === group.id ? { ...g, member_emails: members, member_count: members.length } : g));
  };

  const filtered = groups.filter(g => {
    const matchSearch = g.name?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || g.type === filterType;
    const matchScope = filterScope === 'all' || (filterScope === 'mine' && g.member_emails?.includes(user?.email));
    return matchSearch && matchType && matchScope;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-black">Digital Campus</h1>
          </div>
          <p className="text-muted-foreground">Your groups, classes, clubs and campus communities</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand border-0 gap-2"><Plus className="w-4 h-4" />Create Group</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create a New Group</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label>Group Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Computer Science Year 2" /></div>
              <div><Label>Group Type</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(GROUP_TYPES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="What is this group about?" /></div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="private" checked={form.is_private} onChange={e => setForm(p => ({ ...p, is_private: e.target.checked }))} className="w-4 h-4" />
                <label htmlFor="private" className="text-sm">Private group (invite only)</label>
              </div>
              <Button onClick={handleCreate} disabled={creating || !form.name.trim()} className="w-full gradient-brand border-0">
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Create Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search groups..." className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'mine'].map(s => (
            <Button key={s} size="sm" variant={filterScope === s ? 'default' : 'outline'}
              className={filterScope === s ? 'gradient-brand border-0' : ''}
              onClick={() => setFilterScope(s)}>
              {s === 'all' ? 'All Groups' : 'My Groups'}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {[['all', '🔍 All'], ...Object.entries(GROUP_TYPES).map(([k, v]) => [k, v.icon + ' ' + v.label.split(' ')[0]])].map(([k, label]) => (
            <Button key={k} size="sm" variant={filterType === k ? 'secondary' : 'ghost'}
              className={`text-xs h-8 ${filterType === k ? 'bg-primary/10 text-primary font-semibold' : ''}`}
              onClick={() => setFilterType(k)}>
              {label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((group, i) => {
            const isMember = group.member_emails?.includes(user?.email);
            const isAdmin = group.admin_email === user?.email;
            const typeInfo = GROUP_TYPES[group.type] || GROUP_TYPES.general;
            return (
              <motion.div key={group.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="overflow-hidden hover:shadow-lg transition-all group cursor-pointer">
                  <div className={`h-24 bg-gradient-to-br ${group.cover_color || typeInfo.color} flex items-center justify-center relative`}>
                    <span className="text-5xl">{group.icon || typeInfo.icon}</span>
                    <div className="absolute top-2 right-2 flex gap-1">
                      {group.is_private && <div className="w-6 h-6 rounded-full bg-black/30 flex items-center justify-center"><Lock className="w-3 h-3 text-white" /></div>}
                      {isAdmin && <Badge className="bg-white/30 text-white border-0 text-[10px]">Admin</Badge>}
                    </div>
                    <div className="absolute bottom-2 left-3">
                      <Badge className="bg-white/20 text-white border-0 text-[10px]">{typeInfo.label}</Badge>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm leading-tight truncate">{group.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{group.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />{group.member_count || 0}
                      </div>
                      {isMember || isAdmin ? (
                        <Link to={`/campus/${group.id}`}>
                          <Button size="sm" variant="secondary" className="h-7 text-xs">Enter</Button>
                        </Link>
                      ) : (
                        <Button size="sm" className="h-7 text-xs gradient-brand border-0" onClick={() => handleJoin(group)}>Join</Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
          {filtered.length === 0 && !loading && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No groups found</p>
              <p className="text-sm mt-1">Create a new group or adjust your filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}