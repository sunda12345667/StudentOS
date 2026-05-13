import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Computer Science', 'Economics', 'Other'];

export default function ExamForm({ onSave, onClose, userEmail }) {
  const [form, setForm] = useState({
    subject: '', title: '', exam_date: '', exam_time: '',
    location: '', notes: '', priority: 'medium',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.subject || !form.exam_date) return;
    onSave({ ...form, user_email: userEmail });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold mb-5">Add Exam Date</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Subject *</Label>
              <Select value={form.subject} onValueChange={v => set('subject', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Priority</Label>
              <Select value={form.priority} onValueChange={v => set('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Exam Title</Label>
            <Input placeholder="e.g. Midterm Exam" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Date *</Label>
              <Input type="date" value={form.exam_date} onChange={e => set('exam_date', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Time</Label>
              <Input type="time" value={form.exam_time} onChange={e => set('exam_time', e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Location</Label>
            <Input placeholder="e.g. Hall A, Room 204" value={form.location} onChange={e => set('location', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSave} disabled={!form.subject || !form.exam_date}>Save Exam</Button>
        </div>
      </div>
    </div>
  );
}