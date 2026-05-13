import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Layers, ChevronLeft, ChevronRight, RotateCcw, Shuffle, Check, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Flashcards() {
  const [topic, setTopic] = useState('');
  const [cards, setCards] = useState([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [known, setKnown] = useState([]);
  const [unknown, setUnknown] = useState([]);
  const [done, setDone] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setCards([]); setKnown([]); setUnknown([]); setCurrent(0); setDone(false); setFlipped(false);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate 10 educational flashcards about: "${topic}". Return a JSON array of objects with "front" (question/term) and "back" (answer/definition). Make them progressively more challenging. Keep answers concise (1-3 sentences).`,
      response_json_schema: {
        type: 'object',
        properties: { cards: { type: 'array', items: { type: 'object', properties: { front: { type: 'string' }, back: { type: 'string' } } } } }
      }
    });
    setCards(res.cards || []);
    setLoading(false);
  };

  const mark = (isKnown) => {
    if (isKnown) setKnown(p => [...p, current]);
    else setUnknown(p => [...p, current]);
    setFlipped(false);
    setTimeout(() => {
      if (current + 1 >= cards.length) setDone(true);
      else setCurrent(c => c + 1);
    }, 200);
  };

  const restart = () => { setCurrent(0); setFlipped(false); setKnown([]); setUnknown([]); setDone(false); };
  const shuffle = () => { setCards(c => [...c].sort(() => Math.random() - 0.5)); restart(); };

  if (done) {
    return (
      <div className="max-w-xl mx-auto">
        <Card className="p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-black mb-2">Session Complete!</h2>
          <p className="text-muted-foreground mb-6">You reviewed {cards.length} flashcards</p>
          <div className="flex justify-center gap-6 mb-6">
            <div className="text-center">
              <p className="text-3xl font-black text-green-600">{known.length}</p>
              <p className="text-sm text-muted-foreground">Knew it ✅</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-red-500">{unknown.length}</p>
              <p className="text-sm text-muted-foreground">Review 🔁</p>
            </div>
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={restart} variant="outline" className="gap-2"><RotateCcw className="w-4 h-4" />Restart All</Button>
            {unknown.length > 0 && (
              <Button className="gradient-brand border-0 gap-2" onClick={() => {
                setCards(unknown.map(i => cards[i])); restart();
              }}>
                <Layers className="w-4 h-4" />Review Missed ({unknown.length})
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {cards.length === 0 ? (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
              <Layers className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="font-bold">AI Flashcards</h2>
              <p className="text-xs text-muted-foreground">Generate study cards for any topic</p>
            </div>
          </div>
          <Textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="Enter a topic (e.g. Mitosis, French Revolution, Python basics)..." rows={3} className="mb-3" />
          <Button onClick={generate} disabled={loading || !topic.trim()} className="w-full gradient-brand border-0 gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Generating Flashcards...' : 'Generate 10 Flashcards'}
          </Button>
        </Card>
      ) : (
        <>
          {/* Progress */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{current + 1} / {cards.length}</Badge>
              <div className="flex gap-1">
                {cards.map((_, i) => (
                  <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i < current ? (known.includes(i) ? 'bg-green-500' : 'bg-red-400') : i === current ? 'bg-primary' : 'bg-muted'}`} />
                ))}
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={shuffle}><Shuffle className="w-3.5 h-3.5" /></Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setCards([])}><RotateCcw className="w-3.5 h-3.5 mr-1" />New Topic</Button>
            </div>
          </div>

          {/* Card */}
          <div className="perspective-1000" style={{ perspective: '1000px' }}>
            <motion.div
              key={current + '-' + flipped}
              initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <Card
                className={`min-h-[220px] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:shadow-lg select-none ${flipped ? 'bg-primary/5 border-primary/30' : ''}`}
                onClick={() => setFlipped(f => !f)}
              >
                <Badge className={`mb-4 ${flipped ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground'}`}>
                  {flipped ? '💡 Answer' : '❓ Question'}
                </Badge>
                <p className={`text-lg font-semibold leading-relaxed ${flipped ? 'text-primary' : ''}`}>
                  {flipped ? cards[current]?.back : cards[current]?.front}
                </p>
                {!flipped && <p className="text-xs text-muted-foreground mt-4">Tap to reveal answer</p>}
              </Card>
            </motion.div>
          </div>

          {/* Actions */}
          {flipped ? (
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => mark(false)} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 gap-2 h-12">
                <X className="w-5 h-5" />Still Learning
              </Button>
              <Button onClick={() => mark(true)} className="bg-green-600 hover:bg-green-700 text-white gap-2 h-12 border-0">
                <Check className="w-5 h-5" />Got It!
              </Button>
            </div>
          ) : (
            <Button onClick={() => setFlipped(true)} className="w-full gradient-brand border-0 h-12 gap-2">
              <Layers className="w-4 h-4" />Reveal Answer
            </Button>
          )}
        </>
      )}
    </div>
  );
}