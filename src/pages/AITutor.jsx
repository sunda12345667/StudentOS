import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Bot, Sparkles, Loader2, RefreshCw, BookOpen, Calculator, FlaskConical, Globe, Code2, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const QUICK_PROMPTS = [
  { icon: Calculator, text: "Explain quadratic equations", color: "text-blue-500 bg-blue-50" },
  { icon: FlaskConical, text: "How does photosynthesis work?", color: "text-green-500 bg-green-50" },
  { icon: Globe, text: "Summarize World War II", color: "text-amber-500 bg-amber-50" },
  { icon: Code2, text: "Explain how loops work in Python", color: "text-purple-500 bg-purple-50" },
  { icon: BookOpen, text: "Help me write an essay outline", color: "text-rose-500 bg-rose-50" },
  { icon: Music, text: "Explain music theory basics", color: "text-cyan-500 bg-cyan-50" },
];

const SUBJECTS = ['Math', 'Science', 'History', 'English', 'Programming', 'Languages', 'Arts'];

const SYSTEM_PROMPT = `You are EduBot, an enthusiastic and knowledgeable AI tutor for students of all ages. You:
- Explain concepts clearly and step-by-step
- Use examples, analogies, and real-world connections
- Encourage students and build their confidence
- Ask follow-up questions to check understanding
- Adapt to the student's level
- Use markdown formatting with headers, bullet points, and code blocks where helpful
- Keep responses engaging but concise
Always be encouraging and positive!`;

export default function AITutor() {
  const { user } = useOutletContext();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput('');
    const userMsg = { role: 'user', content: userText, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const history = messages.slice(-10).map(m => `${m.role === 'user' ? 'Student' : 'EduBot'}: ${m.content}`).join('\n');
    const contextHint = selectedSubject ? `The student is studying ${selectedSubject}. ` : '';
    const prompt = `${SYSTEM_PROMPT}\n\n${contextHint}Conversation so far:\n${history}\n\nStudent: ${userText}\n\nEduBot:`;

    const response = await base44.integrations.Core.InvokeLLM({ prompt, model: 'claude_sonnet_4_6' });
    const botMsg = { role: 'assistant', content: response, id: Date.now() + 1 };
    setMessages(prev => [...prev, botMsg]);
    setLoading(false);
  };

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center shadow-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black">AI Tutor</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">EduBot is ready to help</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted-foreground hidden sm:block">Subject:</span>
          <div className="flex gap-1 flex-wrap">
            {SUBJECTS.slice(0, 4).map(s => (
              <Badge
                key={s}
                onClick={() => setSelectedSubject(selectedSubject === s ? null : s)}
                className={`cursor-pointer text-xs transition-all ${selectedSubject === s ? 'gradient-brand text-white border-0' : 'bg-secondary text-secondary-foreground hover:bg-accent'}`}
              >
                {s}
              </Badge>
            ))}
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMessages([])}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-20 h-20 rounded-3xl gradient-brand flex items-center justify-center mb-4 shadow-xl animate-float">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2">Hi, I'm EduBot! 👋</h2>
              <p className="text-muted-foreground text-sm max-w-sm mb-6">
                I'm your personal AI tutor. Ask me anything — from math problems to essay help, I'm here to make learning fun!
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-lg">
                {QUICK_PROMPTS.map(({ icon: Icon, text, color }) => (
                  <button
                    key={text}
                    onClick={() => sendMessage(text)}
                    className="flex items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                  >
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
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'gradient-brand text-white rounded-tr-sm'
                        : 'bg-muted rounded-tl-sm'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown className="text-sm prose prose-sm max-w-none prose-headings:text-sm prose-headings:font-semibold prose-code:bg-background prose-code:px-1 prose-code:rounded prose-pre:bg-background">
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
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask EduBot anything..."
              className="flex-1 rounded-full border-border"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()} className="rounded-full px-5 gradient-brand border-0 gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="hidden sm:inline">Ask</span>
            </Button>
          </form>
          <p className="text-[10px] text-center text-muted-foreground mt-2">EduBot can make mistakes. Verify important information.</p>
        </div>
      </Card>
    </div>
  );
}