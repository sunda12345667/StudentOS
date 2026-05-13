import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

function formatNaira(val) {
  return '₦' + Number(val || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function generateInvoiceNumber() {
  const now = new Date();
  return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function buildPDF(advertiser, campaigns, invoiceNumber, periodLabel, taxRate = 0) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const now = new Date();

  // Header background
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 45, 'F');
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 42, 210, 3, 'F');

  // Logo / Brand
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('EduVerse', 14, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(147, 197, 253);
  doc.text('Advertising Platform', 14, 28);
  doc.setFontSize(8);
  doc.setTextColor(100, 140, 220);
  doc.text('support@eduverse.app', 14, 35);

  // INVOICE label
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 160, 20);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(147, 197, 253);
  doc.text(invoiceNumber, 160, 28);
  doc.text(`Date: ${now.toLocaleDateString('en-GB')}`, 160, 34);
  doc.text(`Period: ${periodLabel}`, 160, 40);

  let y = 58;

  // Bill To box
  doc.setFillColor(240, 244, 255);
  doc.roundedRect(14, y, 85, 32, 3, 3, 'F');
  doc.setTextColor(80, 100, 160);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', 19, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 80);
  doc.setFontSize(9);
  doc.text(advertiser.company_name || '', 19, y + 14);
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 120);
  doc.text(advertiser.contact_name || '', 19, y + 20);
  doc.text(advertiser.contact_email || '', 19, y + 26);
  if (advertiser.phone) doc.text(advertiser.phone, 19, y + 32);

  // Summary box
  doc.setFillColor(240, 244, 255);
  doc.roundedRect(110, y, 86, 32, 3, 3, 'F');
  doc.setTextColor(80, 100, 160);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT SUMMARY', 115, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 80);
  doc.text(`Invoice #:`, 115, y + 14);
  doc.text(invoiceNumber, 155, y + 14);
  doc.text(`Due Date:`, 115, y + 20);
  const due = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  doc.text(due.toLocaleDateString('en-GB'), 155, y + 20);
  doc.text(`Industry:`, 115, y + 26);
  doc.text((advertiser.industry || 'N/A'), 155, y + 26);

  y += 42;

  // Table header
  doc.setFillColor(59, 130, 246);
  doc.rect(14, y, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Campaign', 17, y + 5.5);
  doc.text('Type', 90, y + 5.5);
  doc.text('Impressions', 115, y + 5.5);
  doc.text('Clicks', 145, y + 5.5);
  doc.text('Amount', 170, y + 5.5);
  y += 12;

  let subtotal = 0;

  campaigns.forEach((c, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 255);
      doc.rect(14, y - 4, 182, 8, 'F');
    }
    doc.setTextColor(40, 40, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const name = (c.campaign_name || c.title || 'Campaign').substring(0, 32);
    doc.text(name, 17, y);
    doc.text((c.ad_type || '').replace('_', ' '), 90, y);
    doc.text(Number(c.impressions || 0).toLocaleString(), 115, y);
    doc.text(Number(c.clicks || 0).toLocaleString(), 145, y);
    const amount = c.spent || 0;
    doc.text(formatNaira(amount), 168, y);
    subtotal += amount;
    y += 9;
  });

  // Totals
  y += 4;
  doc.setDrawColor(200, 210, 240);
  doc.line(130, y, 196, y);
  y += 6;

  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const totalsRows = [
    ['Subtotal', formatNaira(subtotal)],
    ...(taxRate > 0 ? [[`VAT (${taxRate}%)`, formatNaira(taxAmount)]] : []),
    ['TOTAL DUE', formatNaira(total)],
  ];

  totalsRows.forEach(([label, value], i) => {
    const isLast = i === totalsRows.length - 1;
    if (isLast) {
      doc.setFillColor(59, 130, 246);
      doc.roundedRect(130, y - 4, 66, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
    } else {
      doc.setTextColor(80, 80, 120);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }
    doc.text(label, 133, y);
    doc.text(value, 196 - doc.getTextWidth(value), y);
    y += 12;
  });

  // Footer
  y = Math.max(y + 10, 255);
  doc.setFillColor(240, 244, 255);
  doc.rect(0, 278, 210, 20, 'F');
  doc.setTextColor(120, 130, 170);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for advertising with EduVerse. Payment is due within 14 days of invoice date.', 14, 286);
  doc.text('For billing queries contact: billing@eduverse.app', 14, 291);
  doc.text(`EduVerse Platform — ${invoiceNumber}`, 150, 291);

  return doc;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow admin user calls or scheduled automation calls
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch (_) { /* scheduled call — allowed */ }

    const body = await req.json().catch(() => ({}));
    const { advertiser_id, trigger = 'monthly', tax_rate = 0 } = body?.args || body || {};

    const now = new Date();
    const periodLabel = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;

    // Load all advertisers to bill (or just one if advertiser_id provided)
    const advertisers = advertiser_id
      ? await base44.asServiceRole.entities.Advertiser.filter({ id: advertiser_id })
      : await base44.asServiceRole.entities.Advertiser.filter({ status: 'verified' });

    const SPEND_THRESHOLD = 50000; // ₦50k threshold trigger
    const results = [];

    for (const adv of advertisers) {
      if (!adv.contact_email) continue;

      // Get active/completed campaigns for this advertiser with unprocessed spend
      const campaigns = await base44.asServiceRole.entities.AdCampaign.filter({ advertiser_id: adv.id });
      const billable = campaigns.filter(c => (c.spent || 0) > 0 && ['active', 'completed', 'paused'].includes(c.status));

      if (billable.length === 0) continue;

      const totalSpend = billable.reduce((s, c) => s + (c.spent || 0), 0);

      // For threshold trigger, only bill if spend exceeds threshold
      if (trigger === 'threshold' && totalSpend < SPEND_THRESHOLD) continue;

      const invoiceNumber = generateInvoiceNumber();
      const taxAmount = totalSpend * (tax_rate / 100);
      const total = totalSpend + taxAmount;

      // Build PDF
      const doc = buildPDF(adv, billable, invoiceNumber, periodLabel, tax_rate);
      const pdfBase64 = doc.output('datauristring').split(',')[1];

      // Save invoice record
      const lineItems = billable.map(c => ({
        campaign_name: c.campaign_name || c.title,
        ad_type: c.ad_type,
        impressions: c.impressions || 0,
        clicks: c.clicks || 0,
        amount: c.spent || 0,
      }));

      await base44.asServiceRole.entities.Invoice.create({
        invoice_number: invoiceNumber,
        advertiser_id: adv.id,
        advertiser_name: adv.company_name,
        advertiser_email: adv.contact_email,
        period_label: periodLabel,
        trigger,
        line_items: lineItems,
        subtotal: totalSpend,
        tax_rate,
        tax_amount: taxAmount,
        total,
        status: 'sent',
        sent_at: now.toISOString(),
      });

      // Send email with PDF invoice
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8faff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 32px 28px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 26px;">📊 EduVerse</h1>
            <p style="color: #93c5fd; margin: 6px 0 0; font-size: 14px;">Advertising Platform — Invoice</p>
          </div>
          <div style="padding: 28px; background: #fff;">
            <p style="color: #374151; font-size: 15px; margin-top: 0;">Hello ${adv.contact_name || adv.company_name},</p>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              Please find your EduVerse advertising invoice for <strong>${periodLabel}</strong> attached to this email.
            </p>
            <div style="background: #f0f4ff; border-radius: 10px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1e3a8a; margin: 0 0 14px; font-size: 14px;">INVOICE SUMMARY</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Invoice #</td><td style="text-align: right; font-weight: bold; color: #1e3a8a; font-size: 13px;">${invoiceNumber}</td></tr>
                <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Period</td><td style="text-align: right; font-weight: bold; color: #1e3a8a; font-size: 13px;">${periodLabel}</td></tr>
                <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Campaigns Billed</td><td style="text-align: right; font-weight: bold; color: #7c3aed; font-size: 13px;">${billable.length}</td></tr>
                <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Ad Spend</td><td style="text-align: right; font-weight: bold; color: #059669; font-size: 13px;">₦${totalSpend.toLocaleString()}</td></tr>
                ${tax_rate > 0 ? `<tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">VAT (${tax_rate}%)</td><td style="text-align: right; font-weight: bold; color: #d97706; font-size: 13px;">₦${taxAmount.toLocaleString()}</td></tr>` : ''}
                <tr style="border-top: 2px solid #dbeafe;"><td style="padding: 10px 0 6px; color: #1e3a8a; font-size: 14px; font-weight: bold;">TOTAL DUE</td><td style="text-align: right; font-weight: bold; color: #1e3a8a; font-size: 16px;">₦${total.toLocaleString()}</td></tr>
              </table>
            </div>
            <p style="color: #9ca3af; font-size: 12px;">Payment is due within 14 days. For billing queries, reply to this email or contact billing@eduverse.app</p>
          </div>
          <div style="background: #f0f4ff; padding: 16px 28px; text-align: center;">
            <p style="color: #9ca3af; font-size: 11px; margin: 0;">EduVerse Advertising Platform · Automated Invoice</p>
          </div>
        </div>
      `;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: adv.contact_email,
        from_name: 'EduVerse Billing',
        subject: `Invoice ${invoiceNumber} — EduVerse Ads (${periodLabel})`,
        body: emailHtml,
      });

      results.push({ advertiser: adv.company_name, invoice: invoiceNumber, total, sent_to: adv.contact_email });
    }

    return Response.json({ success: true, trigger, period: periodLabel, invoices_sent: results.length, results });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});