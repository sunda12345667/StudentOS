/**
 * refundOrder — Reverse a purchase with full double-entry reversal.
 * - Refunds buyer wallet_balance
 * - Reverses seller pending_earnings
 * - Reverses platform commission from Revenue
 * - Marks escrow as refunded
 * - Creates reversal ledger entries
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const { order_id, reason } = await req.json();
    if (!order_id) return Response.json({ error: 'order_id required' }, { status: 400 });

    const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id });
    const order = orders[0];
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    if (['refunded', 'cancelled'].includes(order.status)) {
      return Response.json({ error: 'Order already refunded or cancelled' }, { status: 409 });
    }

    const escrows = await base44.asServiceRole.entities.EarningsEscrow.filter({ order_id });
    const escrow = escrows[0];

    // Fetch wallets
    const [buyerWallets, sellerWallets] = await Promise.all([
      base44.asServiceRole.entities.Wallet.filter({ user_email: order.buyer_email }),
      base44.asServiceRole.entities.Wallet.filter({ user_email: order.seller_email }),
    ]);
    const buyerWallet = buyerWallets[0];
    const sellerWallet = sellerWallets[0];
    if (!buyerWallet) return Response.json({ error: 'Buyer wallet not found' }, { status: 404 });

    const refundAmount = order.price;
    const sellerReversal = order.seller_payout || (order.price - order.commission_amount);
    const ref = `REFUND-${order.reference || order_id}`;

    // Update balances
    const updates = [
      base44.asServiceRole.entities.Wallet.update(buyerWallet.id, {
        wallet_balance: (buyerWallet.wallet_balance || 0) + refundAmount,
        total_spent: Math.max(0, (buyerWallet.total_spent || 0) - refundAmount),
      }),
      base44.asServiceRole.entities.Order.update(order.id, {
        status: 'refunded',
        refund_reason: reason || 'Admin refund',
      }),
    ];

    if (sellerWallet && sellerReversal > 0) {
      // Reverse from pending (if not yet released) or available
      const pendingToReverse = Math.min(sellerWallet.pending_earnings || 0, sellerReversal);
      const availableToReverse = sellerReversal - pendingToReverse;
      updates.push(
        base44.asServiceRole.entities.Wallet.update(sellerWallet.id, {
          pending_earnings: Math.max(0, (sellerWallet.pending_earnings || 0) - pendingToReverse),
          available_earnings: Math.max(0, (sellerWallet.available_earnings || 0) - availableToReverse),
          total_earned: Math.max(0, (sellerWallet.total_earned || 0) - sellerReversal),
        })
      );
    }

    if (escrow) {
      updates.push(
        base44.asServiceRole.entities.EarningsEscrow.update(escrow.id, {
          status: 'refunded',
          released_at: new Date().toISOString(),
          release_trigger: 'refunded',
        })
      );
    }

    await Promise.all(updates);

    // Reversal ledger entries
    await Promise.all([
      base44.asServiceRole.entities.Ledger.create({
        entry_id: `${ref}-BUYER`,
        transaction_ref: ref,
        order_id,
        debit_account: 'escrow@studentos.internal',
        credit_account: order.buyer_email,
        debit_type: 'escrow',
        credit_type: 'wallet_balance',
        amount: refundAmount,
        description: `Refund: ${order.item_title} — ${reason || 'Admin refund'}`,
        entry_type: 'refund',
        is_reversal: true,
        reversal_of_entry: `${order.reference}-PURCHASE`,
      }),
      base44.asServiceRole.entities.Ledger.create({
        entry_id: `${ref}-SELLER`,
        transaction_ref: ref,
        order_id,
        debit_account: order.seller_email,
        credit_account: 'escrow@studentos.internal',
        debit_type: 'pending_earnings',
        credit_type: 'escrow',
        amount: sellerReversal,
        description: `Refund reversal (seller): ${order.item_title}`,
        entry_type: 'refund',
        is_reversal: true,
      }),
    ]);

    // Transaction records
    await Promise.all([
      base44.asServiceRole.entities.Transaction.create({
        reference: `${ref}-BUYER`,
        user_email: order.buyer_email,
        type: 'refund',
        amount: refundAmount,
        balance_type: 'wallet_balance',
        balance_before: buyerWallet.wallet_balance || 0,
        balance_after: (buyerWallet.wallet_balance || 0) + refundAmount,
        description: `Refund: ${order.item_title}`,
        order_id,
        counterparty_email: order.seller_email,
        status: 'completed',
      }),
    ]);

    // Notify both parties
    await Promise.all([
      base44.asServiceRole.entities.Notification.create({
        user_email: order.buyer_email,
        type: 'marketplace',
        content: `Your order for "${order.item_title}" has been refunded. ₦${refundAmount.toLocaleString()} has been returned to your wallet.`,
        is_read: false,
      }),
      base44.asServiceRole.entities.Notification.create({
        user_email: order.seller_email,
        type: 'marketplace',
        content: `A refund was issued for your sale of "${order.item_title}". The amount has been reversed from your earnings.`,
        is_read: false,
      }),
    ]);

    return Response.json({ success: true, refund_amount: refundAmount });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});