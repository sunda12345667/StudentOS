import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Lock, Mail, Megaphone } from 'lucide-react';

export default function AdvertiserLogin({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      // Verify they are a registered advertiser
      const list = await base44.entities.Advertiser.filter({ contact_email: email });
      if (list.length === 0) {
        await base44.auth.logout();
        setError('No advertiser account found for this email. Please contact support.');
        setLoading(false);
        return;
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060911] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-white font-black text-2xl">EduVerse Ads</h1>
          <p className="text-white/40 text-sm mt-1">Advertiser Portal</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d1220] p-6 space-y-4">
          <h2 className="text-white font-semibold text-base">Sign in to your account</h2>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="text-white/40 text-xs mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input type="email" required placeholder="you@company.com"
                  className="bg-white/5 border-white/10 text-white pl-9 placeholder-white/20"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input type="password" required placeholder="••••••••"
                  className="bg-white/5 border-white/10 text-white pl-9 placeholder-white/20"
                  value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 border-0 h-11 gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-white/20 text-xs text-center">
            Don't have an account? Contact the platform admin to get registered as an advertiser.
          </p>
        </div>
      </div>
    </div>
  );
}