/**
 * autoReleaseEscrow — Scheduled job that auto-releases held escrow where hold_until has passed.
 * Runs every 30 minutes. Admin-only invocation pattern (scheduled, not user-callable).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all escrows still in holding state
    const holdingEscrows = await base44.asServiceRole.entities.EarningsEscrow.filter({ status: 'holding' });
    const now = new Date();
    const due = holdingEscrows.filter(e => e.hold_until && new Date(e.hold_until) <= now);

    let released = 0;
    const errors = [];

    for (const escrow of due) {
      try {
        // Fetch seller wallet
        const wallets = await base44.asServiceRole.entities.Wallet.filter({ user_email: escrow.seller_email });
        const wallet = wallets[0];
        if (!wallet) { errors.push(`No wallet for ${escrow.seller_email}`); continue; }

        // Fetch order
        const orders = await base44.asServiceRole.entities.Order.filter({ id: escrow.order_id });
        const order = orders[0];
        if (order?.escrow_released) continue; // Already released

        const netAmount = escrow.net_amount;
        const newPending = Math.max(0, (wallet.pending_earnings || 0) - netAmount);
        const newAvailable = (wallet.available_earnings || 0) + netAmount;
        const releasedAt = now.toISOString();
        const ref = `AUTO-REL-${escrow.order_id}`;

        await Promise.all([
          base44.asServiceRole.entities.Wallet.update(wallet.id, {
            pending_earnings: newPending,
            available_earnings: newAvailable,
          }),
          base44.asServiceRole.entities.EarningsEscrow.update(escrow.id, {
            status: 'released',
            released_at: releasedAt,
            release_trigger: 'auto_timer',
          }),
          ...(order ? [base44.asServiceRole.entities.Order.update(escrow.order_id, {
            escrow_released: true,
            status: 'completed',
          })] : []),
        ]);

        await Promise.all([
          base44.asServiceRole.entities.Ledger.create({
            entry_id: ref,
            transaction_ref: ref,
            order_id: escrow.order_id,
            debit_account: `${escrow.seller_email}:pending`,
            credit_account: `${escrow.seller_email}:available`,
            debit_type: 'pending_earnings',
            credit_type: 'available_earnings',
            amount: netAmount,
            description: `Auto-release: ${escrow.item_title || escrow.order_id}`,
            entry_type: 'escrow_release',
          }),
          base44.asServiceRole.entities.Transaction.create({
            reference: ref,
            user_email: escrow.seller_email,
            type: 'escrow_release',
            amount: netAmount,
            balance_type: 'available_earnings',
            balance_before: wallet.available_earnings || 0,
            balance_after: newAvailable,
            description: `Earnings auto-released: ${escrow.item_title || escrow.order_id}`,
            order_id: escrow.order_id,
            status: 'completed',
          }),
          base44.asServiceRole.entities.Notification.create({
            user_email: escrow.seller_email,
            type: 'marketplace',
            content: `₦${netAmount.toLocaleString()} from "${escrow.item_title || 'your sale'}" has been released and is now available for withdrawal!`,
            is_read: false,
          }),
        ]);

        released++;
      } catch (e) {
        errors.push(`${escrow.id}: ${e.message}`);
      }
    }

    return Response.json({
      success: true,
      checked: holdingEscrows.length,
      due: due.length,
      released,
      errors,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});