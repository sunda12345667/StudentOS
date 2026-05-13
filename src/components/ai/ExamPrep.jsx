import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, GraduationCap, BookOpen, AlertCircle, ListChecks, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

const EXAM_TYPES = ['Multiple Choice', 'Essay', 'Short Answer', 'Mixed'];

export default function ExamPrep() {
  const [subject, setSubject] = useState('');
  const [topics, setTopics] = useState('');
  const [examType, setExamType] = useState('Mixed');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('guide');

  const generate = async () => {
    if (!subject.trim()) return;
    setLoading(true); setResult(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a comprehensive exam preparation guide for: Subject: ${subject}, Topics: ${topics || 'all main topics'}, Exam type: ${examType}.
      Include: 1) Key topics to focus on, 2) Common mistakes to avoid, 3) Study strategies, 4) 3 sample exam questions with detailed answers, 5) Last-minute tips.`,
      response_json_schema: {
        type: 'object',
        properties: {
          key_topics: { type: 'array', items: { type: 'string' } },
          common_mistakes: { type: 'array', items: { type: 'string' } },
          strategies: { type: 'array', items: { type: 'string' } },
          sample_questions: { type: 'array', items: { type: 'object', properties: { question: { type: 'string' }, answer: { type: 'string' } } } },
          last_minute_tips: { type: 'array', items: { type: 'string' } }
        }
      }
    });
    setResult(res);
    setLoading(false);
  };

  const tabs = [
    { id: 'guide', label: '📚 Topics', data: result?.key_topics, empty: 'key topics' },
    { id: 'mistakes', label: '⚠️ Mistakes', data: result?.common_mistakes, empty: 'common mistakes' },
    { id: 'strategies', label: '🎯 Strategy', data: result?.strategies, empty: 'strategies' },
    { id: 'tips', label: '⚡ Tips', data: result?.last_minute_tips, empty: 'tips' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="font-bold">Exam Preparation</h2>
            <p className="text-xs text-muted-foreground">AI-powered study guide tailored to your exam</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div><label className="text-xs font-medium mb-1 block">Subject *</label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Biology, Calculus" />
          </div>
          <div><label className="text-xs font-medium mb-1 block">Exam Type</label>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{EXAM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><label className="text-xs font-medium mb-1 block">Specific Topics</label>
            <Input value={topics} onChange={e => setTopics(e.target.value)} placeholder="e.g. Chapters 1-5, DNA" />
          </div>
        </div>
        <Button onClick={generate} disabled={loading || !subject.trim()} className="w-full gradient-brand border-0 gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Preparing Your Guide...' : 'Generate Exam Guide'}
        </Button>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${activeTab === t.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
                {t.label}
              </button>
            ))}
            <button onClick={() => setActiveTab('questions')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${activeTab === 'questions' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
              📝 Sample Q&A
            </button>
          </div>

          {activeTab !== 'questions' ? (
            <Card className="p-5">
              <ul className="space-y-2">
                {(tabs.find(t => t.id === activeTab)?.data || []).map((item, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-2.5 text-sm p-2.5 rounded-xl bg-muted/50">
                    <span className="w-5 h-5 rounded-full gradient-brand text-white text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i + 1}</span>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </Card>
          ) : (
            <div className="space-y-3">
              {(result.sample_questions || []).map((q, i) => (
                <Card key={i} className="p-5">
                  <div className="flex items-start gap-2 mb-2">
                    <Badge className="gradient-brand text-white border-0 flex-shrink-0">Q{i + 1}</Badge>
                    <p className="font-semibold text-sm">{q.question}</p>
                  </div>
                  <div className="pl-4 border-l-2 border-primary/30 mt-3">
                    <p className="text-xs text-muted-foreground mb-1 font-medium">Model Answer:</p>
                    <p className="text-sm text-muted-foreground">{q.answer}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}