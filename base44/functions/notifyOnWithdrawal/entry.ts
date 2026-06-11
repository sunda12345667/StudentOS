import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Called via entity automation when a WithdrawalRequest is created.
 * Notifies admin(s) immediately via Notification entity.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));

    const wr = payload.data;
    if (!wr || wr.status !== 'pending') {
      return Response.json({ skipped: true });
    }

    // Notify all admin users
    const adminUsers = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    if (adminUsers.length === 0) {
      console.log('No admin users found to notify');
      return Response.json({ ok: true });
    }

    await Promise.all(adminUsers.map(admin =>
      base44.asServiceRole.entities.Notification.create({
        user_email: admin.email,
        type: 'marketplace',
        content: `${wr.user_name || wr.user_email} requested a withdrawal of ₦${(wr.amount || 0).toLocaleString()} to ${wr.bank}.`,
        is_read: false,
        entity_type: 'WithdrawalRequest',
        entity_id: wr.id,
        link: '/admin/wallet',
      })
    ));

    console.log(`Notified ${adminUsers.length} admin(s) of withdrawal request from ${wr.user_email}`);
    return Response.json({ ok: true, notified: adminUsers.length });
  } catch (error) {
    console.error('notifyOnWithdrawal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});