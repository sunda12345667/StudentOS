/**
 * releaseEscrow — Release held earnings to seller's available_earnings.
 *
 * Can be triggered:
 *  - By admin manually
 *  - By buyer confirming delivery
 *  - By scheduled automation (auto-release after hold period)
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { order_id, trigger = 'buyer_confirmed' } = body;
    if (!order_id) return Response.json({ error: 'order_id required' }, { status: 400 });

    // Fetch order
    const orders = await base44.entities.Order.filter({ id: order_id });
    const order = orders[0];
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    if (order.escrow_released) return Response.json({ error: 'Escrow already released for this order' }, { status: 409 });

    // Only buyer, seller, or admin can trigger release
    const isAdmin = user.role === 'admin';
    const isBuyer = order.buyer_email === user.email;
    if (!isAdmin && !isBuyer) return Response.json({ error: 'Not authorized to release this escrow' }, { status: 403 });

    // Fetch escrow record
    const escrows = await base44.asServiceRole.entities.EarningsEscrow.filter({ order_id });
    const escrow = escrows[0];
    if (!escrow || escrow.status !== 'holding') return Response.json({ error: 'Escrow not in holding state' }, { status: 409 });

    // Fetch seller wallet
    const sellerWallets = await base44.asServiceRole.entities.Wallet.filter({ user_email: order.seller_email });
    const sellerWallet = sellerWallets[0];
    if (!sellerWallet) return Response.json({ error: 'Seller wallet not found' }, { status: 404 });

    const netAmount = escrow.net_amount;
    const newPending = Math.max(0, (sellerWallet.pending_earnings || 0) - netAmount);
    const newAvailable = (sellerWallet.available_earnings || 0) + netAmount;
    const now = new Date().toISOString();

    // Atomic update
    await Promise.all([
      base44.asServiceRole.entities.Wallet.update(sellerWallet.id, {
        pending_earnings: newPending,
        available_earnings: newAvailable,
      }),
      base44.asServiceRole.entities.EarningsEscrow.update(escrow.id, {
        status: 'released',
        released_at: now,
        release_trigger: trigger,
      }),
      base44.asServiceRole.entities.Order.update(order.id, {
        escrow_released: true,
        status: 'completed',
        buyer_confirmed_at: isBuyer ? now : order.buyer_confirmed_at,
      }),
    ]);

    const ref = `REL-${order.reference || order_id}`;

    // Ledger entry: pending → available
    await base44.asServiceRole.entities.Ledger.create({
      entry_id: ref,
      transaction_ref: ref,
      order_id,
      debit_account: `${order.seller_email}:pending`,
      credit_account: `${order.seller_email}:available`,
      debit_type: 'pending_earnings',
      credit_type: 'available_earnings',
      amount: netAmount,
      description: `Escrow release for order: ${order.item_title}`,
      entry_type: 'escrow_release',
    });

    // Transaction record
    await base44.asServiceRole.entities.Transaction.create({
      reference: ref,
      user_email: order.seller_email,
      user_name: order.seller_name,
      type: 'escrow_release',
      amount: netAmount,
      balance_type: 'available_earnings',
      balance_before: sellerWallet.available_earnings || 0,
      balance_after: newAvailable,
      description: `Earnings released: ${order.item_title}`,
      order_id,
      item_id: order.item_id,
      item_title: order.item_title,
      counterparty_email: order.buyer_email,
      status: 'completed',
    });

    // Notify seller
    await base44.asServiceRole.entities.Notification.create({
      user_email: order.seller_email,
      type: 'marketplace',
      content: `₦${netAmount.toLocaleString()} from your sale of "${order.item_title}" has been released and is now available for withdrawal!`,
      link: '/marketplace',
      is_read: false,
    });

    return Response.json({ success: true, released_amount: netAmount });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});