import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Plus, Users, Clock, ChevronRight, GraduationCap, Loader2, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['from-blue-500 to-indigo-600', 'from-purple-500 to-pink-600', 'from-green-500 to-emerald-600', 'from-orange-500 to-red-600', 'from-cyan-500 to-blue-600', 'from-amber-500 to-orange-600'];

export default function Classroom() {
  const { user } = useOutletContext();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', subject: '', grade_level: '', schedule: '', price: 0, is_free: true });

  useEffect(() => { load(); }, [user?.email]);

  const load = async () => {
    const all = await base44.entities.Course.list('-created_date', 50);
    setCourses(all);
    setLoading(false);
  };

  const myCourses = courses.filter(c => c.enrolled_emails?.includes(user?.email) || c.teacher_email === user?.email);
  const discover = courses.filter(c => !c.enrolled_emails?.includes(user?.email) && c.teacher_email !== user?.email);

  const handleCreate = async () => {
    if (!form.title) return;
    setCreating(true);
    await base44.entities.Course.create({
      ...form, teacher_email: user.email, teacher_name: user.full_name,
      teacher_avatar: user.avatar_url || '', enrolled_emails: [], student_count: 0,
      status: 'active', color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
    await load();
    setOpen(false);
    setForm({ title: '', description: '', subject: '', grade_level: '', schedule: '', price: 0, is_free: true });
    setCreating(false);
  };

  const handleEnroll = async (course) => {
    const emails = [...(course.enrolled_emails || []), user.email];
    await base44.entities.Course.update(course.id, { enrolled_emails: emails, student_count: emails.length });
    setCourses(p => p.map(c => c.id === course.id ? { ...c, enrolled_emails: emails, student_count: emails.length } : c));
  };

  const CourseCard = ({ course, enrolled = false }) => {
    const ti = course.teacher_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
    const colorClass = course.color || COLORS[0];
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden hover:shadow-xl transition-all group cursor-pointer">
          <div className={`h-28 bg-gradient-to-br ${colorClass} relative flex items-end p-4`}>
            <BookOpen className="absolute top-4 right-4 w-10 h-10 text-white/20" />
            <div>
              <Badge className="bg-white/20 text-white border-0 text-[10px] mb-1">{course.subject || 'General'}</Badge>
              <h3 className="text-white font-bold text-base leading-tight">{course.title}</h3>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={course.teacher_avatar} />
                <AvatarFallback className="text-[10px] gradient-brand text-white">{ti}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{course.teacher_name}</span>
              <Badge className="ml-auto text-[10px] bg-purple-100 text-purple-700 border-0">Teacher</Badge>
            </div>
            {course.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.description}</p>}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{course.student_count || 0}</div>
              {course.schedule && <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{course.schedule}</div>}
              <div className="flex items-center gap-1 ml-auto">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>{(4.2 + Math.random() * 0.7).toFixed(1)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">{course.is_free ? 'Free' : `$${course.price}`}</span>
              {enrolled ? (
                <Link to={`/classroom/${course.id}`}>
                  <Button size="sm" className="h-7 text-xs gradient-brand border-0 gap-1">
                    Enter <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              ) : (
                <Button size="sm" className="h-7 text-xs gradient-brand border-0" onClick={() => handleEnroll(course)}>
                  Enroll
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black">Classroom</h1>
          <p className="text-muted-foreground mt-1">Learn, teach, and grow together</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand border-0 gap-2"><Plus className="w-4 h-4" />Create Course</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create a New Course</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label>Course Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Introduction to Algebra" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Subject</Label><Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Math" /></div>
                <div><Label>Grade Level</Label><Input value={form.grade_level} onChange={e => setForm(p => ({ ...p, grade_level: e.target.value }))} placeholder="e.g. Grade 9" /></div>
              </div>
              <div><Label>Schedule</Label><Input value={form.schedule} onChange={e => setForm(p => ({ ...p, schedule: e.target.value }))} placeholder="e.g. Mon/Wed 10-11am" /></div>
              <Button onClick={handleCreate} disabled={creating || !form.title} className="w-full gradient-brand border-0">
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Create Course
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <Tabs defaultValue="enrolled">
          <TabsList className="mb-6">
            <TabsTrigger value="enrolled">My Courses ({myCourses.length})</TabsTrigger>
            <TabsTrigger value="discover">Discover ({discover.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="enrolled">
            {myCourses.length === 0 ? (
              <Card className="p-12 text-center">
                <GraduationCap className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="font-semibold">Not enrolled in any courses yet</p>
                <p className="text-sm text-muted-foreground mt-1">Switch to Discover tab to find courses</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {myCourses.map(c => <CourseCard key={c.id} course={c} enrolled />)}
              </div>
            )}
          </TabsContent>
          <TabsContent value="discover">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {discover.map(c => <CourseCard key={c.id} course={c} />)}
              {discover.length === 0 && (
                <div className="col-span-full text-center py-16 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No courses to discover yet</p>
                  <p className="text-sm">Be the first to create a course!</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}