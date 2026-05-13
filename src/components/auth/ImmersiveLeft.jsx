import { motion } from 'framer-motion';
import { Brain, Users, ShoppingBag, BookOpen, Bell, BadgeCheck, Zap, Star } from 'lucide-react';
import FloatingCard from './FloatingCard';
import AnimatedCounter from './AnimatedCounter';
import RotatingText from './RotatingText';

const AVATARS = [
  { initials: 'AS', color: 'from-pink-500 to-rose-500' },
  { initials: 'KM', color: 'from-blue-500 to-cyan-500' },
  { initials: 'JO', color: 'from-purple-500 to-violet-500' },
  { initials: 'TE', color: 'from-emerald-500 to-teal-500' },
];

export default function ImmersiveLeft() {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#030712] flex flex-col items-center justify-center">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f2e] via-[#030712] to-[#0d0521]" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[100px]" />
        <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 8, repeat: Infinity }}
          className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[100px]" />
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-cyan-500/15 blur-[80px]" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(99,179,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      </div>

      {[...Array(12)].map((_, i) => (
        <motion.div key={i}
          className="absolute w-1 h-1 rounded-full bg-blue-400/40"
          style={{ left: `${10 + (i * 7.5)}%`, top: `${20 + ((i * 37) % 60)}%` }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: 3 + (i * 0.4), repeat: Infinity, delay: i * 0.3 }}
        />
      ))}

      <div className="relative z-10 w-full max-w-lg px-8 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-3 mb-8">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/40">
              <span className="text-white font-black text-xl">S</span>
            </div>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-1 rounded-2xl border border-blue-400/30 border-dashed" />
          </div>
          <div className="text-left">
            <p className="text-white font-black text-xl tracking-tight">StudentOS</p>
            <p className="text-blue-400/70 text-[10px] font-medium tracking-[0.2em] uppercase">Digital Campus</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] mb-4 tracking-tight">
            Where Students<br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Learn, Connect
            </span>
            <br />& Grow
          </h1>
          <div className="text-lg text-white/50 font-medium mb-8 h-7 flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <RotatingText />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-3 gap-4 mb-10">
          {[
            { value: 250000, suffix: '+', label: 'Students', icon: Users, color: 'text-blue-400' },
            { value: 1200, suffix: '+', label: 'Campuses', icon: BookOpen, color: 'text-purple-400' },
            { value: 50000, suffix: '+', label: 'AI Sessions', icon: Brain, color: 'text-cyan-400' },
          ].map(({ value, suffix, label, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-3">
              <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
              <p className={`text-xl font-black ${color}`}><AnimatedCounter end={value} suffix={suffix} /></p>
              <p className="text-white/30 text-[10px] font-medium">{label}</p>
            </div>
          ))}
        </motion.div>

        <div className="relative h-64">
          <FloatingCard delay={0.6} className="left-0 top-0">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-3 flex items-center gap-3 w-52">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">AS</div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">Amara S.</p>
                <div className="flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3 text-blue-400" />
                  <p className="text-blue-400 text-[10px]">Verified Student</p>
                </div>
              </div>
              <div className="ml-auto flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          </FloatingCard>

          <FloatingCard delay={0.8} className="right-0 top-0">
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.07] backdrop-blur-xl p-3 w-44">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                  <Brain className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-cyan-300 text-[10px] font-semibold">AI Tutor</p>
              </div>
              <p className="text-white/60 text-[10px] leading-relaxed">"Ready to help you ace your next exam! 🎯"</p>
            </div>
          </FloatingCard>

          <FloatingCard delay={1.0} className="left-4 bottom-0">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-3 w-48">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                  <p className="text-white/60 text-[10px] font-medium">Marketplace</p>
                </div>
                <span className="text-emerald-400 text-[10px] font-bold">+₦4,200</span>
              </div>
              <p className="text-white text-xs font-semibold">Biochem Notes</p>
              <div className="flex items-center gap-1 mt-1">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />)}
              </div>
            </div>
          </FloatingCard>

          <FloatingCard delay={1.2} className="right-0 bottom-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-3 w-44">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <p className="text-amber-400 text-[10px] font-semibold">Live</p>
                <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-auto" />
              </div>
              <p className="text-white/60 text-[10px]">3 students joined your study group</p>
            </div>
          </FloatingCard>

          <div className="absolute left-1/2 -translate-x-1/2 bottom-[-10px] flex items-center gap-2">
            <div className="flex -space-x-2">
              {AVATARS.map(({ initials, color }) => (
                <div key={initials} className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} border-2 border-[#030712] flex items-center justify-center text-white text-[9px] font-bold`}>
                  {initials}
                </div>
              ))}
            </div>
            <p className="text-white/40 text-[10px]">+1.2K online now</p>
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        className="relative z-10 mt-8 flex items-center gap-4 px-6">
        {['🎓 University Verified', '🤖 AI-Powered', '🔒 256-bit Secure'].map(badge => (
          <div key={badge} className="text-[10px] text-white/30 font-medium">{badge}</div>
        ))}
      </motion.div>
    </div>
  );
}