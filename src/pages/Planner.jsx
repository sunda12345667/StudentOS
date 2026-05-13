import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  CalendarDays, Plus, BookOpen, Target, Clock,
  CheckCircle2, Circle, Trash2, ChevronRight,
  AlertTriangle, Flame, TrendingUp, Calendar
} from 'lucide-react';
import { format, differenceInDays, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import StudySessionForm from '@/components/planner/StudySessionForm';
import ExamForm from '@/components/planner/ExamForm';
import GoalForm from '@/components/planner/GoalForm';

const TABS = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'sessions', label: 'Study Sessions', icon: BookOpen },
  { id: 'exams', label: 'Exam Dates', icon: CalendarDays },
  { id: 'goals', label: 'Daily Goals', icon: Target },
];

const PRIORITY_COLORS = { high: 'bg-red-500/10 text-red-500 border-red-500/20', medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20', low: 'bg-green-500/10 text-green-500 border-green-500/20' };
const STATUS_COLORS = { planned: 'bg-blue-500/10 text-blue-500', completed: 'bg-green-500/10 text-green-500', skipped: 'bg-muted text-muted-foreground' };
const CAT_COLORS = { study: 'text-indigo-500', reading: 'text-blue-500', practice: 'text-purple-500', revision: 'text-amber-500', exercise: 'text-green-500', other: 'text-gray-500' };

export default function Planner() {
  const { user } = useOutletContext();
  const [tab, setTab] = useState('overview');
  const [sessions, setSessions] = useState([]);
  const [exams, setExams] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(null); // 'session' | 'exam' | 'goal'

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user?.email) return;
    Promise.all([
      base44.entities.StudySession.filter({ user_email: user.email }, '-date', 100),
      base44.entities.ExamDate.filter({ user_email: user.email }, 'exam_date', 50),
      base44.entities.DailyGoal.filter({ user_email: user.email }, '-date', 50),
    ]).then(([s, e, g]) => {
      setSessions(s);
      setExams(e);
      setGoals(g);
    }).finally(() => setLoading(false));
  }, [user?.email]);

  const addSession = async (data) => {
    const created = await base44.entities.StudySession.create(data);
    setSessions(p => [created, ...p]);
    setShowForm(null);
  };

  const addExam = async (data) => {
    const created = await base44.entities.ExamDate.create(data);
    setExams(p => [...p, created].sort((a, b) => a.exam_date.localeCompare(b.exam_date)));
    setShowForm(null);
  };

  const addGoal = async (data) => {
    const created = await base44.entities.DailyGoal.create(data);
    setGoals(p => [created, ...p]);
    setShowForm(null);
  };

  const toggleSession = async (s) => {
    const newStatus = s.status === 'completed' ? 'planned' : 'completed';
    await base44.entities.StudySession.update(s.id, { status: newStatus });
    setSessions(p => p.map(x => x.id === s.id ? { ...x, status: newStatus } : x));
  };

  const deleteSession = async (id) => {
    await base44.entities.StudySession.delete(id);
    setSessions(p => p.filter(x => x.id !== id));
  };

  const deleteExam = async (id) => {
    await base44.entities.ExamDate.delete(id);
    setExams(p => p.filter(x => x.id !== id));
  };

  const updateGoalProgress = async (goal, delta) => {
    const newVal = Math.max(0, Math.min(goal.target_value, goal.current_value + delta));
    const completed = newVal >= goal.target_value;
    await base44.entities.DailyGoal.update(goal.id, { current_value: newVal, completed });
    setGoals(p => p.map(x => x.id === goal.id ? { ...x, current_value: newVal, completed } : x));
  };

  const deleteGoal = async (id) => {
    await base44.entities.DailyGoal.delete(id);
    setGoals(p => p.filter(x => x.id !== id));
  };

  // Overview stats
  const todaySessions = sessions.filter(s => s.date === today);
  const upcomingExams = exams.filter(e => !isPast(parseISO(e.exam_date)) || e.exam_date === today);
  const todayGoals = goals.filter(g => g.date === today);
  const completedGoals = todayGoals.filter(g => g.completed).length;
  const completedSessions = sessions.filter(s => s.status === 'completed').length;

  const getDaysUntil = (dateStr) => differenceInDays(parseISO(dateStr), new Date());

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">My Planner</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <Button
          onClick={() => setShowForm(tab === 'exams' ? 'exam' : tab === 'goals' ? 'goal' : 'session')}
          className="gradient-brand text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          {tab === 'exams' ? 'Add Exam' : tab === 'goals' ? 'Add Goal' : 'Add Session'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all",
              tab === t.id ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground text-sm">Loading planner...</div>
      ) : (
        <>
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Today's Sessions", value: todaySessions.length, sub: `${todaySessions.filter(s=>s.status==='completed').length} done`, icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                  { label: 'Upcoming Exams', value: upcomingExams.length, sub: upcomingExams[0] ? `Next: ${upcomingExams[0].subject}` : 'None', icon: CalendarDays, color: 'text-red-500', bg: 'bg-red-500/10' },
                  { label: "Today's Goals", value: `${completedGoals}/${todayGoals.length}`, sub: 'completed', icon: Target, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                  { label: 'Sessions Done', value: completedSessions, sub: `of ${sessions.length} total`, icon: Flame, color: 'text-green-500', bg: 'bg-green-500/10' },
                ].map(s => (
                  <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", s.bg)}>
                      <s.icon className={cn("w-5 h-5", s.color)} />
                    </div>
                    <p className="text-2xl font-black">{s.value}</p>
                    <p className="text-xs font-semibold text-foreground">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Today's goals progress */}
              {todayGoals.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-amber-500" />Today's Goals</h3>
                  <div className="space-y-3">
                    {todayGoals.map(g => (
                      <div key={g.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{g.title}</span>
                          <span className="text-xs text-muted-foreground">{g.current_value}/{g.target_value} {g.unit}</span>
                        </div>
                        <Progress value={(g.current_value / g.target_value) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming exams */}
              {upcomingExams.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-red-500" />Upcoming Exams</h3>
                  <div className="space-y-2">
                    {upcomingExams.slice(0, 4).map(e => {
                      const days = getDaysUntil(e.exam_date);
                      return (
                        <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-muted">
                          <div>
                            <p className="font-semibold text-sm">{e.subject}</p>
                            <p className="text-xs text-muted-foreground">{format(parseISO(e.exam_date), 'MMM d, yyyy')}{e.exam_time ? ` · ${e.exam_time}` : ''}</p>
                          </div>
                          <Badge className={cn("text-xs", days <= 3 ? 'bg-red-500/10 text-red-500' : days <= 7 ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500')}>
                            {days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `${days}d`}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Today's sessions */}
              {todaySessions.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-500" />Today's Study Sessions</h3>
                  <div className="space-y-2">
                    {todaySessions.map(s => (
                      <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{s.title}</p>
                          <p className="text-xs text-muted-foreground">{s.subject}{s.start_time ? ` · ${s.start_time}` : ''}</p>
                        </div>
                        <Badge className={cn("text-xs", STATUS_COLORS[s.status])}>{s.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sessions.length === 0 && exams.length === 0 && goals.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="font-semibold text-lg">Your planner is empty</p>
                  <p className="text-sm">Add study sessions, exam dates, and goals to get started.</p>
                </div>
              )}
            </div>
          )}

          {/* STUDY SESSIONS */}
          {tab === 'sessions' && (
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-semibold">No study sessions yet</p>
                  <p className="text-sm">Plan your first study session!</p>
                </div>
              ) : sessions.map(s => (
                <div key={s.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                  <button onClick={() => toggleSession(s)}>
                    {s.status === 'completed'
                      ? <CheckCircle2 className="w-6 h-6 text-green-500" />
                      : <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />}
                  </button>
                  <div className="w-3 h-10 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-semibold text-sm", s.status === 'completed' && 'line-through text-muted-foreground')}>{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.subject && `${s.subject} · `}{format(parseISO(s.date), 'MMM d')}
                      {s.start_time ? ` · ${s.start_time}` : ''}
                      {s.end_time ? ` – ${s.end_time}` : ''}
                    </p>
                  </div>
                  <Badge className={cn("text-xs flex-shrink-0", STATUS_COLORS[s.status])}>{s.status}</Badge>
                  {isToday(parseISO(s.date)) && <Badge className="text-xs bg-indigo-500/10 text-indigo-500 flex-shrink-0">Today</Badge>}
                  <button onClick={() => deleteSession(s.id)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* EXAM DATES */}
          {tab === 'exams' && (
            <div className="space-y-3">
              {exams.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-semibold">No exam dates added</p>
                  <p className="text-sm">Track your upcoming exams here.</p>
                </div>
              ) : exams.map(e => {
                const days = getDaysUntil(e.exam_date);
                const pastExam = days < 0;
                return (
                  <div key={e.id} className={cn("bg-card border rounded-2xl p-4 flex items-center gap-4", pastExam ? 'border-border opacity-60' : 'border-border')}>
                    <div className={cn("w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-center",
                      days <= 3 && !pastExam ? 'bg-red-500/10' : days <= 7 && !pastExam ? 'bg-amber-500/10' : 'bg-muted')}>
                      <span className="text-xs font-bold leading-none">{format(parseISO(e.exam_date), 'MMM')}</span>
                      <span className="text-lg font-black leading-none">{format(parseISO(e.exam_date), 'd')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{e.subject}</p>
                      {e.title && <p className="text-xs text-muted-foreground">{e.title}</p>}
                      <p className="text-xs text-muted-foreground">
                        {e.exam_time && `${e.exam_time}`}{e.location && ` · ${e.location}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={cn("text-xs border", PRIORITY_COLORS[e.priority])}>{e.priority}</Badge>
                      {!pastExam && (
                        <Badge className={cn("text-xs", days <= 3 ? 'bg-red-500/10 text-red-500' : days <= 7 ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500')}>
                          {days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `${days}d left`}
                        </Badge>
                      )}
                      {pastExam && <Badge variant="secondary" className="text-xs">Done</Badge>}
                    </div>
                    <button onClick={() => deleteExam(e.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* DAILY GOALS */}
          {tab === 'goals' && (
            <div className="space-y-3">
              {goals.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-semibold">No goals set</p>
                  <p className="text-sm">Set daily academic goals to stay on track.</p>
                </div>
              ) : goals.map(g => (
                <div key={g.id} className={cn("bg-card border rounded-2xl p-4", g.completed ? 'border-green-500/30' : 'border-border')}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", g.completed ? 'bg-green-500/10' : 'bg-muted')}>
                        {g.completed
                          ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                          : <Target className={cn("w-4 h-4", CAT_COLORS[g.category])} />}
                      </div>
                      <div>
                        <p className={cn("font-semibold text-sm", g.completed && 'line-through text-muted-foreground')}>{g.title}</p>
                        <p className="text-xs text-muted-foreground">{format(parseISO(g.date), 'MMM d')} · {g.category}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteGoal(g.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <Progress value={(g.current_value / g.target_value) * 100} className="h-2 mb-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{g.current_value} / {g.target_value} {g.unit}</span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => updateGoalProgress(g, -1)} disabled={g.current_value === 0}>−</Button>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => updateGoalProgress(g, 1)} disabled={g.completed}>+</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Forms */}
      {showForm === 'session' && <StudySessionForm userEmail={user?.email} onSave={addSession} onClose={() => setShowForm(null)} />}
      {showForm === 'exam' && <ExamForm userEmail={user?.email} onSave={addExam} onClose={() => setShowForm(null)} />}
      {showForm === 'goal' && <GoalForm userEmail={user?.email} onSave={addGoal} onClose={() => setShowForm(null)} />}
    </div>
  );
}