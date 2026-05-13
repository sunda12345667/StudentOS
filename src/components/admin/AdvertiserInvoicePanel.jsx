import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { FileText, Send, Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CFG = {
  sent:    { label: 'Sent',    class: 'bg-blue-400/10 text-blue-400',    icon: Send },
  paid:    { label: 'Paid',    class: 'bg-emerald-400/10 text-emerald-400', icon: CheckCircle2 },
  overdue: { label: 'Overdue', class: 'bg-red-400/10 text-red-400',      icon: AlertCircle },
};

export default function AdvertiserInvoicePanel({ advertiser }) {
  const [invoices, setInvoices] = useState([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Invoice.filter({ advertiser_id: advertiser.id }, '-created_date', 10)
      .then(setInvoices)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [advertiser.id]);

  const sendInvoice = async () => {
    setSending(true);
    try {
      const res = await base44.functions.invoke('generateInvoice', {
        advertiser_id: advertiser.id,
        trigger: 'manual',
        tax_rate: 0,
      });
      if (res.data?.results?.length > 0) {
        toast.success(`Invoice sent to ${advertiser.contact_email}!`);
        // Refresh invoices
        const updated = await base44.entities.Invoice.filter({ advertiser_id: advertiser.id }, '-created_date', 10);
        setInvoices(updated);
      } else {
        toast.info('No billable spend found for this advertiser.');
      }
    } catch (e) {
      toast.error(`Failed: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-3 border-t border-white/8 pt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-white/40 text-[10px] uppercase tracking-wider flex items-center gap-1">
          <FileText className="w-3 h-3" /> Invoices
        </p>
        <Button
          size="sm"
          onClick={sendInvoice}
          disabled={sending || advertiser.status !== 'verified'}
          className="h-6 px-2 text-[10px] bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 gap-1"
        >
          {sending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Send className="w-2.5 h-2.5" />}
          {sending ? 'Sending...' : 'Send Invoice'}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="w-3 h-3 animate-spin text-white/30" />
          <span className="text-white/30 text-xs">Loading...</span>
        </div>
      ) : invoices.length === 0 ? (
        <p className="text-white/20 text-xs py-1">No invoices yet</p>
      ) : (
        <div className="space-y-1.5">
          {invoices.map(inv => {
            const cfg = STATUS_CFG[inv.status] || STATUS_CFG.sent;
            const Icon = cfg.icon;
            return (
              <div key={inv.id} className="flex items-center justify-between bg-white/[0.02] rounded-lg px-3 py-2">
                <div>
                  <p className="text-white text-[11px] font-semibold">{inv.invoice_number}</p>
                  <p className="text-white/30 text-[10px]">{inv.period_label}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-emerald-400 text-[11px] font-bold">₦{Number(inv.total || 0).toLocaleString()}</p>
                  <span className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md ${cfg.class}`}>
                    <Icon className="w-2.5 h-2.5" />{cfg.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}