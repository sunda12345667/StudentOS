import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import ImmersiveLeft from "../components/auth/ImmersiveLeft";
import GoogleIcon from "@/components/GoogleIcon";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  return (
    <div className="min-h-screen flex bg-[#030712]">
      {/* Left — immersive showcase (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] flex-shrink-0">
        <ImmersiveLeft />
      </div>

      {/* Right — auth panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f2e] via-[#030712] to-[#0d0521]" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-purple-600/10 rounded-full blur-[60px]" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
              <span className="text-white font-black text-lg">S</span>
            </div>
            <span className="text-white font-black text-xl tracking-tight">StudentOS</span>
          </div>

          {/* Greeting */}
          <div className="mb-8">
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-blue-400/80 text-xs font-semibold tracking-[0.2em] uppercase mb-2">
              Welcome back 👋
            </motion.p>
            <h1 className="text-white font-black text-3xl tracking-tight">Sign in to<br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">StudentOS</span>
            </h1>
            <p className="text-white/40 text-sm mt-2">Your digital campus awaits.</p>
          </div>

          {/* Google button */}
          <motion.button
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            onClick={handleGoogle}
            className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.09] text-white/80 hover:text-white text-sm font-medium transition-all mb-6"
          >
            <GoogleIcon className="w-4 h-4" />
            Continue with Google
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-white/25 text-xs">or continue with email</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center text-[10px] flex-shrink-0">!</span>
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div className="relative group">
              <motion.div
                animate={{ opacity: focusedField === 'email' ? 1 : 0 }}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-sm pointer-events-none"
              />
              <div className={`relative flex items-center rounded-xl border transition-all duration-300 overflow-hidden
                ${focusedField === 'email' ? 'border-blue-500/50 bg-white/[0.06]' : 'border-white/[0.08] bg-white/[0.03]'}`}>
                <Mail className={`absolute left-4 w-4 h-4 transition-colors ${focusedField === 'email' ? 'text-blue-400' : 'text-white/25'}`} />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full h-12 bg-transparent pl-11 pr-4 text-white text-sm placeholder-white/25 outline-none"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="relative group">
              <motion.div
                animate={{ opacity: focusedField === 'password' ? 1 : 0 }}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-sm pointer-events-none"
              />
              <div className={`relative flex items-center rounded-xl border transition-all duration-300 overflow-hidden
                ${focusedField === 'password' ? 'border-blue-500/50 bg-white/[0.06]' : 'border-white/[0.08] bg-white/[0.03]'}`}>
                <Lock className={`absolute left-4 w-4 h-4 transition-colors ${focusedField === 'password' ? 'text-blue-400' : 'text-white/25'}`} />
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full h-12 bg-transparent pl-11 pr-12 text-white text-sm placeholder-white/25 outline-none"
                  required
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-4 text-white/25 hover:text-white/60 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot */}
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-blue-400/70 hover:text-blue-400 transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </motion.button>
          </form>

          {/* Register link */}
          <p className="text-center text-white/30 text-sm mt-6">
            New to StudentOS?{" "}
            <Link to="/register" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
              Create account
            </Link>
          </p>

          {/* Trust */}
          <p className="text-center text-white/15 text-[10px] mt-6">
            🔒 Secured with 256-bit encryption · Trusted by 250K+ students
          </p>
        </motion.div>
      </div>
    </div>
  );
}