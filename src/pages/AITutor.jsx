import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Bot, Sparkles, Loader2, RefreshCw, BookOpen, Calculator, FlaskConical, Globe, Code2, Layers, HelpCircle, FileText, Target, GraduationCap, Compass, Wand2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

import HomeworkAssistant from '@/components/ai/HomeworkAssistant';
import Flashcards from '@/components/ai/Flashcards';
import PracticeQuestions from '@/components/ai/PracticeQuestions';
import AISummary from '@/components/ai/AISummary';
import StudyPlan from '@/components/ai/StudyPlan';
import ExamPrep from '@/components/ai/ExamPrep';
import CourseRecommendations from '@/components/ai/CourseRecommendations';

const TABS = [
  { id: 'chat',     icon: Bot,          label: 'AI Tutor',        color: 'text-primary',      bg: 'bg-primary/10' },
  { id: 'homework', icon: BookOpen,      label: 'Homework',        color: 'text-blue-600',     bg: 'bg-blue-50' },
  { id: 'flashcards',icon: Layers,       label: 'Flashcards',      color: 'text-violet-600',   bg: 'bg-violet-50' },
  { id: 'quiz',     icon: HelpCircle,    label: 'Practice Quiz',   color: 'text-amber-600',    bg: 'bg-amber-50' },
  { id: 'summary',  icon: FileText,      label: 'Summarize',       color: 'text-emerald-600',  bg: 'bg-emerald-50' },
  { id: 'plan',     icon: Target,        label: 'Study Plan',      color: 'text-indigo-600',   bg: 'bg-indigo-50' },
  { id: 'exam',     icon: GraduationCap, label: 'Exam Prep',       color: 'text-red-600',      bg: 'bg-red-50' },
  { id: 'courses',  icon: Compass,       label: 'Courses',         color: 'text-cyan-600',     bg: 'bg-cyan-50' },
];

const QUICK_PROMPTS = [
  { icon: Calculator, text: "Explain quadratic equations step by step", color: "text-blue-500 bg-blue-50" },
  { icon: FlaskConical, text: "How does photosynthesis work?", color: "text-green-500 bg-green-50" },
  { icon: Globe, text: "Summarize the causes of World War II", color: "text-amber-500 bg-amber-50" },
  { icon: Code2, text: "Explain how loops work in Python", color: "text-purple-500 bg-purple-50" },
  { icon: BookOpen, text: "Help me write a strong essay introduction", color: "text-rose-500 bg-rose-50" },
  { icon: Wand2, text: "What is the Pythagorean theorem?", color: "text-cyan-500 bg-cyan-50" },
];

const EDUCATION_LEVELS = [
  { id: 'primary',    label: 'Primary School',    desc: 'Ages 6–11',       hint: 'Use very simple words, short sentences, fun examples, and avoid jargon.' },
  { id: 'secondary',  label: 'Secondary School',  desc: 'Ages 12–17',      hint: 'Use clear language, relatable real-world examples, and introduce technical terms gently.' },
  { id: 'a_level',    label: 'A-Level / Pre-Uni',  desc: 'Ages 17–19',      hint: 'Use intermediate academic language, deeper explanations, and exam-focused tips.' },
  { id: 'university', label: 'University',         desc: 'Undergraduate',   hint: 'Use academic language, theoretical frameworks, citations where relevant, and rigorous explanations.' },
  { id: 'postgrad',   label: 'Postgraduate',       desc: 'Masters / PhD',   hint: 'Assume advanced knowledge. Be concise, technical, research-oriented, and critical.' },
  { id: 'vocational', label: 'Vocational / Other', desc: 'Skills & Trades', hint: 'Focus on practical, hands-on explanations with real-world application and step-by-step guides.' },
];

const buildSystemPrompt = (level) => {
  const l = EDUCATION_LEVELS.find(e => e.id === level) || EDUCATION_LEVELS[1];
  return `You are EduBot, an enthusiastic and brilliant AI tutor. The student's education level is: ${l.label} (${l.desc}). ${l.hint}
You:
- Explain concepts clearly and step-by-step with real examples appropriate for this level
- Use analogies, diagrams (in text), and relatable comparisons
- Encourage students and build their confidence
- Ask follow-up questions to check understanding
- Use markdown: headers, bullet points, numbered steps, code blocks
- Keep responses engaging, structured, and concise
Always be warm, encouraging, and positive!`;
};

export default function AITutor() {
  const { user } = useOutletContext();
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState('secondary');
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput('');
    const userMsg = { role: 'user', content: userText, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    const history = messages.slice(-8).map(m => `${m.role === 'user' ? 'Student' : 'EduBot'}: ${m.content}`).join('\n');
    const prompt = `${buildSystemPrompt(level)}\n\nConversation:\n${history}\n\nStudent: ${userText}\n\nEduBot:`;
    const response = await base44.integrations.Core.InvokeLLM({ prompt, model: 'claude_sonnet_4_6' });
    setMessages(prev => [...prev, { role: 'assistant', content: response, id: Date.now() + 1 }]);
    setLoading(false);
  };

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black">AI Learning System</h1>
          <p className="text-sm text-muted-foreground">Your personal AI-powered study companion</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground hidden sm:inline">EduBot Online</span>
          </div>
          {/* Education Level Selector */}
          <div className="relative">
            <select
              value={level}
              onChange={e => { setLevel(e.target.value); setMessages([]); }}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-xl border border-border bg-card text-xs font-medium text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {EDUCATION_LEVELS.map(l => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border whitespace-nowrap text-sm font-medium transition-all flex-shrink-0 ${
                active ? `${tab.bg} ${tab.color} border-current/30 shadow-sm` : 'border-border text-muted-foreground hover:bg-muted'
              }`}>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${active ? tab.bg : 'bg-muted'}`}>
                <Icon className={`w-3.5 h-3.5 ${active ? tab.color : 'text-muted-foreground'}`} />
              </div>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* AI Chat Tab */}
      {activeTab === 'chat' && (
        <div className="h-[calc(100vh-18rem)] flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-6">
                  <div className="w-20 h-20 rounded-3xl gradient-brand flex items-center justify-center mb-4 shadow-xl">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Hi {user?.full_name?.split(' ')[0] || 'there'}! I'm EduBot 👋</h2>
                  <p className="text-muted-foreground text-sm max-w-sm mb-1">Ask me anything — math, science, history, essays, coding. I'm here to help you learn!</p>
                  <p className="text-xs text-primary font-medium mb-6">Tutor level: {EDUCATION_LEVELS.find(l => l.id === level)?.label} · {EDUCATION_LEVELS.find(l => l.id === level)?.desc}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-2xl">
                    {QUICK_PROMPTS.map(({ icon: Icon, text, color }) => (
                      <button key={text} onClick={() => sendMessage(text)}
                        className="flex items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-medium line-clamp-2">{text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <AnimatePresence initial={false}>
                    {messages.map(msg => (
                      <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'gradient-brand text-white rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                          {msg.role === 'assistant' ? (
                            <ReactMarkdown className="text-sm prose prose-sm max-w-none prose-headings:font-semibold prose-code:bg-background prose-code:px-1 prose-code:rounded">
                              {msg.content}
                            </ReactMarkdown>
                          ) : (
                            <p className="text-sm">{msg.content}</p>
                          )}
                        </div>
                        {msg.role === 'user' && (
                          <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                            <AvatarImage src={user?.avatar_url} />
                            <AvatarFallback className="gradient-brand text-white text-xs">{initials}</AvatarFallback>
                          </Avatar>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                      <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex gap-1.5 items-center">
                          {[0, 150, 300].map(d => <div key={d} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={bottomRef} />
                </>
              )}
            </div>
            <div className="border-t p-4">
              <div className="flex items-center justify-between mb-2">
                {messages.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground" onClick={() => setMessages([])}>
                    <RefreshCw className="w-3.5 h-3.5" />New Chat
                  </Button>
                )}
                <span />
              </div>
              <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
                <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask EduBot anything..." className="flex-1 rounded-full" disabled={loading} />
                <Button type="submit" disabled={loading || !input.trim()} className="rounded-full px-5 gradient-brand border-0 gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span className="hidden sm:inline">Ask</span>
                </Button>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Feature Tabs */}
      {activeTab === 'homework' && <HomeworkAssistant />}
      {activeTab === 'flashcards' && <Flashcards />}
      {activeTab === 'quiz' && <PracticeQuestions />}
      {activeTab === 'summary' && <AISummary />}
      {activeTab === 'plan' && <StudyPlan />}
      {activeTab === 'exam' && <ExamPrep />}
      {activeTab === 'courses' && <CourseRecommendations />}
    </div>
  );
}