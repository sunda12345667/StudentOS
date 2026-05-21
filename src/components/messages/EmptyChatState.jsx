import React from 'react';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EmptyChatState({ name }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full gradient-brand blur-3xl opacity-20" />
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 rounded-full gradient-brand blur-3xl opacity-20" />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Animated icon */}
        <motion.div
          className="mb-4"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <div className="w-16 h-16 rounded-3xl gradient-brand/10 border border-primary/20 flex items-center justify-center mx-auto">
            <MessageCircle className="w-8 h-8 text-primary/60" />
          </div>
        </motion.div>

        <h3 className="text-lg font-semibold mb-1">Start a conversation</h3>
        <p className="text-sm text-muted-foreground mb-2">Share notes, links, or study materials</p>
        <p className="text-xs text-muted-foreground/70">Say hi to {name.split(' ')[0]}!</p>
      </motion.div>
    </div>
  );
}