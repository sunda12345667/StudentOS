import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, School, Users, CheckCircle, Globe, MapPin, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const TYPE_LABELS = { k12: 'K-12', university: 'University', vocational: 'Vocational', online: 'Online', tutoring: 'Tutoring' };
const TYPE_COLORS = { k12: 'bg-blue-100 text-blue-700', university: 'bg-purple-100 text-purple-700', vocational: 'bg-amber-100 text-amber-700', online: 'bg-green-100 text-green-700', tutoring: 'bg-rose-100 text-rose-700' };

export default function Schools() {
  const { user } = useOutletContext();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', type: 'k12', address: '', website: '' });

  useEffect(() => {
    base44.entities.School.list('-created_date', 50)
      .then(setSchools).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    await base44.entities.School.create({
      ...form, admin_email: user.email,
      member_emails: [user.email], student_count: 0, verified: false,
    });
    const updated = await base44.entities.School.list('-created_date', 50);
    setSchools(updated);
    setOpen(false);
    setForm({ name: '', description: '', type: 'k12', address: '', website: '' });
    setCreating(false);
  };

  const handleJoin = async (school) => {
    if (school.member_emails?.includes(user.email)) return;
    const newMembers = [...(school.member_emails || []), user.email];
    await base44.entities.School.update(school.id, { member_emails: newMembers, student_count: newMembers.length });
    setSchools(prev => prev.map(s => s.id === school.id ? { ...s, member_emails: newMembers, student_count: newMembers.length } : s));
  };

  const filtered = schools.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black">Schools</h1>
          <p className="text-muted-foreground mt-1">Discover and join educational institutions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand border-0 gap-2"><Plus className="w-4 h-4" />Create School</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create a New School</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label>School Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Riverside Academy" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Tell students about your school..." rows={3} /></div>
              <div><Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="City, Country" /></div>
              <div><Label>Website</Label><Input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." /></div>
              <Button onClick={handleCreate} disabled={creating || !form.name.trim()} className="w-full gradient-brand border-0">
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Create School
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search schools..." className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((school, i) => {
            const isMember = school.member_emails?.includes(user?.email);
            const isAdmin = school.admin_email === user?.email;
            return (
              <motion.div key={school.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="overflow-hidden hover:shadow-lg transition-all group">
                  <div className="h-28 relative overflow-hidden">
                    {school.cover_url ? (
                      <img src={school.cover_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full gradient-brand opacity-80 flex items-center justify-center">
                        <School className="w-10 h-10 text-white/60" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Badge className={`text-[10px] ${TYPE_COLORS[school.type] || ''}`}>{TYPE_LABELS[school.type] || school.type}</Badge>
                      {school.verified && <Badge className="bg-blue-500 text-white text-[10px]"><CheckCircle className="w-2.5 h-2.5" /></Badge>}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold truncate">{school.name}</h3>
                    {school.address && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="w-3 h-3" />{school.address}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{school.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />{school.student_count || 0} members
                      </div>
                      {isMember || isAdmin ? (
                        <Link to={`/schools/${school.id}`}>
                          <Button size="sm" variant="secondary" className="h-7 text-xs">View</Button>
                        </Link>
                      ) : (
                        <Button size="sm" className="h-7 text-xs gradient-brand border-0" onClick={() => handleJoin(school)}>Join</Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <School className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No schools found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}