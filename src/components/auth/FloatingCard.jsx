import { motion } from 'framer-motion';

export default function FloatingCard({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: [0, -8, 0] }}
      transition={{
        opacity: { duration: 0.6, delay },
        y: { duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay }
      }}
      className={`absolute ${className}`}
    >
      {children}
    </motion.div>
  );
}