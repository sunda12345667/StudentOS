import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, GraduationCap, BookOpen, CheckCircle2, Upload, FileCheck, SkipForward } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/components/ui/use-toast";
import ImmersiveLeft from "../components/auth/ImmersiveLeft";
import GoogleIcon from "@/components/GoogleIcon";

function PasswordStrength({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i < strength ? colors[strength - 1] : 'bg-white/10'}`} />
        ))}
      </div>
      <p className={`text-[10px] font-medium ${strength >= 3 ? 'text-emerald-400' : strength >= 2 ? 'text-yellow-400' : 'text-red-400'}`}>
        {labels[strength - 1] || 'Weak'} password
      </p>
    </div>
  );
}

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  // Verification doc upload state
  const [docFile, setDocFile] = useState(null);
  const [institution, setInstitution] = useState("");
  const [verifyNotes, setVerifyNotes] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
        try {
          await base44.entities.UserProfile.create({ user_email: email, role });
        } catch (_) { /* profile may already exist */ }
      }
      // Show document upload step
      setShowOtp(false);
      setShowVerification(true);
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDoc = async () => {
    if (!docFile) { toast({ title: "No file selected", description: "Please choose a document to upload." }); return; }
    setUploadLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: docFile });
      await base44.entities.VerificationRequest.create({
        user_email: email,
        user_name: email.split('@')[0],
        role,
        document_url: file_url,
        document_name: docFile.name,
        institution: institution.trim(),
        notes: verifyNotes.trim(),
        status: 'pending',
      });
      toast({ title: "Verification submitted!", description: "An admin will review your document shortly." });
    } catch (e) {
      toast({ title: "Upload failed", description: e.message });
    } finally {
      setUploadLoading(false);
      window.location.href = "/";
    }
  };

  const handleResend = async () => {
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "Code sent", description: "Check your email for the new code." });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  const handleGoogle = () => base44.auth.loginWithProvider("google", "/");

  const inputClass = (field) => `relative flex items-center rounded-xl border transition-all duration-300 overflow-hidden
    ${focusedField === field ? 'border-blue-500/50 bg-white/[0.06]' : 'border-white/[0.08] bg-white/[0.03]'}`;

  // Document upload / verification screen
  if (showVerification) {
    return (
      <div className="min-h-screen flex bg-[#030712]">
        <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] flex-shrink-0"><ImmersiveLeft /></div>
        <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f2e] via-[#030712] to-[#0d0521]" />
          <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px]" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
            className="relative z-10 w-full max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
              {role === 'teacher' ? <BookOpen className="w-7 h-7 text-emerald-400" /> : <GraduationCap className="w-7 h-7 text-emerald-400" />}
            </div>
            <h2 className="text-white font-black text-3xl mb-1 tracking-tight text-center">Verify Your Status</h2>
            <p className="text-white/40 text-sm mb-6 text-center">
              Upload a document to get a <span className="text-emerald-400 font-medium">verified badge</span> as a {role === 'teacher' ? 'Lecturer' : 'Student'}.
            </p>

            <div className="space-y-3">
              {/* Institution */}
              <div>
                <label className="text-white/50 text-xs mb-1 block">Institution / School name</label>
                <input
                  type="text"
                  placeholder="e.g. University of Lagos"
                  value={institution}
                  onChange={e => setInstitution(e.target.value)}
                  className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-white text-sm placeholder-white/25 outline-none focus:border-blue-500/40 transition-colors"
                />
              </div>

              {/* Document upload */}
              <div>
                <label className="text-white/50 text-xs mb-1 block">
                  {role === 'teacher' ? 'Staff ID / Appointment letter' : 'Student ID / Admission letter'}
                </label>
                <label className={`flex flex-col items-center justify-center gap-2 w-full h-28 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  docFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden"
                    onChange={e => setDocFile(e.target.files?.[0] || null)} />
                  {docFile ? (
                    <>
                      <FileCheck className="w-6 h-6 text-emerald-400" />
                      <p className="text-emerald-400 text-xs font-medium text-center px-4 truncate max-w-full">{docFile.name}</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-white/30" />
                      <p className="text-white/30 text-xs text-center">Click to upload PDF, JPG, PNG or DOC</p>
                    </>
                  )}
                </label>
              </div>

              {/* Optional notes */}
              <div>
                <label className="text-white/50 text-xs mb-1 block">Additional notes (optional)</label>
                <input
                  type="text"
                  placeholder="Any extra info for the admin..."
                  value={verifyNotes}
                  onChange={e => setVerifyNotes(e.target.value)}
                  className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-white text-sm placeholder-white/25 outline-none focus:border-blue-500/40 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-5">
              <motion.button
                onClick={handleUploadDoc}
                disabled={uploadLoading || !docFile}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {uploadLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading...</> : <><Upload className="w-4 h-4" />Submit for Verification</>}
              </motion.button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full h-11 rounded-xl border border-white/[0.08] text-white/40 hover:text-white/70 text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <SkipForward className="w-4 h-4" />Skip for now
              </button>
            </div>
            <p className="text-white/20 text-[10px] text-center mt-4">You can submit verification later from your profile settings.</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // OTP screen
  if (showOtp) {
    return (
      <div className="min-h-screen flex bg-[#030712]">
        <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] flex-shrink-0"><ImmersiveLeft /></div>
        <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f2e] via-[#030712] to-[#0d0521]" />
          <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
            className="relative z-10 w-full max-w-sm text-center">
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-7 h-7 text-cyan-400" />
            </motion.div>
            <h2 className="text-white font-black text-3xl mb-2 tracking-tight">Verify Email</h2>
            <p className="text-white/40 text-sm mb-8">
              We sent a 6-digit code to<br />
              <span className="text-blue-400 font-medium">{email}</span>
            </p>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </motion.div>
            )}
            <div className="flex justify-center mb-6">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
                <InputOTPGroup className="gap-2">
                  {[0,1,2,3,4,5].map(i => (
                    <InputOTPSlot key={i} index={i}
                      className="w-11 h-13 rounded-xl border-white/10 bg-white/[0.04] text-white text-lg font-bold" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <motion.button onClick={handleVerify} disabled={loading || otpCode.length < 6}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-4">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Verifying...</> : <><CheckCircle2 className="w-4 h-4" />Verify & Enter Campus</>}
            </motion.button>
            <p className="text-white/30 text-sm">
              Didn't receive it?{" "}
              <button onClick={handleResend} className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
                Resend code
              </button>
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#030712]">
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] flex-shrink-0"><ImmersiveLeft /></div>

      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f2e] via-[#030712] to-[#0d0521]" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-purple-600/10 rounded-full blur-[60px]" />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
              <span className="text-white font-black text-lg">S</span>
            </div>
            <span className="text-white font-black text-xl tracking-tight">StudentOS</span>
          </div>

          <div className="mb-8">
            <p className="text-purple-400/80 text-xs font-semibold tracking-[0.2em] uppercase mb-2">Join the movement 🚀</p>
            <h1 className="text-white font-black text-3xl tracking-tight">Create your<br />
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">campus account</span>
            </h1>
            <p className="text-white/40 text-sm mt-2">Join 250,000+ students worldwide.</p>
          </div>

          {/* Google */}
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleGoogle}
            className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.09] text-white/80 hover:text-white text-sm font-medium transition-all mb-6">
            <GoogleIcon className="w-4 h-4" />Continue with Google
          </motion.button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-white/25 text-xs">or sign up with email</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center text-[10px] flex-shrink-0">!</span>
              {error}
            </motion.div>
          )}

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { value: 'student', label: 'Student', icon: GraduationCap, desc: "I'm here to learn" },
              { value: 'teacher', label: 'Lecturer', icon: BookOpen, desc: "I'm here to teach" },
            ].map(({ value, label, icon: Icon, desc }) => (
              <button key={value} type="button" onClick={() => setRole(value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 ${
                  role === value
                    ? 'border-purple-500/60 bg-purple-500/10 text-white'
                    : 'border-white/[0.08] bg-white/[0.03] text-white/40 hover:border-white/20 hover:text-white/60'
                }`}>
                <Icon className={`w-5 h-5 ${role === value ? 'text-purple-400' : ''}`} />
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-[10px] opacity-60">{desc}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div className="relative">
              <motion.div animate={{ opacity: focusedField === 'email' ? 1 : 0 }}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-sm pointer-events-none" />
              <div className={inputClass('email')}>
                <Mail className={`absolute left-4 w-4 h-4 transition-colors ${focusedField === 'email' ? 'text-blue-400' : 'text-white/25'}`} />
                <input type="email" autoComplete="email" placeholder="Student email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                  className="w-full h-12 bg-transparent pl-11 pr-4 text-white text-sm placeholder-white/25 outline-none" required />
              </div>
            </div>

            {/* Password */}
            <div className="relative">
              <motion.div animate={{ opacity: focusedField === 'password' ? 1 : 0 }}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-sm pointer-events-none" />
              <div className={inputClass('password')}>
                <Lock className={`absolute left-4 w-4 h-4 transition-colors ${focusedField === 'password' ? 'text-blue-400' : 'text-white/25'}`} />
                <input type={showPass ? 'text' : 'password'} autoComplete="new-password" placeholder="Create password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                  className="w-full h-12 bg-transparent pl-11 pr-12 text-white text-sm placeholder-white/25 outline-none" required />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-4 text-white/25 hover:text-white/60 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {/* Confirm */}
            <div className="relative">
              <motion.div animate={{ opacity: focusedField === 'confirm' ? 1 : 0 }}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-sm pointer-events-none" />
              <div className={inputClass('confirm')}>
                <Lock className={`absolute left-4 w-4 h-4 transition-colors ${focusedField === 'confirm' ? 'text-blue-400' : 'text-white/25'}`} />
                <input type="password" autoComplete="new-password" placeholder="Confirm password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField('confirm')} onBlur={() => setFocusedField(null)}
                  className="w-full h-12 bg-transparent pl-11 pr-4 text-white text-sm placeholder-white/25 outline-none" required />
                {confirmPassword && password === confirmPassword && (
                  <CheckCircle2 className="absolute right-4 w-4 h-4 text-emerald-400" />
                )}
              </div>
            </div>

            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.99 }}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account...</> : <>Join StudentOS <ArrowRight className="w-4 h-4" /></>}
            </motion.button>
          </form>

          <p className="text-center text-white/30 text-sm mt-6">
            Already a student?{" "}
            <Link to="/login" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">Sign in</Link>
          </p>
          <p className="text-center text-white/15 text-[10px] mt-4">
            By joining, you agree to our Terms & Privacy Policy
          </p>
        </motion.div>
      </div>
    </div>
  );
}