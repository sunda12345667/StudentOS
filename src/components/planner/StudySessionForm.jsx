import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Computer Science', 'Economics', 'Other'];

export default function StudySessionForm({ onSave, onClose, userEmail }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    title: '', subject: '', date: today,
    start_time: '09:00', end_time: '10:00',
    duration_minutes: 60, notes: '', color: '#6366f1',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.title || !form.date) return;
    onSave({ ...form, user_email: userEmail, status: 'planned' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold mb-5">Add Study Session</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Session Title *</Label>
            <Input placeholder="e.g. Chapter 5 Revision" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Subject</Label>
              <Select value={form.subject} onValueChange={v => set('subject', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Date *</Label>
              <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Start Time</Label>
              <Input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">End Time</Label>
              <Input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Color</Label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => set('color', c)}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{ background: c, borderColor: form.color === c ? '#fff' : 'transparent', boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none' }}
                />
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Notes</Label>
            <Input placeholder="Optional notes..." value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSave} disabled={!form.title || !form.date}>Save Session</Button>
        </div>
      </div>
    </div>
  );
}