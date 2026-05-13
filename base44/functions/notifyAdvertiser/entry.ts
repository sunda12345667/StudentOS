import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { campaign, action, rejection_reason } = body;

    if (!campaign || !action) {
      return Response.json({ error: 'Missing campaign or action' }, { status: 400 });
    }

    // Find advertiser email
    let advertiserEmail = campaign.contact_email;
    if (!advertiserEmail && campaign.advertiser_id) {
      const advertisers = await base44.asServiceRole.entities.Advertiser.filter({ id: campaign.advertiser_id });
      advertiserEmail = advertisers?.[0]?.contact_email;
    }

    if (!advertiserEmail) {
      return Response.json({ error: 'No advertiser email found' }, { status: 400 });
    }

    const isApproved = action === 'approved';
    const subject = isApproved
      ? `✅ Your EduVerse Ad Campaign is Live — ${campaign.campaign_name}`
      : `❌ Ad Campaign Review Update — ${campaign.campaign_name}`;

    const htmlBody = isApproved ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8faff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 32px 28px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 26px;">📊 EduVerse</h1>
          <p style="color: #93c5fd; margin: 6px 0 0; font-size: 14px;">Advertising Platform</p>
        </div>
        <div style="padding: 28px; background: #fff;">
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 28px;">🎉</span>
            <div>
              <p style="color: #166534; font-weight: bold; margin: 0; font-size: 15px;">Campaign Approved & Now Live!</p>
              <p style="color: #15803d; margin: 4px 0 0; font-size: 13px;">Your campaign has been reviewed and is now active.</p>
            </div>
          </div>
          <p style="color: #374151; font-size: 14px;">Hello ${campaign.advertiser_name},</p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Great news! Your ad campaign has been approved by our admin team and is now live on EduVerse.
          </p>
          <div style="background: #f0f4ff; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1e3a8a; margin: 0 0 14px; font-size: 14px;">CAMPAIGN DETAILS</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Campaign Name</td><td style="text-align: right; font-weight: bold; color: #1e3a8a; font-size: 13px;">${campaign.campaign_name}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Ad Type</td><td style="text-align: right; font-weight: bold; color: #7c3aed; font-size: 13px; text-transform: capitalize;">${(campaign.ad_type || '').replace('_', ' ')}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Budget</td><td style="text-align: right; font-weight: bold; color: #059669; font-size: 13px;">₦${Number(campaign.budget || 0).toLocaleString()}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Campaign Period</td><td style="text-align: right; font-weight: bold; color: #1e3a8a; font-size: 13px;">${campaign.start_date || 'N/A'} → ${campaign.end_date || 'N/A'}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Status</td><td style="text-align: right; font-size: 13px;"><span style="background: #dcfce7; color: #166534; padding: 2px 10px; border-radius: 20px; font-weight: bold;">LIVE ✓</span></td></tr>
            </table>
          </div>
          <p style="color: #9ca3af; font-size: 12px;">You can track impressions, clicks, and spend in your advertiser dashboard. Contact us for any questions.</p>
        </div>
        <div style="background: #f0f4ff; padding: 16px 28px; text-align: center;">
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">EduVerse Advertising Platform · This is an automated notification</p>
        </div>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8faff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #7f1d1d 100%); padding: 32px 28px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 26px;">📊 EduVerse</h1>
          <p style="color: #fca5a5; margin: 6px 0 0; font-size: 14px;">Advertising Platform</p>
        </div>
        <div style="padding: 28px; background: #fff;">
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px;">
            <p style="color: #991b1b; font-weight: bold; margin: 0; font-size: 15px;">Campaign Not Approved</p>
            <p style="color: #b91c1c; margin: 4px 0 0; font-size: 13px;">Your campaign requires changes before it can go live.</p>
          </div>
          <p style="color: #374151; font-size: 14px;">Hello ${campaign.advertiser_name},</p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            After reviewing your ad campaign, our admin team has determined it does not meet our current advertising guidelines.
          </p>
          <div style="background: #f0f4ff; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1e3a8a; margin: 0 0 10px; font-size: 14px;">CAMPAIGN: ${campaign.campaign_name}</h3>
            ${rejection_reason ? `
            <div style="background: #fff7ed; border-left: 3px solid #f97316; padding: 12px; border-radius: 0 8px 8px 0; margin-top: 10px;">
              <p style="color: #9a3412; font-size: 13px; margin: 0;"><strong>Reason:</strong> ${rejection_reason}</p>
            </div>` : ''}
          </div>
          <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">Please address the feedback above and resubmit your campaign, or contact our support team for assistance.</p>
        </div>
        <div style="background: #f0f4ff; padding: 16px 28px; text-align: center;">
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">EduVerse Advertising Platform · This is an automated notification</p>
        </div>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: advertiserEmail,
      from_name: 'EduVerse Ads',
      subject,
      body: htmlBody,
    });

    return Response.json({ success: true, sent_to: advertiserEmail, action });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});