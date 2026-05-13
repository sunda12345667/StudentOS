import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Compass, Star, ExternalLink, Sparkles, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const GOALS = ['Academic improvement', 'Career preparation', 'Personal interest', 'Exam prep', 'Skill building', 'University prep'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export default function CourseRecommendations() {
  const [interests, setInterests] = useState('');
  const [goal, setGoal] = useState('Academic improvement');
  const [level, setLevel] = useState('Beginner');
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!interests.trim()) return;
    setLoading(true); setRecs([]);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Recommend 6 specific courses, resources, or learning paths for a student with: Interests: ${interests}, Goal: ${goal}, Level: ${level}.
      For each include a specific platform (Coursera, Khan Academy, YouTube, edX, Udemy, MIT OpenCourseWare, etc.) and why it suits them.`,
      response_json_schema: {
        type: 'object',
        properties: {
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                platform: { type: 'string' },
                description: { type: 'string' },
                why: { type: 'string' },
                duration: { type: 'string' },
                difficulty: { type: 'string' },
                tag: { type: 'string' }
              }
            }
          }
        }
      }
    });
    setRecs(res.recommendations || []);
    setLoading(false);
  };

  const COLORS = ['bg-blue-50 border-blue-100', 'bg-violet-50 border-violet-100', 'bg-emerald-50 border-emerald-100', 'bg-amber-50 border-amber-100', 'bg-rose-50 border-rose-100', 'bg-cyan-50 border-cyan-100'];

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-cyan-100 flex items-center justify-center">
            <Compass className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h2 className="font-bold">Course Recommendations</h2>
            <p className="text-xs text-muted-foreground">Personalized learning path suggestions</p>
          </div>
        </div>
        <div className="space-y-3">
          <div><label className="text-xs font-medium mb-1 block">Interests & Subjects *</label>
            <Textarea value={interests} onChange={e => setInterests(e.target.value)} rows={2} placeholder="e.g. I love math and want to learn programming, especially AI and data science..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium mb-1 block">Goal</label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GOALS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-medium mb-1 block">Level</label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={generate} disabled={loading || !interests.trim()} className="w-full gradient-brand border-0 gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Finding Courses...' : 'Get Recommendations'}
          </Button>
        </div>
      </Card>

      {recs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recs.map((rec, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className={`p-4 border ${COLORS[i % COLORS.length]} h-full flex flex-col`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <Badge variant="outline" className="text-[10px] flex-shrink-0">{rec.platform}</Badge>
                </div>
                <h3 className="font-bold text-sm mb-1">{rec.title}</h3>
                <p className="text-xs text-muted-foreground mb-2 flex-1">{rec.description}</p>
                <div className="space-y-1.5 mt-auto">
                  <p className="text-xs text-primary font-medium">✨ {rec.why}</p>
                  <div className="flex gap-2">
                    {rec.duration && <Badge variant="secondary" className="text-[10px]">⏱ {rec.duration}</Badge>}
                    {rec.difficulty && <Badge variant="secondary" className="text-[10px]">{rec.difficulty}</Badge>}
                    {rec.tag && <Badge className="bg-primary/10 text-primary border-0 text-[10px]">{rec.tag}</Badge>}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}