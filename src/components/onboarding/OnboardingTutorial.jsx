import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, ArrowLeft, Rss, UserCircle, MessageCircle, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    id: 'welcome',
    icon: '🎓',
    title: 'Welcome to StudentOS!',
    description: "You're joining thousands of students. Let's show you around in under a minute.",
    cta: "Let's Go",
    color: 'from-violet-600 to-indigo-600',
    nav: null,
  },
  {
    id: 'feed',
    icon: Rss,
    title: 'Your Feed',
    description: 'The Feed is your home base. See posts from peers, share updates, react to content, and follow hashtags that match your interests.',
    tip: '💡 Tap "Following" to see only posts from people you follow.',
    color: 'from-blue-500 to-cyan-500',
    nav: '/',
  },
  {
    id: 'profile',
    icon: UserCircle,
    title: 'Set Up Your Profile',
    description: 'Add your school, department, bio, and a profile photo so classmates can find and connect with you.',
    tip: '💡 A complete profile gets 3× more connections.',
    color: 'from-violet-500 to-purple-600',
    nav: null, // injected dynamically with user email
  },
  {
    id: 'messages',
    icon: MessageCircle,
    title: 'Messages & Chat',
    description: "Send direct messages to any student or join campus group chats. Tap someone's profile and hit 'Message' to start.",
    tip: '💡 You can also message from the bottom nav on mobile.',
    color: 'from-emerald-500 to-teal-500',
    nav: '/messages',
  },
  {
    id: 'marketplace',
    icon: ShoppingBag,
    title: 'Marketplace',
    description: 'Buy and sell textbooks, notes, past questions, and gadgets. List an item in under 60 seconds.',
    tip: '💡 Digital files get delivered instantly after payment.',
    color: 'from-amber-500 to-orange-500',
    nav: '/marketplace',
  },
  {
    id: 'done',
    icon: CheckCircle2,
    title: "You're all set! 🎉",
    description: "That's everything you need to get started. Explore at your own pace — we're glad you're here.",
    cta: 'Start Exploring',
    color: 'from-green-500 to-emerald-600',
    nav: '/',
  },
];

const STORAGE_KEY = 'studentos_onboarding_done';

export default function OnboardingTutorial({ user }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.email) return;
    const done = localStorage.getItem(`${STORAGE_KEY}_${user.email}`);
    if (!done) {
      // Small delay so the app renders first
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, [user?.email]);

  const dismiss = () => {
    setVisible(false);
    if (user?.email) localStorage.setItem(`${STORAGE_KEY}_${user.email}`, '1');
  };

  const current = STEPS[step];

  const handleNext = () => {
    // Navigate to the relevant page for context
    const nextStep = STEPS[step + 1];
    if (nextStep?.nav) {
      const nav = nextStep.id === 'profile' ? `/profile/${user?.email}` : nextStep.nav;
      navigate(nav);
    }
    setStep(s => s + 1);
  };

  const handlePrev = () => {
    const prevStep = STEPS[step - 1];
    if (prevStep?.nav) {
      const nav = prevStep.id === 'profile' ? `/profile/${user?.email}` : prevStep.nav;
      navigate(nav);
    }
    setStep(s => s - 1);
  };

  const handleFinish = () => {
    navigate('/');
    dismiss();
  };

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const Icon = typeof current.icon !== 'string' ? current.icon : null;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Card */}
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-sm bg-card rounded-3xl shadow-2xl overflow-hidden">

              {/* Gradient header */}
              <div className={`bg-gradient-to-br ${current.color} p-6 text-white relative`}>
                <button
                  onClick={dismiss}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                  {typeof current.icon === 'string'
                    ? <span className="text-3xl">{current.icon}</span>
                    : <Icon className="w-7 h-7 text-white" />
                  }
                </div>

                <h2 className="text-xl font-black leading-tight">{current.title}</h2>

                {/* Progress dots */}
                <div className="flex gap-1.5 mt-3">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === step ? 'w-5 bg-white' : i < step ? 'w-1.5 bg-white/60' : 'w-1.5 bg-white/25'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>

                {current.tip && (
                  <div className="bg-muted rounded-xl px-4 py-3 text-xs text-foreground/80 leading-relaxed">
                    {current.tip}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-1">
                  {!isFirst && !isLast && (
                    <Button variant="outline" size="sm" onClick={handlePrev} className="gap-1 rounded-xl">
                      <ArrowLeft className="w-3.5 h-3.5" />Back
                    </Button>
                  )}

                  {isLast ? (
                    <Button onClick={handleFinish} className="flex-1 gradient-brand border-0 rounded-xl font-bold gap-2">
                      {current.cta || 'Done'} 🚀
                    </Button>
                  ) : (
                    <Button onClick={isFirst ? handleNext : handleNext} className={`flex-1 bg-gradient-to-r ${current.color} border-0 text-white rounded-xl font-bold gap-2 hover:opacity-90`}>
                      {current.cta || 'Next'} <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Skip */}
                {!isLast && (
                  <button onClick={dismiss} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                    Skip tutorial
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}