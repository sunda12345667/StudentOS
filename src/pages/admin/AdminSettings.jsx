import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Percent, DollarSign, Bell, Shield, Palette, Save, Loader2, FileText, Send, CalendarDays, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const Section = ({ icon: Icon, title, subtitle, children, color = 'blue' }) => {
  const iconColors = {
    blue: 'bg-blue-500/15 text-blue-400',
    purple: 'bg-purple-500/15 text-purple-400',
    green: 'bg-emerald-500/15 text-emerald-400',
    amber: 'bg-amber-500/15 text-amber-400',
    pink: 'bg-pink-500/15 text-pink-400',
  };
  return (
    <div className="rounded-2xl border border-white/8 bg-[#0d1220] overflow-hidden">
      <div className="flex items-center gap-3 p-5 border-b border-white/8">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColors[color]}`}>
          <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">{title}</h3>
          {subtitle && <p className="text-white/40 text-xs">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
};

const Field = ({ label, hint, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-white/5 last:border-0">
    <div className="min-w-0">
      <p className="text-white text-sm font-medium">{label}</p>
      {hint && <p className="text-white/30 text-xs mt-0.5">{hint}</p>}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

const Toggle = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-white/15'}`}>
    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'left-6' : 'left-1'}`} />
  </button>
);

export default function AdminSettings() {
  const [commission, setCommission] = useState('10');
  const [minWithdrawal, setMinWithdrawal] = useState('5000');
  const [feedAdPrice, setFeedAdPrice] = useState('50000');
  const [sidebarAdPrice, setSidebarAdPrice] = useState('30000');
  const [videoAdPrice, setVideoAdPrice] = useState('80000');
  const [commissionActive, setCommissionActive] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [revenueAlerts, setRevenueAlerts] = useState(true);
  const [newAdAlerts, setNewAdAlerts] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingWeekly, setSendingWeekly] = useState(false);
  const [sendingMonthly, setSendingMonthly] = useState(false);

  // Load existing config on mount
  useEffect(() => {
    base44.entities.CommissionConfig.list().then(list => {
      if (list.length) {
        const cfg = list[0];
        if (cfg.rate != null) setCommission(String(cfg.rate));
        if (cfg.min_withdrawal_amount != null) setMinWithdrawal(String(cfg.min_withdrawal_amount));
        if (cfg.is_active != null) setCommissionActive(cfg.is_active);
      }
    }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const list = await base44.entities.CommissionConfig.list().catch(() => []);
      const rate = Number(commission);
      const min_withdrawal_amount = Number(minWithdrawal) || 5000;
      if (list.length) {
        await base44.entities.CommissionConfig.update(list[0].id, { rate, is_active: commissionActive, min_withdrawal_amount });
      } else {
        await base44.entities.CommissionConfig.create({ rate, is_active: commissionActive, min_withdrawal_amount });
      }
      toast.success('Settings saved successfully!');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const sendReport = async (type) => {
    const setter = type === 'weekly' ? setSendingWeekly : setSendingMonthly;
    setter(true);
    try {
      await base44.functions.invoke('sendPerformanceReport', { type });
      toast.success(`${type === 'weekly' ? 'Weekly' : 'Monthly'} report sent to owner email!`);
    } catch (e) {
      toast.error(`Failed to send report: ${e.message}`);
    } finally {
      setter(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Commission */}
      <Section icon={Percent} title="Commission Settings" subtitle="Platform fee per marketplace transaction" color="purple">
        <Field label="Commission Rate" hint="% deducted from every marketplace sale">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={commission}
              onChange={e => setCommission(e.target.value)}
              className="w-20 text-center bg-white/5 border-white/10 text-white font-bold"
              min="0" max="50"
            />
            <span className="text-white/60">%</span>
          </div>
        </Field>
        <Field label="Commission Active" hint="Toggle to pause all commission collection">
          <Toggle value={commissionActive} onChange={setCommissionActive} />
        </Field>
        <Field label="Minimum Withdrawal Amount" hint="Users cannot withdraw below this amount">
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-sm">₦</span>
            <Input
              type="number"
              value={minWithdrawal}
              onChange={e => setMinWithdrawal(e.target.value)}
              className="w-28 bg-white/5 border-white/10 text-white font-bold"
              min="100"
            />
          </div>
        </Field>
      </Section>

      {/* Ad Pricing */}
      <Section icon={DollarSign} title="Advertisement Pricing" subtitle="Base prices for ad placements" color="green">
        <Field label="Feed Ad (per campaign)" hint="Full feed placement">
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-sm">₦</span>
            <Input type="number" value={feedAdPrice} onChange={e => setFeedAdPrice(e.target.value)} className="w-28 bg-white/5 border-white/10 text-white" />
          </div>
        </Field>
        <Field label="Sidebar Ad (per campaign)" hint="Right sidebar placement">
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-sm">₦</span>
            <Input type="number" value={sidebarAdPrice} onChange={e => setSidebarAdPrice(e.target.value)} className="w-28 bg-white/5 border-white/10 text-white" />
          </div>
        </Field>
        <Field label="Video Ad (per campaign)" hint="Reels & video placements">
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-sm">₦</span>
            <Input type="number" value={videoAdPrice} onChange={e => setVideoAdPrice(e.target.value)} className="w-28 bg-white/5 border-white/10 text-white" />
          </div>
        </Field>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notification Settings" subtitle="Configure alert preferences" color="amber">
        <Field label="Email Alerts" hint="Receive platform alerts via email">
          <Toggle value={emailAlerts} onChange={setEmailAlerts} />
        </Field>
        <Field label="Revenue Alerts" hint="Alert when daily earnings threshold is met">
          <Toggle value={revenueAlerts} onChange={setRevenueAlerts} />
        </Field>
        <Field label="New Ad Alerts" hint="Notify when a new campaign is submitted">
          <Toggle value={newAdAlerts} onChange={setNewAdAlerts} />
        </Field>
      </Section>

      {/* Security */}
      <Section icon={Shield} title="Security Settings" subtitle="Admin account security" color="pink">
        <Field label="Two-Factor Authentication" hint="Add extra security to your admin account">
          <Toggle value={twoFactor} onChange={setTwoFactor} />
        </Field>
        <Field label="Admin Password" hint="Change your owner account password">
          <Button size="sm" variant="outline" className="border-white/20 text-white/60 hover:bg-white/10 text-xs">
            Change Password
          </Button>
        </Field>
        <Field label="Session Timeout" hint="Auto-logout after inactivity">
          <select className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5">
            <option className="bg-[#0d1220]">30 minutes</option>
            <option className="bg-[#0d1220]">1 hour</option>
            <option className="bg-[#0d1220]">4 hours</option>
            <option className="bg-[#0d1220]">Never</option>
          </select>
        </Field>
      </Section>

      {/* Branding */}
      <Section icon={Palette} title="Platform Branding" subtitle="Customize platform appearance" color="blue">
        <Field label="Platform Name">
          <Input defaultValue="EduVerse" className="w-44 bg-white/5 border-white/10 text-white" />
        </Field>
        <Field label="Primary Currency" hint="Default currency for all transactions">
          <select className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5">
            <option className="bg-[#0d1220]">NGN (₦)</option>
            <option className="bg-[#0d1220]">USD ($)</option>
            <option className="bg-[#0d1220]">GHS (₵)</option>
          </select>
        </Field>
      </Section>

      {/* Automated Reports */}
      <Section icon={FileText} title="Performance Reports" subtitle="Automated PDF reports sent to your registered owner email" color="blue">
        <Field label="Weekly Report" hint="Sent every Monday at 8:00 AM automatically">
          <Button
            size="sm"
            onClick={() => sendReport('weekly')}
            disabled={sendingWeekly}
            className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 gap-1.5 text-xs"
          >
            {sendingWeekly ? <Loader2 className="w-3 h-3 animate-spin" /> : <CalendarDays className="w-3 h-3" />}
            {sendingWeekly ? 'Sending...' : 'Send Now'}
          </Button>
        </Field>
        <Field label="Monthly Report" hint="Sent on the 1st of every month at 8:00 AM automatically">
          <Button
            size="sm"
            onClick={() => sendReport('monthly')}
            disabled={sendingMonthly}
            className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 gap-1.5 text-xs"
          >
            {sendingMonthly ? <Loader2 className="w-3 h-3 animate-spin" /> : <Calendar className="w-3 h-3" />}
            {sendingMonthly ? 'Sending...' : 'Send Now'}
          </Button>
        </Field>
        <div className="mt-2 p-3 rounded-xl bg-white/3 border border-white/5">
          <p className="text-white/30 text-xs">📧 Reports are sent to the <span className="text-blue-400/80">OWNER_EMAIL</span> secret. Ensure it matches your registered app user email.</p>
        </div>
      </Section>

      {/* Save */}
      <Button onClick={save} disabled={saving} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 h-11 font-bold text-base gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Saving...' : 'Save All Settings'}
      </Button>
    </div>
  );
}