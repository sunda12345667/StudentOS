import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import ImmersiveLeft from "../components/auth/ImmersiveLeft";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Always show success
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#030712]">
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] flex-shrink-0"><ImmersiveLeft /></div>
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f2e] via-[#030712] to-[#0d0521]" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]" />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }} className="relative z-10 w-full max-w-sm">

          <div className="flex items-center justify-center gap-2.5 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
              <span className="text-white font-black text-lg">S</span>
            </div>
            <span className="text-white font-black text-xl tracking-tight">StudentOS</span>
          </div>

          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-white font-black text-2xl mb-3">Check your inbox</h2>
              <p className="text-white/40 text-sm mb-6">
                If an account exists for <span className="text-blue-400">{email}</span>, you'll receive a reset link shortly.
              </p>
              <Link to="/login" className="inline-flex items-center gap-2 text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors">
                <ArrowLeft className="w-4 h-4" />Back to sign in
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="mb-8">
                <p className="text-blue-400/80 text-xs font-semibold tracking-[0.2em] uppercase mb-2">Account recovery</p>
                <h1 className="text-white font-black text-3xl tracking-tight mb-2">Reset your<br />
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">password</span>
                </h1>
                <p className="text-white/40 text-sm">We'll send you a secure reset link.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <motion.div animate={{ opacity: focused ? 1 : 0 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 blur-sm pointer-events-none" />
                  <div className={`relative flex items-center rounded-xl border transition-all duration-300 overflow-hidden
                    ${focused ? 'border-blue-500/50 bg-white/[0.06]' : 'border-white/[0.08] bg-white/[0.03]'}`}>
                    <Mail className={`absolute left-4 w-4 h-4 transition-colors ${focused ? 'text-blue-400' : 'text-white/25'}`} />
                    <input type="email" autoComplete="email" autoFocus placeholder="Your email address"
                      value={email} onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                      className="w-full h-12 bg-transparent pl-11 pr-4 text-white text-sm placeholder-white/25 outline-none" required />
                  </div>
                </div>

                <motion.button type="submit" disabled={loading}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-60 transition-all">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</> : <>Send reset link <ArrowRight className="w-4 h-4" /></>}
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-white/30 text-sm hover:text-white/60 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />Back to sign in
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}