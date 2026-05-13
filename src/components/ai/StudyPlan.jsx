import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Target, Calendar, Clock, CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const DURATIONS = ['1 week', '2 weeks', '1 month', '3 months'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const HOURS = ['1 hour/day', '2 hours/day', '3 hours/day', '4+ hours/day'];

const DAY_COLORS = ['bg-blue-50 border-blue-200', 'bg-violet-50 border-violet-200', 'bg-green-50 border-green-200', 'bg-amber-50 border-amber-200', 'bg-rose-50 border-rose-200', 'bg-cyan-50 border-cyan-200', 'bg-orange-50 border-orange-200'];

export default function StudyPlan() {
  const [form, setForm] = useState({ subject: '', goal: '', duration: '2 weeks', level: 'Beginner', hours: '2 hours/day' });
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState({});

  const generate = async () => {
    if (!form.subject.trim()) return;
    setLoading(true); setPlan(null); setChecked({});
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a detailed personalized study plan for: Subject: ${form.subject}, Goal: ${form.goal || 'Master the subject'}, Duration: ${form.duration}, Level: ${form.level}, Study time: ${form.hours}. 
      Return a structured plan with daily/weekly sessions.`,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          overview: { type: 'string' },
          tips: { type: 'array', items: { type: 'string' } },
          weeks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                week: { type: 'number' },
                theme: { type: 'string' },
                tasks: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      }
    });
    setPlan(res);
    setLoading(false);
  };

  const toggle = (wk, tk) => {
    const key = `${wk}-${tk}`;
    setChecked(c => ({ ...c, [key]: !c[key] }));
  };

  const totalTasks = plan?.weeks?.reduce((s, w) => s + (w.tasks?.length || 0), 0) || 0;
  const completedTasks = Object.values(checked).filter(Boolean).length;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Target className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-bold">Personalized Study Plan</h2>
            <p className="text-xs text-muted-foreground">AI creates a custom roadmap for your learning goals</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div><label className="text-xs font-medium mb-1 block">Subject / Topic *</label>
            <Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Calculus, Spanish, Machine Learning" />
          </div>
          <div><label className="text-xs font-medium mb-1 block">Goal</label>
            <Input value={form.goal} onChange={e => setForm(p => ({ ...p, goal: e.target.value }))} placeholder="e.g. Pass exam, Build a project" />
          </div>
          <div><label className="text-xs font-medium mb-1 block">Duration</label>
            <Select value={form.duration} onValueChange={v => setForm(p => ({ ...p, duration: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DURATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><label className="text-xs font-medium mb-1 block">Current Level</label>
            <Select value={form.level} onValueChange={v => setForm(p => ({ ...p, level: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2"><label className="text-xs font-medium mb-1 block">Study Time Available</label>
            <Select value={form.hours} onValueChange={v => setForm(p => ({ ...p, hours: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{HOURS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={generate} disabled={loading || !form.subject.trim()} className="w-full gradient-brand border-0 gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Building Your Plan...' : 'Generate Study Plan'}
        </Button>
      </Card>

      {plan && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Overview */}
          <Card className="p-5">
            <h2 className="font-black text-xl mb-1">{plan.title}</h2>
            <p className="text-sm text-muted-foreground mb-3">{plan.overview}</p>
            {totalTasks > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold">{completedTasks}/{totalTasks} tasks</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0}%` }} />
                </div>
              </div>
            )}
          </Card>

          {/* Tips */}
          {plan.tips?.length > 0 && (
            <Card className="p-4">
              <p className="font-semibold text-sm mb-2 flex items-center gap-1.5">💡 Study Tips</p>
              <ul className="space-y-1">
                {plan.tips.map((tip, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-primary">→</span>{tip}</li>)}
              </ul>
            </Card>
          )}

          {/* Weeks */}
          {plan.weeks?.map((week, wi) => (
            <motion.div key={wi} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: wi * 0.06 }}>
              <Card className={`overflow-hidden border ${DAY_COLORS[wi % DAY_COLORS.length]}`}>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-xl gradient-brand flex items-center justify-center text-white text-xs font-bold">{week.week}</div>
                    <div>
                      <p className="font-bold text-sm">Week {week.week}</p>
                      <p className="text-xs text-muted-foreground">{week.theme}</p>
                    </div>
                    <Badge variant="outline" className="ml-auto text-[10px]">
                      {(week.tasks || []).filter((_, ti) => checked[`${wi}-${ti}`]).length}/{(week.tasks || []).length}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    {(week.tasks || []).map((task, ti) => {
                      const done = checked[`${wi}-${ti}`];
                      return (
                        <button key={ti} onClick={() => toggle(wi, ti)}
                          className={`w-full text-left flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/50 transition-colors`}>
                          {done ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
                          <span className={`text-sm ${done ? 'line-through text-muted-foreground' : ''}`}>{task}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}