import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TEXTS = [
  'AI-powered studying',
  'Campus communities',
  'Student marketplace',
  'Real-time collaboration',
  'Smart flashcards',
];

export default function RotatingText() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % TEXTS.length), 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.span key={index}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="text-white/50"
      >
        {TEXTS[index]}
      </motion.span>
    </AnimatePresence>
  );
}