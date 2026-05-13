import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Wand2, BookOpen, Upload, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

const SUBJECTS = ['Math', 'Science', 'History', 'English', 'Physics', 'Chemistry', 'Biology', 'Programming', 'Geography', 'Economics'];

export default function HomeworkAssistant() {
  const [problem, setProblem] = useState('');
  const [subject, setSubject] = useState('Math');
  const [mode, setMode] = useState('solve'); // solve | hint | check
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!problem.trim()) return;
    setLoading(true); setResult(null);
    const modeMap = {
      solve: `Solve the following ${subject} problem step-by-step with full explanation. Show all work clearly.\n\nProblem: ${problem}`,
      hint: `Give 2-3 helpful hints for the following ${subject} problem WITHOUT giving away the full answer. Help the student think through it.\n\nProblem: ${problem}`,
      check: `Check the following student's answer to a ${subject} problem. Identify what's correct, what's wrong, and how to improve.\n\nProblem: ${problem}\n\nStudent's answer: ${answer}`,
    };
    const response = await base44.integrations.Core.InvokeLLM({ prompt: modeMap[mode], model: 'claude_sonnet_4_6' });
    setResult(response);
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-bold">Homework Assistant</h2>
            <p className="text-xs text-muted-foreground">Get step-by-step help with any problem</p>
          </div>
        </div>

        <div className="flex gap-3 mb-3">
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex rounded-xl border overflow-hidden">
            {[['solve', '🔍 Solve'], ['hint', '💡 Hints'], ['check', '✅ Check']].map(([v, l]) => (
              <button key={v} onClick={() => setMode(v)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${mode === v ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted text-muted-foreground'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <Textarea value={problem} onChange={e => setProblem(e.target.value)}
          placeholder={`Paste your ${subject} problem here...`} rows={4} className="mb-3" />

        {mode === 'check' && (
          <Textarea value={answer} onChange={e => setAnswer(e.target.value)}
            placeholder="Your answer to check..." rows={2} className="mb-3" />
        )}

        <Button onClick={run} disabled={loading || !problem.trim()} className="w-full gradient-brand border-0 gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {mode === 'solve' ? 'Solve Problem' : mode === 'hint' ? 'Get Hints' : 'Check Answer'}
        </Button>
      </Card>

      {loading && (
        <Card className="p-5 flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm">EduBot is working on it...</span>
        </Card>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg gradient-brand flex items-center justify-center">
                <Wand2 className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="font-semibold text-sm">EduBot's Response</p>
            </div>
            <ReactMarkdown className="text-sm prose prose-sm max-w-none prose-headings:font-semibold prose-code:bg-muted prose-code:px-1 prose-code:rounded">
              {result}
            </ReactMarkdown>
          </Card>
        </motion.div>
      )}
    </div>
  );
}