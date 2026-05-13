import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, HelpCircle, CheckCircle2, XCircle, Sparkles, RotateCcw, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

export default function PracticeQuestions() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setQuestions([]); setAnswers({}); setSubmitted(false);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate 5 multiple-choice practice questions about "${topic}" at ${difficulty} level. Each question must have 4 options (A, B, C, D) and one correct answer. Include a brief explanation for why the answer is correct.`,
      response_json_schema: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                options: { type: 'array', items: { type: 'string' } },
                correct: { type: 'string' },
                explanation: { type: 'string' }
              }
            }
          }
        }
      }
    });
    setQuestions(res.questions || []);
    setLoading(false);
  };

  const submit = () => {
    let s = 0;
    questions.forEach((q, i) => { if (answers[i] === q.correct) s++; });
    setScore(s);
    setSubmitted(true);
  };

  const reset = () => { setQuestions([]); setAnswers({}); setSubmitted(false); setTopic(''); };

  const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {questions.length === 0 ? (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-bold">Practice Questions</h2>
              <p className="text-xs text-muted-foreground">AI-generated multiple choice quiz</p>
            </div>
          </div>
          <div className="flex gap-3 mb-3">
            <Textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic (e.g. Cell division, The French Revolution, React Hooks)..." rows={2} className="flex-1" />
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-36 self-start"><SelectValue /></SelectTrigger>
              <SelectContent>{DIFFICULTIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={generate} disabled={loading || !topic.trim()} className="w-full gradient-brand border-0 gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Generating Quiz...' : 'Generate 5 Questions'}
          </Button>
        </Card>
      ) : (
        <>
          {submitted && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className={`p-5 flex items-center justify-between ${score >= 4 ? 'bg-green-50 border-green-200' : score >= 3 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{score >= 4 ? '🏆' : score >= 3 ? '⭐' : '📚'}</div>
                  <div>
                    <p className="font-black text-xl">{score}/{questions.length}</p>
                    <p className="text-sm text-muted-foreground">{score >= 4 ? 'Excellent work!' : score >= 3 ? 'Good effort, keep going!' : 'Keep practicing!'}</p>
                  </div>
                </div>
                <Button onClick={reset} variant="outline" className="gap-2"><RotateCcw className="w-4 h-4" />New Quiz</Button>
              </Card>
            </motion.div>
          )}

          {questions.map((q, i) => {
            const chosen = answers[i];
            const isCorrect = chosen === q.correct;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className="p-5">
                  <div className="flex items-start gap-2 mb-3">
                    <Badge variant="outline" className="flex-shrink-0 mt-0.5">Q{i + 1}</Badge>
                    <p className="font-semibold text-sm">{q.question}</p>
                  </div>
                  <div className="space-y-2">
                    {(q.options || []).map((opt, oi) => {
                      const letter = ['A', 'B', 'C', 'D'][oi];
                      const isChosen = chosen === letter;
                      const isAnswer = submitted && letter === q.correct;
                      const isWrong = submitted && isChosen && !isCorrect;
                      return (
                        <button key={oi} disabled={submitted}
                          onClick={() => !submitted && setAnswers(a => ({ ...a, [i]: letter }))}
                          className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm transition-all
                            ${isAnswer ? 'bg-green-100 border-green-400 text-green-800 font-medium' :
                              isWrong ? 'bg-red-100 border-red-400 text-red-800' :
                              isChosen ? 'bg-primary/10 border-primary text-primary font-medium' :
                              'border-border hover:border-primary/40 hover:bg-muted/50 disabled:cursor-default'}`}>
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ${isChosen ? 'bg-primary text-white border-primary' : 'border-border'}`}>{letter}</span>
                          <span className="flex-1">{opt}</span>
                          {isAnswer && <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />}
                          {isWrong && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  {submitted && q.explanation && (
                    <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <p className="text-xs text-blue-800"><span className="font-bold">💡 Explanation: </span>{q.explanation}</p>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}

          {!submitted && (
            <Button onClick={submit} disabled={!allAnswered} className="w-full gradient-brand border-0 h-12 gap-2">
              <Trophy className="w-4 h-4" />Submit Answers ({Object.keys(answers).length}/{questions.length})
            </Button>
          )}
        </>
      )}
    </div>
  );
}