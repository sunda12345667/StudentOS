import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

const OWNER_EMAIL = Deno.env.get('OWNER_EMAIL');

function formatNaira(val) {
  return '₦' + Number(val || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 });
}

function drawSectionHeader(doc, text, y, color = [59, 130, 246]) {
  doc.setFillColor(...color);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(text, 17, y + 5);
  doc.setTextColor(30, 30, 60);
  return y + 12;
}

function drawKpiRow(doc, items, y) {
  const colW = 182 / items.length;
  items.forEach((item, i) => {
    const x = 14 + i * colW;
    doc.setFillColor(240, 244, 255);
    doc.roundedRect(x, y, colW - 3, 22, 3, 3, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 140);
    doc.text(item.label, x + 4, y + 7);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 80);
    doc.text(item.value, x + 4, y + 17);
  });
  return y + 28;
}

function tableRow(doc, cols, y, isHeader = false, shade = false) {
  if (isHeader) {
    doc.setFillColor(59, 130, 246);
    doc.rect(14, y - 4, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
  } else {
    if (shade) {
      doc.setFillColor(248, 250, 255);
      doc.rect(14, y - 4, 182, 7, 'F');
    }
    doc.setTextColor(40, 40, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
  }
  cols.forEach(({ text, x }) => doc.text(String(text), x, y));
  return y + (isHeader ? 9 : 8);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled (no user) or admin user calls
    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      isAdmin = user?.role === 'admin';
    } catch (_) {
      // called from automation — treat as authorized
      isAdmin = true;
    }

    const body = await req.json().catch(() => ({}));
    const reportType = body?.args?.type || body?.type || 'weekly';

    if (!OWNER_EMAIL) {
      return Response.json({ error: 'OWNER_EMAIL secret not configured' }, { status: 500 });
    }

    // Fetch data using service role
    const [orders, ads, advertisers, transactions, commissionConfigs] = await Promise.all([
      base44.asServiceRole.entities.Order.list('-created_date', 200),
      base44.asServiceRole.entities.AdCampaign.list('-created_date', 100),
      base44.asServiceRole.entities.Advertiser.list('-created_date', 100),
      base44.asServiceRole.entities.Transaction.list('-created_date', 500),
      base44.asServiceRole.entities.CommissionConfig.list(),
    ]);

    const commissionRate = commissionConfigs?.[0]?.rate || 10;
    const now = new Date();
    const periodLabel = reportType === 'monthly'
      ? now.toLocaleString('default', { month: 'long', year: 'numeric' })
      : `Week of ${now.toLocaleDateString('en-GB')}`;

    // Aggregate stats
    const totalSales = orders.reduce((s, o) => s + (o.price || 0), 0);
    const completedOrders = orders.filter(o => o.status === 'completed');
    const completedSales = completedOrders.reduce((s, o) => s + (o.price || 0), 0);
    const commissionEarned = completedSales * (commissionRate / 100);
    const adRevenue = ads.reduce((s, a) => s + (a.spent || 0), 0);
    const totalRevenue = commissionEarned + adRevenue;
    const activeAds = ads.filter(a => a.status === 'active').length;
    const verifiedAdvertisers = advertisers.filter(a => a.status === 'verified').length;
    const totalFunded = transactions.filter(t => t.type === 'fund').reduce((s, t) => s + (t.amount || 0), 0);

    // Top advertisers by spend
    const topAdvertisers = [...advertisers]
      .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
      .slice(0, 5);

    // Top campaigns by clicks
    const topCampaigns = [...ads]
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 5);

    // Build PDF
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Header banner
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 38, 'F');
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 35, 210, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('EduVerse', 14, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 180, 255);
    doc.text(`${reportType === 'monthly' ? 'Monthly' : 'Weekly'} Performance Report`, 14, 27);

    doc.setTextColor(100, 140, 220);
    doc.setFontSize(8);
    doc.text(`Period: ${periodLabel}`, 14, 33);
    doc.text(`Generated: ${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString()}`, 120, 33);

    let y = 48;

    // KPI section
    y = drawSectionHeader(doc, 'KEY PERFORMANCE INDICATORS', y);
    y = drawKpiRow(doc, [
      { label: 'Total Revenue', value: formatNaira(totalRevenue) },
      { label: 'Commission Earned', value: formatNaira(commissionEarned) },
      { label: 'Ad Revenue', value: formatNaira(adRevenue) },
      { label: 'Marketplace Sales', value: formatNaira(totalSales) },
    ], y);
    y = drawKpiRow(doc, [
      { label: 'Commission Rate', value: `${commissionRate}%` },
      { label: 'Total Orders', value: String(orders.length) },
      { label: 'Completed Orders', value: String(completedOrders.length) },
      { label: 'Wallet Funds Loaded', value: formatNaira(totalFunded) },
    ], y);
    y += 4;

    // Advertising section
    y = drawSectionHeader(doc, 'ADVERTISING OVERVIEW', y, [139, 92, 246]);
    y = drawKpiRow(doc, [
      { label: 'Active Campaigns', value: String(activeAds) },
      { label: 'Total Campaigns', value: String(ads.length) },
      { label: 'Verified Advertisers', value: String(verifiedAdvertisers) },
      { label: 'Total Advertisers', value: String(advertisers.length) },
    ], y);
    y += 4;

    // Top advertisers table
    y = drawSectionHeader(doc, 'TOP ADVERTISERS BY SPEND', y, [16, 185, 129]);
    const advCols = [
      { text: 'Company', x: 17 },
      { text: 'Industry', x: 80 },
      { text: 'Campaigns', x: 130 },
      { text: 'Total Spent', x: 163 },
    ];
    y = tableRow(doc, advCols, y, true);
    topAdvertisers.forEach((adv, i) => {
      y = tableRow(doc, [
        { text: adv.company_name?.substring(0, 28) || '-', x: 17 },
        { text: adv.industry || '-', x: 80 },
        { text: String(adv.total_campaigns || 0), x: 130 },
        { text: formatNaira(adv.total_spent), x: 163 },
      ], y, false, i % 2 === 0);
    });
    y += 6;

    // Check for page overflow
    if (y > 230) { doc.addPage(); y = 20; }

    // Top campaigns table
    y = drawSectionHeader(doc, 'TOP AD CAMPAIGNS BY CLICKS', y, [245, 158, 11]);
    const campCols = [
      { text: 'Campaign Name', x: 17 },
      { text: 'Advertiser', x: 85 },
      { text: 'Clicks', x: 140 },
      { text: 'Impressions', x: 163 },
    ];
    y = tableRow(doc, campCols, y, true);
    topCampaigns.forEach((c, i) => {
      y = tableRow(doc, [
        { text: (c.campaign_name || c.title || '-').substring(0, 30), x: 17 },
        { text: (c.advertiser_name || '-').substring(0, 22), x: 85 },
        { text: String(c.clicks || 0), x: 140 },
        { text: Number(c.impressions || 0).toLocaleString(), x: 163 },
      ], y, false, i % 2 === 0);
    });
    y += 6;

    if (y > 240) { doc.addPage(); y = 20; }

    // Commission breakdown
    y = drawSectionHeader(doc, 'COMMISSION BREAKDOWN', y, [239, 68, 68]);
    y = drawKpiRow(doc, [
      { label: 'Gross Sales Volume', value: formatNaira(totalSales) },
      { label: `Commission (${commissionRate}%)`, value: formatNaira(commissionEarned) },
      { label: 'Pending Orders', value: String(orders.filter(o => o.status === 'pending').length) },
      { label: 'Disputed Orders', value: String(orders.filter(o => o.status === 'disputed').length) },
    ], y);

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(240, 244, 255);
      doc.rect(0, 285, 210, 12, 'F');
      doc.setTextColor(120, 130, 170);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('EduVerse Platform — Confidential Owner Report', 14, 292);
      doc.text(`Page ${i} of ${pageCount}`, 185, 292);
    }

    const pdfBase64 = doc.output('datauristring').split(',')[1];

    // Send email with PDF attachment
    const subject = `EduVerse ${reportType === 'monthly' ? 'Monthly' : 'Weekly'} Performance Report — ${periodLabel}`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8faff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 32px 28px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 26px; letter-spacing: -0.5px;">📊 EduVerse</h1>
          <p style="color: #93c5fd; margin: 6px 0 0; font-size: 14px;">
            ${reportType === 'monthly' ? 'Monthly' : 'Weekly'} Performance Report
          </p>
        </div>
        <div style="padding: 28px; background: #fff;">
          <p style="color: #374151; font-size: 15px; margin-top: 0;">Hello Platform Owner,</p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Your ${reportType === 'monthly' ? 'monthly' : 'weekly'} performance summary for <strong>${periodLabel}</strong> is attached to this email as a PDF.
          </p>
          <div style="background: #f0f4ff; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1e3a8a; margin: 0 0 14px; font-size: 14px;">QUICK SUMMARY</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Total Revenue</td><td style="text-align: right; font-weight: bold; color: #1e3a8a; font-size: 13px;">${formatNaira(totalRevenue)}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Commission Earned</td><td style="text-align: right; font-weight: bold; color: #7c3aed; font-size: 13px;">${formatNaira(commissionEarned)}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Ad Revenue</td><td style="text-align: right; font-weight: bold; color: #059669; font-size: 13px;">${formatNaira(adRevenue)}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Marketplace Sales</td><td style="text-align: right; font-weight: bold; color: #d97706; font-size: 13px;">${formatNaira(totalSales)}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Active Ad Campaigns</td><td style="text-align: right; font-weight: bold; color: #1e3a8a; font-size: 13px;">${activeAds}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Total Orders</td><td style="text-align: right; font-weight: bold; color: #1e3a8a; font-size: 13px;">${orders.length}</td></tr>
            </table>
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">
            Please see the attached PDF for the full breakdown including top advertisers, campaigns, and commission details.
          </p>
        </div>
        <div style="background: #f0f4ff; padding: 16px 28px; text-align: center;">
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">EduVerse Platform · Automated ${reportType === 'monthly' ? 'Monthly' : 'Weekly'} Report</p>
        </div>
      </div>
    `;

    // Use service role to send email — owner must be a registered user
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: OWNER_EMAIL,
      from_name: 'EduVerse Reports',
      subject,
      body: htmlBody,
    });

    return Response.json({
      success: true,
      report_type: reportType,
      period: periodLabel,
      sent_to: OWNER_EMAIL,
      stats: {
        total_revenue: totalRevenue,
        commission: commissionEarned,
        ad_revenue: adRevenue,
        total_orders: orders.length,
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});