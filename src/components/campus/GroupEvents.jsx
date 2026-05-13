import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Plus, MapPin, Clock, Users, CheckCheck, Loader2 } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { motion } from 'framer-motion';

const EVENT_COLORS = { class: 'bg-blue-100 text-blue-700', exam: 'bg-red-100 text-red-700', meeting: 'bg-purple-100 text-purple-700', trip: 'bg-green-100 text-green-700', social: 'bg-pink-100 text-pink-700', deadline: 'bg-orange-100 text-orange-700', other: 'bg-gray-100 text-gray-700' };
const EVENT_ICONS = { class: '📚', exam: '📝', meeting: '💬', trip: '🚌', social: '🎉', deadline: '⏰', other: '📌' };

export default function GroupEvents({ groupId, user, isAdmin }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', event_date: '', end_date: '', location: '', event_type: 'other' });

  useEffect(() => {
    base44.entities.GroupEvent.filter({ group_id: groupId }, 'event_date', 50)
      .then(setEvents).finally(() => setLoading(false));
  }, [groupId]);

  const createEvent = async () => {
    if (!form.title || !form.event_date) return;
    setSaving(true);
    await base44.entities.GroupEvent.create({
      ...form, group_id: groupId,
      created_by: user.email, creator_name: user.full_name, rsvp_emails: [],
    });
    const updated = await base44.entities.GroupEvent.filter({ group_id: groupId }, 'event_date', 50);
    setEvents(updated);
    setOpen(false);
    setForm({ title: '', description: '', event_date: '', end_date: '', location: '', event_type: 'other' });
    setSaving(false);
  };

  const toggleRSVP = async (event) => {
    const rsvps = event.rsvp_emails || [];
    const attending = rsvps.includes(user.email);
    const newRsvps = attending ? rsvps.filter(e => e !== user.email) : [...rsvps, user.email];
    await base44.entities.GroupEvent.update(event.id, { rsvp_emails: newRsvps });
    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, rsvp_emails: newRsvps } : e));
  };

  const upcoming = events.filter(e => !isPast(new Date(e.event_date)));
  const past = events.filter(e => isPast(new Date(e.event_date)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />Events</h3>
        {isAdmin && (
          <Button size="sm" className="gradient-brand border-0 gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" />Add Event
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No events scheduled</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Upcoming</p>
              {upcoming.map((event, i) => <EventCard key={event.id} event={event} user={user} onRSVP={toggleRSVP} i={i} />)}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Past</p>
              {past.slice(0, 3).map((event, i) => <EventCard key={event.id} event={event} user={user} onRSVP={toggleRSVP} i={i} past />)}
            </div>
          )}
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Final Exam Review" /></div>
            <div><Label>Type</Label>
              <Select value={form.event_type} onValueChange={v => setForm(p => ({ ...p, event_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['class','exam','meeting','trip','social','deadline','other'].map(t => <SelectItem key={t} value={t}>{EVENT_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start *</Label><Input type="datetime-local" value={form.event_date} onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))} /></div>
              <div><Label>End</Label><Input type="datetime-local" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} /></div>
            </div>
            <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Room / Online link" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
            <Button onClick={createEvent} disabled={saving || !form.title || !form.event_date} className="w-full gradient-brand border-0">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Create Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EventCard({ event, user, onRSVP, i, past }) {
  const attending = event.rsvp_emails?.includes(user?.email);
  const colors = EVENT_COLORS[event.event_type] || EVENT_COLORS.other;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
      <Card className={`p-4 flex gap-3 ${past ? 'opacity-60' : 'hover:shadow-md'} transition-all`}>
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">
          {EVENT_ICONS[event.event_type] || '📌'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm">{event.title}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(event.event_date), 'MMM d, h:mm a')}</span>
                {event.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>}
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.rsvp_emails?.length || 0} going</span>
              </div>
              {event.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>}
            </div>
            <Badge className={`${colors} border-0 text-[10px] flex-shrink-0`}>{event.event_type}</Badge>
          </div>
          {!past && (
            <Button size="sm" variant={attending ? 'secondary' : 'default'}
              className={`mt-2 h-7 text-xs gap-1.5 ${!attending ? 'gradient-brand border-0' : ''}`}
              onClick={() => onRSVP(event)}>
              {attending ? <><CheckCheck className="w-3.5 h-3.5" />Going</> : 'RSVP'}
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}