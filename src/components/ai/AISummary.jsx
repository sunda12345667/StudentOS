import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Copy, Check, Wand2, AlignLeft, List, Hash } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

const FORMATS = [
  { id: 'summary', label: '📝 Summary', desc: 'Concise paragraph summary' },
  { id: 'bullets', label: '• Key Points', desc: 'Bullet-point highlights' },
  { id: 'simplify', label: '🧒 Simplify', desc: 'Explain like I\'m 12' },
  { id: 'keywords', label: '#️⃣ Keywords', desc: 'Key terms & definitions' },
];

export default function AISummary() {
  const [text, setText] = useState('');
  const [format, setFormat] = useState('summary');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const run = async () => {
    if (!text.trim()) return;
    setLoading(true); setResult(null);
    const prompts = {
      summary: `Write a clear, concise summary of the following text in 2-4 paragraphs. Capture all main ideas:\n\n${text}`,
      bullets: `Extract and organize the key points from the following text into a well-structured bullet list with main points and sub-points:\n\n${text}`,
      simplify: `Rewrite the following text so that a 12-year-old can easily understand it. Use simple words and relatable examples:\n\n${text}`,
      keywords: `Extract all important keywords, concepts, and terms from the following text. For each, provide a brief definition (1 sentence). Format as: **Term**: definition\n\n${text}`,
    };
    const response = await base44.integrations.Core.InvokeLLM({ prompt: prompts[format], model: 'claude_sonnet_4_6' });
    setResult(response);
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-bold">AI Summaries & Notes</h2>
            <p className="text-xs text-muted-foreground">Paste any text to summarize, simplify, or extract key points</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {FORMATS.map(f => (
            <button key={f.id} onClick={() => setFormat(f.id)}
              className={`p-3 rounded-xl border text-left transition-all ${format === f.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}>
              <p className="text-xs font-semibold">{f.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</p>
            </button>
          ))}
        </div>

        <Textarea value={text} onChange={e => setText(e.target.value)}
          placeholder="Paste your notes, textbook excerpt, article, or any text here..." rows={6} className="mb-3" />

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{text.length} characters</p>
          <Button onClick={run} disabled={loading || !text.trim()} className="gradient-brand border-0 gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {loading ? 'Processing...' : 'Generate'}
          </Button>
        </div>
      </Card>

      {loading && (
        <Card className="p-5 flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm">Analyzing your text...</span>
        </Card>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg gradient-brand flex items-center justify-center">
                  <Wand2 className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="font-semibold text-sm">{FORMATS.find(f => f.id === format)?.label}</p>
              </div>
              <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={copy}>
                {copied ? <><Check className="w-3.5 h-3.5 text-green-600" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
              </Button>
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