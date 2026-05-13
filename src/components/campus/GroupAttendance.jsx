import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClipboardCheck, Plus, CheckCircle2, XCircle, Clock, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  present: { label: 'Present', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  absent: { label: 'Absent', color: 'bg-red-100 text-red-700', icon: XCircle },
  late: { label: 'Late', color: 'bg-amber-100 text-amber-700', icon: Clock },
  excused: { label: 'Excused', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
};

export default function GroupAttendance({ groupId, user, isAdmin, members }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sessionLabel, setSessionLabel] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    base44.entities.Attendance.filter({ group_id: groupId }, '-created_date', 30)
      .then(setSessions).finally(() => setLoading(false));
  }, [groupId]);

  const openNew = () => {
    setRecords((members || []).map(email => ({ email, name: email.split('@')[0], status: 'present' })));
    setOpen(true);
  };

  const saveSession = async () => {
    if (!sessionLabel || records.length === 0) return;
    setSaving(true);
    await base44.entities.Attendance.create({
      group_id: groupId, session_label: sessionLabel,
      session_date: sessionDate, marked_by: user.email, records,
    });
    const updated = await base44.entities.Attendance.filter({ group_id: groupId }, '-created_date', 30);
    setSessions(updated);
    setOpen(false); setSessionLabel(''); setSaving(false);
  };

  const updateRecord = (email, status) => {
    setRecords(prev => prev.map(r => r.email === email ? { ...r, status } : r));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-primary" />Attendance</h3>
        {isAdmin && (
          <Button size="sm" className="gradient-brand border-0 gap-1.5" onClick={openNew}>
            <Plus className="w-4 h-4" />Mark Attendance
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No attendance records yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => {
            const total = session.records?.length || 0;
            const present = session.records?.filter(r => r.status === 'present').length || 0;
            const pct = total > 0 ? Math.round(present / total * 100) : 0;
            const isExpanded = expanded === session.id;
            return (
              <Card key={session.id} className="overflow-hidden">
                <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : session.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <ClipboardCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">{session.session_label}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(session.session_date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold">{present}/{total}</p>
                      <p className="text-[10px] text-muted-foreground">{pct}% present</p>
                    </div>
                    <div className="w-12 h-2 bg-muted rounded-full overflow-hidden hidden sm:block">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-border p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(session.records || []).map(r => {
                      const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.present;
                      const Icon = cfg.icon;
                      return (
                        <div key={r.email} className="flex items-center gap-2 py-1">
                          <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.color.replace('bg-', 'text-').replace('-100', '-600')}`} />
                          <span className="text-sm flex-1 truncate">{r.name || r.email}</span>
                          <Badge className={`${cfg.color} border-0 text-[10px]`}>{cfg.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Mark Attendance</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Session Label *</Label><Input value={sessionLabel} onChange={e => setSessionLabel(e.target.value)} placeholder="e.g. Week 3 - Monday" /></div>
              <div><Label>Date *</Label><Input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} /></div>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {records.map(r => (
                <div key={r.email} className="flex items-center gap-2">
                  <span className="flex-1 text-sm truncate">{r.name || r.email}</span>
                  <div className="flex gap-1">
                    {['present', 'absent', 'late', 'excused'].map(s => (
                      <button key={s} onClick={() => updateRecord(r.email, s)}
                        className={`text-[10px] px-2 py-1 rounded-full border transition-colors font-medium ${r.status === s ? STATUS_CONFIG[s].color + ' border-transparent' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={saveSession} disabled={saving || !sessionLabel} className="w-full gradient-brand border-0">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Save Attendance
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}