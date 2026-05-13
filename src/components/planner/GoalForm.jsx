import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

const CATEGORIES = ['study', 'reading', 'practice', 'revision', 'exercise', 'other'];

export default function GoalForm({ onSave, onClose, userEmail }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    title: '', date: today, target_value: 1, unit: 'tasks', category: 'study',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.title) return;
    onSave({ ...form, user_email: userEmail, current_value: 0, completed: false });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold mb-5">Add Daily Goal</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Goal Title *</Label>
            <Input placeholder="e.g. Complete 3 practice problems" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Category</Label>
              <Select value={form.category} onValueChange={v => set('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Date</Label>
              <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Target</Label>
              <Input type="number" min="1" value={form.target_value} onChange={e => set('target_value', Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Unit</Label>
              <Input placeholder="e.g. pages, hours, tasks" value={form.unit} onChange={e => set('unit', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSave} disabled={!form.title}>Save Goal</Button>
        </div>
      </div>
    </div>
  );
}