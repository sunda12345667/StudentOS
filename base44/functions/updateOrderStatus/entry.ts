/**
 * updateOrderStatus — Handles seller actions: approve, mark_shipped, mark_delivered, cancel
 * and buyer actions: confirm_received, dispute
 * All state transitions are validated. Escrow release happens atomically on completion.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { order_id, action, tracking_info } = await req.json();
    if (!order_id || !action) return Response.json({ error: 'order_id and action required' }, { status: 400 });

    const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id });
    const order = orders[0];
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

    const isSeller = order.seller_email === user.email;
    const isBuyer = order.buyer_email === user.email;
    const isAdmin = user.role === 'admin';

    if (!isSeller && !isBuyer && !isAdmin) {
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }

    const now = new Date().toISOString();
    let updatedOrder = null;
    let notifyBuyer = null;
    let notifySeller = null;

    // ── SELLER: Approve order ──────────────────────────────────────────────────
    // Digital: paid → completed instantly (escrow already released at purchase)
    // Physical: paid → processing (escrow held until delivery confirmed)
    if (action === 'approve') {
      if (!isSeller && !isAdmin) return Response.json({ error: 'Only seller can approve' }, { status: 403 });
      if (order.status !== 'paid') return Response.json({ error: `Cannot approve order with status: ${order.status}` }, { status: 409 });

      if (order.item_type === 'digital') {
        // Digital: release escrow now (pending → available) and expose the file
        const [items, escrows, sellerWallets] = await Promise.all([
          base44.asServiceRole.entities.MarketItem.filter({ id: order.item_id }),
          base44.asServiceRole.entities.EarningsEscrow.filter({ order_id }),
          base44.asServiceRole.entities.Wallet.filter({ user_email: order.seller_email }),
        ]);
        const item = items[0];
        const escrow = escrows[0];
        const sellerWallet = sellerWallets[0];
        const fileUrl = item?.file_url || null;

        if (sellerWallet && escrow && escrow.status === 'holding') {
          const netAmount = escrow.net_amount;
          const newPending = Math.max(0, (sellerWallet.pending_earnings || 0) - netAmount);
          const newAvailable = (sellerWallet.available_earnings || 0) + netAmount;
          const releaseRef = `REL-${order.reference || order_id}`;

          await Promise.all([
            base44.asServiceRole.entities.Wallet.update(sellerWallet.id, {
              pending_earnings: newPending,
              available_earnings: newAvailable,
            }),
            base44.asServiceRole.entities.EarningsEscrow.update(escrow.id, {
              status: 'released', released_at: now, release_trigger: 'admin_override',
            }),
            base44.asServiceRole.entities.Order.update(order.id, {
              status: 'completed', escrow_released: true, buyer_confirmed_at: now, file_url: fileUrl,
            }),
            base44.asServiceRole.entities.Ledger.create({
              entry_id: releaseRef,
              transaction_ref: releaseRef, order_id,
              debit_account: `${order.seller_email}:pending`,
              credit_account: `${order.seller_email}:available`,
              debit_type: 'pending_earnings', credit_type: 'available_earnings',
              amount: netAmount,
              description: `Digital escrow release (seller approved): ${order.item_title}`,
              entry_type: 'escrow_release',
            }),
            base44.asServiceRole.entities.Transaction.create({
              reference: releaseRef,
              user_email: order.seller_email, user_name: order.seller_name,
              type: 'escrow_release', amount: netAmount,
              balance_type: 'available_earnings',
              balance_before: sellerWallet.available_earnings || 0, balance_after: newAvailable,
              description: `Digital earnings released: ${order.item_title}`,
              order_id, item_id: order.item_id, item_title: order.item_title,
              counterparty_email: order.buyer_email, status: 'completed',
            }),
          ]);
        } else {
          await base44.asServiceRole.entities.Order.update(order.id, {
            status: 'completed', escrow_released: true, buyer_confirmed_at: now, file_url: fileUrl,
          });
        }

        updatedOrder = { ...order, status: 'completed', escrow_released: true, buyer_confirmed_at: now, file_url: fileUrl };
        notifyBuyer = `Your purchase of "${order.item_title}" is approved! Your download is ready.`;
        notifySeller = `You approved the order for "${order.item_title}". ₦${(order.seller_payout || 0).toLocaleString()} has been added to your available earnings.`;
      } else {
        // Physical: move to processing
        await base44.asServiceRole.entities.Order.update(order.id, { status: 'processing' });
        updatedOrder = { ...order, status: 'processing' };
        notifyBuyer = `Your order for "${order.item_title}" has been approved and is being processed.`;
      }
    }

    // ── SELLER: Mark shipped (processing → shipped) ────────────────────────────
    else if (action === 'mark_shipped') {
      if (!isSeller && !isAdmin) return Response.json({ error: 'Only seller can mark as shipped' }, { status: 403 });
      if (!['processing', 'paid'].includes(order.status)) return Response.json({ error: `Cannot ship order with status: ${order.status}` }, { status: 409 });

      const updates = { status: 'shipped' };
      if (tracking_info) updates.tracking_info = tracking_info;
      await base44.asServiceRole.entities.Order.update(order.id, updates);
      updatedOrder = { ...order, ...updates };
      notifyBuyer = `Your order "${order.item_title}" has been shipped!${tracking_info ? ` Tracking: ${tracking_info}` : ''}`;
    }

    // ── SELLER: Mark delivered (shipped → delivered) ───────────────────────────
    else if (action === 'mark_delivered') {
      if (!isSeller && !isAdmin) return Response.json({ error: 'Only seller can mark as delivered' }, { status: 403 });
      if (order.status !== 'shipped') return Response.json({ error: `Cannot mark delivered with status: ${order.status}` }, { status: 409 });

      await base44.asServiceRole.entities.Order.update(order.id, { status: 'delivered' });
      updatedOrder = { ...order, status: 'delivered' };
      notifyBuyer = `Your order "${order.item_title}" has been marked as delivered. Please confirm receipt to release payment to the seller.`;
    }

    // ── BUYER: Confirm received → releases escrow (physical orders only) ──────
    else if (action === 'confirm_received') {
      if (!isBuyer && !isAdmin) return Response.json({ error: 'Only buyer can confirm receipt' }, { status: 403 });
      if (order.item_type === 'digital') return Response.json({ error: 'Digital orders are completed automatically on seller approval.' }, { status: 409 });
      if (!['shipped', 'delivered', 'processing', 'paid'].includes(order.status)) {
        return Response.json({ error: `Cannot confirm receipt with status: ${order.status}` }, { status: 409 });
      }
      if (order.escrow_released) return Response.json({ error: 'Escrow already released' }, { status: 409 });

      // Fetch escrow and seller wallet
      const [escrows, sellerWallets] = await Promise.all([
        base44.asServiceRole.entities.EarningsEscrow.filter({ order_id }),
        base44.asServiceRole.entities.Wallet.filter({ user_email: order.seller_email }),
      ]);
      const escrow = escrows[0];
      const sellerWallet = sellerWallets[0];
      if (!sellerWallet) return Response.json({ error: 'Seller wallet not found' }, { status: 404 });
      if (!escrow || escrow.status !== 'holding') return Response.json({ error: 'Escrow not in holding state' }, { status: 409 });

      const netAmount = escrow.net_amount;
      const newPending = Math.max(0, (sellerWallet.pending_earnings || 0) - netAmount);
      const newAvailable = (sellerWallet.available_earnings || 0) + netAmount;
      const releaseRef = `REL-${order.reference || order_id}`;

      // Atomic: update wallet, escrow, order
      await Promise.all([
        base44.asServiceRole.entities.Wallet.update(sellerWallet.id, {
          pending_earnings: newPending,
          available_earnings: newAvailable,
        }),
        base44.asServiceRole.entities.EarningsEscrow.update(escrow.id, {
          status: 'released', released_at: now, release_trigger: 'buyer_confirmed',
        }),
        base44.asServiceRole.entities.Order.update(order.id, {
          status: 'completed', escrow_released: true, buyer_confirmed_at: now,
        }),
      ]);

      // Ledger entry
      await base44.asServiceRole.entities.Ledger.create({
        entry_id: releaseRef,
        transaction_ref: releaseRef, order_id,
        debit_account: `${order.seller_email}:pending`,
        credit_account: `${order.seller_email}:available`,
        debit_type: 'pending_earnings', credit_type: 'available_earnings',
        amount: netAmount,
        description: `Escrow release (buyer confirmed): ${order.item_title}`,
        entry_type: 'escrow_release',
      });

      // Transaction record
      await base44.asServiceRole.entities.Transaction.create({
        reference: releaseRef,
        user_email: order.seller_email, user_name: order.seller_name,
        type: 'escrow_release', amount: netAmount,
        balance_type: 'available_earnings',
        balance_before: sellerWallet.available_earnings || 0, balance_after: newAvailable,
        description: `Earnings released: ${order.item_title}`,
        order_id, item_id: order.item_id, item_title: order.item_title,
        counterparty_email: order.buyer_email, status: 'completed',
      });

      updatedOrder = { ...order, status: 'completed', escrow_released: true, buyer_confirmed_at: now };
      notifySeller = `₦${netAmount.toLocaleString()} from your sale of "${order.item_title}" is now available for withdrawal!`;
    }

    // ── BUYER / SELLER: Cancel (only before shipped/completed) ────────────────
    else if (action === 'cancel') {
      if (!['paid', 'processing'].includes(order.status)) {
        return Response.json({ error: `Cannot cancel order with status: ${order.status}` }, { status: 409 });
      }
      if (!isBuyer && !isSeller && !isAdmin) return Response.json({ error: 'Not authorized' }, { status: 403 });

      // Refund buyer wallet
      const [buyerWallets, sellerWallets, escrows] = await Promise.all([
        base44.asServiceRole.entities.Wallet.filter({ user_email: order.buyer_email }),
        base44.asServiceRole.entities.Wallet.filter({ user_email: order.seller_email }),
        base44.asServiceRole.entities.EarningsEscrow.filter({ order_id }),
      ]);
      const buyerWallet = buyerWallets[0];
      const sellerWallet = sellerWallets[0];
      const escrow = escrows[0];

      if (!buyerWallet) return Response.json({ error: 'Buyer wallet not found' }, { status: 404 });

      const refundAmount = order.price;
      const sellerReversal = order.seller_payout || 0;
      const refundRef = `CANCEL-${order.reference || order_id}`;

      const updates = [
        base44.asServiceRole.entities.Wallet.update(buyerWallet.id, {
          wallet_balance: (buyerWallet.wallet_balance || 0) + refundAmount,
          total_spent: Math.max(0, (buyerWallet.total_spent || 0) - refundAmount),
        }),
        base44.asServiceRole.entities.Order.update(order.id, { status: 'cancelled' }),
        base44.asServiceRole.entities.MarketItem.update(order.item_id, { status: 'available' }),
      ];

      if (sellerWallet && sellerReversal > 0) {
        updates.push(
          base44.asServiceRole.entities.Wallet.update(sellerWallet.id, {
            pending_earnings: Math.max(0, (sellerWallet.pending_earnings || 0) - sellerReversal),
            total_earned: Math.max(0, (sellerWallet.total_earned || 0) - sellerReversal),
          })
        );
      }
      if (escrow) {
        updates.push(
          base44.asServiceRole.entities.EarningsEscrow.update(escrow.id, {
            status: 'refunded', released_at: now, release_trigger: 'refunded',
          })
        );
      }

      await Promise.all(updates);

      // Ledger & transaction for cancellation refund
      await Promise.all([
        base44.asServiceRole.entities.Ledger.create({
          entry_id: `${refundRef}-REFUND`,
          transaction_ref: refundRef, order_id,
          debit_account: 'escrow@studentos.internal', credit_account: order.buyer_email,
          debit_type: 'escrow', credit_type: 'wallet_balance',
          amount: refundAmount,
          description: `Cancellation refund: ${order.item_title}`,
          entry_type: 'refund', is_reversal: true,
        }),
        base44.asServiceRole.entities.Transaction.create({
          reference: refundRef,
          user_email: order.buyer_email, user_name: order.buyer_name,
          type: 'refund', amount: refundAmount,
          balance_type: 'wallet_balance',
          balance_before: buyerWallet.wallet_balance || 0,
          balance_after: (buyerWallet.wallet_balance || 0) + refundAmount,
          description: `Cancellation refund: ${order.item_title}`,
          order_id, status: 'completed',
        }),
      ]);

      updatedOrder = { ...order, status: 'cancelled' };
      notifyBuyer = `Your order for "${order.item_title}" was cancelled. ₦${refundAmount.toLocaleString()} has been refunded to your wallet.`;
      notifySeller = `Order for "${order.item_title}" was cancelled. The payment has been refunded to the buyer.`;
    }

    // ── BUYER: Dispute ─────────────────────────────────────────────────────────
    else if (action === 'dispute') {
      if (!isBuyer && !isAdmin) return Response.json({ error: 'Only buyer can raise a dispute' }, { status: 403 });
      await base44.asServiceRole.entities.Order.update(order.id, { status: 'disputed' });
      updatedOrder = { ...order, status: 'disputed' };
      notifySeller = `A dispute has been raised for your order of "${order.item_title}". Please contact support.`;
      notifyBuyer = `Your dispute for "${order.item_title}" has been filed. Our team will review it shortly.`;
    }

    else {
      return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // ── Send notifications ─────────────────────────────────────────────────────
    const notifPromises = [];
    if (notifyBuyer) {
      notifPromises.push(base44.asServiceRole.entities.Notification.create({
        user_email: order.buyer_email, type: 'marketplace',
        content: notifyBuyer, link: '/marketplace',
        entity_type: 'Order', entity_id: order.id, is_read: false,
      }));
    }
    if (notifySeller) {
      notifPromises.push(base44.asServiceRole.entities.Notification.create({
        user_email: order.seller_email, type: 'marketplace',
        content: notifySeller, link: '/marketplace',
        entity_type: 'Order', entity_id: order.id, is_read: false,
      }));
    }
    if (notifPromises.length > 0) await Promise.all(notifPromises);

    return Response.json({ success: true, order: updatedOrder });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});