import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { FileText, Download, Loader2, CheckCircle2, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

const STATUS_CFG = {
  sent:    { label: 'Sent',    class: 'bg-blue-500/20 text-blue-400',    icon: Send },
  paid:    { label: 'Paid',    class: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle2 },
  overdue: { label: 'Overdue', class: 'bg-red-500/20 text-red-400',      icon: AlertCircle },
};

function downloadInvoicePDF(inv) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 45, 'F');
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 42, 210, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('EduVerse', 14, 20);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(147, 197, 253);
  doc.text('Advertising Platform', 14, 28);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 162, 20);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(147, 197, 253);
  doc.text(inv.invoice_number || '', 162, 28);
  doc.text(`Period: ${inv.period_label || ''}`, 162, 35);

  let y = 60;

  // Bill to
  doc.setFillColor(240, 244, 255);
  doc.roundedRect(14, y, 90, 28, 3, 3, 'F');
  doc.setTextColor(80, 100, 160);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', 19, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 80);
  doc.setFontSize(9);
  doc.text(inv.advertiser_name || '', 19, y + 14);
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 120);
  doc.text(inv.advertiser_email || '', 19, y + 20);

  y += 38;

  // Line items
  if (inv.line_items && inv.line_items.length > 0) {
    doc.setFillColor(59, 130, 246);
    doc.rect(14, y, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Campaign', 17, y + 5.5);
    doc.text('Type', 85, y + 5.5);
    doc.text('Impressions', 115, y + 5.5);
    doc.text('Clicks', 148, y + 5.5);
    doc.text('Amount', 172, y + 5.5);
    y += 12;

    inv.line_items.forEach((item, i) => {
      if (i % 2 === 0) { doc.setFillColor(248, 250, 255); doc.rect(14, y - 4, 182, 8, 'F'); }
      doc.setTextColor(40, 40, 80);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text((item.campaign_name || '').substring(0, 28), 17, y);
      doc.text((item.ad_type || '').replace('_', ' '), 85, y);
      doc.text(Number(item.impressions || 0).toLocaleString(), 115, y);
      doc.text(Number(item.clicks || 0).toLocaleString(), 148, y);
      doc.text(`₦${Number(item.amount || 0).toLocaleString()}`, 168, y);
      y += 9;
    });
  }

  // Totals
  y += 6;
  doc.setDrawColor(200, 210, 240);
  doc.line(130, y, 196, y);
  y += 6;

  const rows = [
    ['Subtotal', `₦${Number(inv.subtotal || 0).toLocaleString()}`],
    ...(inv.tax_rate > 0 ? [[`VAT (${inv.tax_rate}%)`, `₦${Number(inv.tax_amount || 0).toLocaleString()}`]] : []),
  ];
  rows.forEach(([l, v]) => {
    doc.setTextColor(80, 80, 120);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(l, 133, y);
    doc.text(v, 196 - doc.getTextWidth(v), y);
    y += 10;
  });

  doc.setFillColor(59, 130, 246);
  doc.roundedRect(130, y - 4, 66, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const totalStr = `₦${Number(inv.total || 0).toLocaleString()}`;
  doc.text('TOTAL DUE', 133, y);
  doc.text(totalStr, 196 - doc.getTextWidth(totalStr), y);

  // Footer
  doc.setFillColor(240, 244, 255);
  doc.rect(0, 278, 210, 20, 'F');
  doc.setTextColor(120, 130, 170);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for advertising with EduVerse. Payment due within 14 days.', 14, 286);
  doc.text(`EduVerse Platform — ${inv.invoice_number || ''}`, 150, 291);

  doc.save(`${inv.invoice_number || 'invoice'}.pdf`);
}

export default function AdvertiserInvoices({ advertiser }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!advertiser?.id) return;
    base44.entities.Invoice.filter({ advertiser_id: advertiser.id }, '-created_date', 50)
      .then(setInvoices)
      .finally(() => setLoading(false));
  }, [advertiser?.id]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-white font-bold text-xl">Invoices</h1>
        <p className="text-white/40 text-sm mt-1">Download your billing history.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-white/30" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-[#0d1220] p-12 text-center">
          <FileText className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No invoices generated yet.</p>
          <p className="text-white/20 text-xs mt-1">Invoices are sent at the end of each billing period.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 bg-[#0d1220] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8">
            <p className="text-white font-semibold text-sm">{invoices.length} Invoice{invoices.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="divide-y divide-white/5">
            {invoices.map(inv => {
              const cfg = STATUS_CFG[inv.status] || STATUS_CFG.sent;
              const Icon = cfg.icon;
              return (
                <div key={inv.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{inv.invoice_number}</p>
                      <p className="text-white/30 text-xs">{inv.period_label} · {inv.line_items?.length || 0} campaigns</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-emerald-400 font-bold text-sm">₦{Number(inv.total || 0).toLocaleString()}</p>
                      <p className="text-white/20 text-[10px]">{inv.sent_at ? new Date(inv.sent_at).toLocaleDateString() : ''}</p>
                    </div>
                    <span className={`hidden sm:flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.class}`}>
                      <Icon className="w-3 h-3" />{cfg.label}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => { downloadInvoicePDF(inv); toast.success('Invoice downloaded!'); }}
                      className="h-7 px-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 gap-1.5 text-xs"
                    >
                      <Download className="w-3 h-3" />PDF
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}