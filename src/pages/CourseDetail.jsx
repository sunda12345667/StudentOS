import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ClipboardList, Plus, Users, Calendar, CheckCircle, Clock, AlertCircle, Loader2, Upload } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import CreatePostBox from '@/components/shared/CreatePostBox';
import PostCard from '@/components/shared/PostCard';

const STATUS_STYLES = {
  submitted: 'bg-blue-100 text-blue-700',
  graded: 'bg-green-100 text-green-700',
  late: 'bg-red-100 text-red-700',
  missing: 'bg-gray-100 text-gray-600',
};

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useOutletContext();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aOpen, setAOpen] = useState(false);
  const [aForm, setAForm] = useState({ title: '', description: '', type: 'homework', due_date: '', max_points: 100 });
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(null);
  const [subText, setSubText] = useState('');
  const [grading, setGrading] = useState(null);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    const [courses, asgns, subs, ps] = await Promise.all([
      base44.entities.Course.filter({ id }).catch(() => []),
      base44.entities.Assignment.filter({ course_id: id }, '-created_date'),
      base44.entities.Submission.filter({ course_id: id }),
      base44.entities.Post.filter({ community_id: id }, '-created_date', 20),
    ]);
    if (courses.length) setCourse(courses[0]);
    setAssignments(asgns);
    setSubmissions(subs);
    setPosts(ps);
    setLoading(false);
  };

  const isTeacher = course?.teacher_email === user?.email;

  const createAssignment = async () => {
    if (!aForm.title) return;
    setCreating(true);
    await base44.entities.Assignment.create({ ...aForm, course_id: id, teacher_email: user.email, status: 'active', max_points: Number(aForm.max_points) });
    await load();
    setAOpen(false);
    setAForm({ title: '', description: '', type: 'homework', due_date: '', max_points: 100 });
    setCreating(false);
  };

  const submitAssignment = async (assignment) => {
    if (!subText.trim()) return;
    await base44.entities.Submission.create({
      assignment_id: assignment.id, course_id: id,
      student_email: user.email, student_name: user.full_name,
      content: subText, status: 'submitted', submitted_at: new Date().toISOString(),
      max_points: assignment.max_points,
    });
    setSubText('');
    setSubmitting(null);
    await load();
  };

  const gradeSubmission = async (sub, grade, feedback) => {
    await base44.entities.Submission.update(sub.id, { grade: Number(grade), feedback, status: 'graded' });
    setGrading(null);
    await load();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!course) return <div className="text-center py-20 text-muted-foreground">Course not found</div>;

  const colorClass = course.color || 'from-blue-500 to-indigo-600';
  const ti = course.teacher_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header Banner */}
      <Card className={`bg-gradient-to-br ${colorClass} text-white p-6 mb-6 overflow-hidden relative`}>
        <div className="absolute inset-0 opacity-10">
          <div className="w-40 h-40 rounded-full bg-white absolute -top-8 -right-8" />
          <div className="w-24 h-24 rounded-full bg-white absolute bottom-0 left-16" />
        </div>
        <Badge className="bg-white/20 text-white border-0 text-xs mb-3">{course.subject || 'General'}</Badge>
        <h1 className="text-3xl font-black mb-2">{course.title}</h1>
        <p className="text-white/80 text-sm mb-4">{course.description}</p>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7"><AvatarImage src={course.teacher_avatar} /><AvatarFallback className="bg-white/20 text-white text-xs">{ti}</AvatarFallback></Avatar>
            <span>{course.teacher_name}</span>
          </div>
          <div className="flex items-center gap-1"><Users className="w-4 h-4" />{course.student_count || 0} students</div>
          {course.schedule && <div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{course.schedule}</div>}
        </div>
      </Card>

      <Tabs defaultValue="assignments">
        <TabsList className="mb-6">
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="stream">Class Stream</TabsTrigger>
          {isTeacher && <TabsTrigger value="students">Students</TabsTrigger>}
          {isTeacher && <TabsTrigger value="grades">Grades</TabsTrigger>}
        </TabsList>

        {/* Assignments */}
        <TabsContent value="assignments" className="space-y-4">
          {isTeacher && (
            <div className="flex justify-end">
              <Dialog open={aOpen} onOpenChange={setAOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-brand border-0 gap-2"><Plus className="w-4 h-4" />Add Assignment</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Assignment</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div><Label>Title *</Label><Input value={aForm.title} onChange={e => setAForm(p => ({ ...p, title: e.target.value }))} /></div>
                    <div><Label>Instructions</Label><Textarea value={aForm.description} onChange={e => setAForm(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Type</Label>
                        <Select value={aForm.type} onValueChange={v => setAForm(p => ({ ...p, type: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['homework', 'quiz', 'project', 'exam', 'essay'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Max Points</Label><Input type="number" value={aForm.max_points} onChange={e => setAForm(p => ({ ...p, max_points: e.target.value }))} /></div>
                    </div>
                    <div><Label>Due Date</Label><Input type="datetime-local" value={aForm.due_date} onChange={e => setAForm(p => ({ ...p, due_date: e.target.value }))} /></div>
                    <Button onClick={createAssignment} disabled={creating || !aForm.title} className="w-full gradient-brand border-0">
                      {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Create
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
          {assignments.length === 0 ? (
            <Card className="p-10 text-center"><ClipboardList className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" /><p className="font-medium text-muted-foreground">No assignments yet</p></Card>
          ) : (
            assignments.map(a => {
              const mySubmission = submissions.find(s => s.assignment_id === a.id && s.student_email === user?.email);
              const isLate = a.due_date && isPast(new Date(a.due_date)) && !mySubmission;
              return (
                <Card key={a.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{a.title}</h3>
                        <Badge className="text-[10px] bg-primary/10 text-primary border-0">{a.type}</Badge>
                        {mySubmission && <Badge className={`text-[10px] ${STATUS_STYLES[mySubmission.status]}`}>{mySubmission.status}</Badge>}
                        {isLate && <Badge className="text-[10px] bg-red-100 text-red-700">Late</Badge>}
                      </div>
                      {a.description && <p className="text-sm text-muted-foreground mt-1">{a.description}</p>}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {a.due_date && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Due: {new Date(a.due_date).toLocaleDateString()}</span>}
                        <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />{a.max_points} pts</span>
                      </div>
                    </div>
                    {!isTeacher && !mySubmission && (
                      <Button size="sm" className="gradient-brand border-0 gap-1 text-xs" onClick={() => setSubmitting(a.id)}>
                        <Upload className="w-3.5 h-3.5" />Submit
                      </Button>
                    )}
                    {mySubmission?.grade !== undefined && (
                      <div className="text-right">
                        <p className="text-2xl font-black text-primary">{mySubmission.grade}</p>
                        <p className="text-xs text-muted-foreground">/ {a.max_points}</p>
                      </div>
                    )}
                  </div>
                  {submitting === a.id && (
                    <div className="mt-4 border-t pt-4 space-y-3">
                      <Textarea value={subText} onChange={e => setSubText(e.target.value)} placeholder="Write your answer..." rows={4} />
                      <div className="flex gap-2">
                        <Button size="sm" className="gradient-brand border-0" onClick={() => submitAssignment(a)} disabled={!subText.trim()}>Submit</Button>
                        <Button size="sm" variant="ghost" onClick={() => setSubmitting(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                  {mySubmission?.feedback && (
                    <div className="mt-3 bg-green-50 rounded-lg p-3 text-sm">
                      <p className="font-medium text-green-700 text-xs mb-1">Teacher Feedback</p>
                      <p className="text-green-800">{mySubmission.feedback}</p>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Stream */}
        <TabsContent value="stream" className="space-y-4">
          {user && <CreatePostBox user={user} onPosted={load} extraData={{ community_id: id }} />}
          {posts.map(p => <PostCard key={p.id} post={p} currentUser={user} />)}
        </TabsContent>

        {/* Students (teacher only) */}
        {isTeacher && (
          <TabsContent value="students">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(course.enrolled_emails || []).map(email => {
                const mySubmissions = submissions.filter(s => s.student_email === email);
                return (
                  <Card key={email} className="p-4 flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="gradient-brand text-white text-sm">{email[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{email}</p>
                      <p className="text-xs text-muted-foreground">{mySubmissions.length} submissions</p>
                    </div>
                  </Card>
                );
              })}
              {(course.enrolled_emails || []).length === 0 && (
                <div className="col-span-2 text-center py-8 text-muted-foreground">No students enrolled yet</div>
              )}
            </div>
          </TabsContent>
        )}

        {/* Grades (teacher only) */}
        {isTeacher && (
          <TabsContent value="grades" className="space-y-4">
            {submissions.map(sub => {
              const assignment = assignments.find(a => a.id === sub.assignment_id);
              return (
                <Card key={sub.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{sub.student_name}</p>
                      <p className="text-xs text-muted-foreground">{assignment?.title}</p>
                      <p className="text-xs mt-1 line-clamp-1 text-muted-foreground">{sub.content}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {sub.status === 'graded' ? (
                        <div className="text-right">
                          <p className="font-black text-xl text-primary">{sub.grade}</p>
                          <p className="text-xs text-muted-foreground">/ {assignment?.max_points}</p>
                        </div>
                      ) : (
                        <Button size="sm" className="gradient-brand border-0 text-xs" onClick={() => setGrading(sub.id)}>Grade</Button>
                      )}
                    </div>
                  </div>
                  {grading === sub.id && (
                    <GradeForm sub={sub} assignment={assignment} onGrade={gradeSubmission} onCancel={() => setGrading(null)} />
                  )}
                </Card>
              );
            })}
            {submissions.length === 0 && (
              <Card className="p-10 text-center text-muted-foreground">No submissions yet</Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function GradeForm({ sub, assignment, onGrade, onCancel }) {
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  return (
    <div className="mt-3 border-t pt-3 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Grade (out of {assignment?.max_points})</Label><Input type="number" value={grade} onChange={e => setGrade(e.target.value)} /></div>
        <div><Label>Feedback</Label><Input value={feedback} onChange={e => setFeedback(e.target.value)} /></div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="gradient-brand border-0" onClick={() => onGrade(sub, grade, feedback)}>Submit Grade</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}