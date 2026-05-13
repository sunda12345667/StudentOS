import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Plus, Trash2, CalendarDays } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_COLORS = ['bg-blue-50 border-blue-200', 'bg-violet-50 border-violet-200', 'bg-green-50 border-green-200', 'bg-amber-50 border-amber-200', 'bg-rose-50 border-rose-200', 'bg-cyan-50 border-cyan-200', 'bg-gray-50 border-gray-200'];

export default function GroupTimetable({ group, user, isAdmin, onUpdate }) {
  const [timetable, setTimetable] = useState(group?.timetable || []);
  const [adding, setAdding] = useState(false);
  const [newSlot, setNewSlot] = useState({ day: 'Monday', time: '', subject: '', room: '' });
  const [saving, setSaving] = useState(false);

  const addSlot = async () => {
    if (!newSlot.time || !newSlot.subject) return;
    setSaving(true);
    const updated = [...timetable, newSlot];
    await base44.entities.CampusGroup.update(group.id, { timetable: updated });
    setTimetable(updated);
    setNewSlot({ day: 'Monday', time: '', subject: '', room: '' });
    setAdding(false); setSaving(false);
    onUpdate?.();
  };

  const removeSlot = async (idx) => {
    const updated = timetable.filter((_, i) => i !== idx);
    await base44.entities.CampusGroup.update(group.id, { timetable: updated });
    setTimetable(updated);
  };

  const grouped = DAYS.reduce((acc, day) => {
    acc[day] = timetable.filter(s => s.day === day).sort((a, b) => a.time.localeCompare(b.time));
    return acc;
  }, {});

  const activeDays = DAYS.filter(d => grouped[d].length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" />Timetable</h3>
        {isAdmin && (
          <Button size="sm" className="gradient-brand border-0 gap-1.5" onClick={() => setAdding(a => !a)}>
            <Plus className="w-4 h-4" />Add Slot
          </Button>
        )}
      </div>

      {adding && (
        <Card className="p-4 space-y-3 border-primary/20 bg-primary/5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Day</label>
              <Select value={newSlot.day} onValueChange={v => setNewSlot(p => ({ ...p, day: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Time *</label>
              <Input type="time" value={newSlot.time} onChange={e => setNewSlot(p => ({ ...p, time: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Subject *</label>
              <Input value={newSlot.subject} onChange={e => setNewSlot(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Mathematics" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Room / Location</label>
              <Input value={newSlot.room} onChange={e => setNewSlot(p => ({ ...p, room: e.target.value }))} placeholder="e.g. Room 12A" />
            </div>
          </div>
          <Button onClick={addSlot} disabled={saving || !newSlot.time || !newSlot.subject} className="w-full gradient-brand border-0">
            Add to Timetable
          </Button>
        </Card>
      )}

      {activeDays.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No timetable set up yet</p>
          {isAdmin && <p className="text-xs mt-1">Add class slots above to build the timetable</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeDays.map((day, di) => (
            <Card key={day} className={`p-3 border ${DAY_COLORS[di % DAY_COLORS.length]}`}>
              <p className="font-bold text-sm mb-2">{day}</p>
              <div className="space-y-1.5">
                {grouped[day].map((slot, si) => {
                  const globalIdx = timetable.indexOf(slot);
                  return (
                    <div key={si} className="flex items-center gap-2 group">
                      <div className="w-14 text-xs font-bold text-muted-foreground flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />{slot.time}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{slot.subject}</p>
                        {slot.room && <p className="text-[10px] text-muted-foreground truncate">{slot.room}</p>}
                      </div>
                      {isAdmin && (
                        <button onClick={() => removeSlot(globalIdx)} className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}