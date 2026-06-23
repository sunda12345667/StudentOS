/**
 * purchaseProduct — Atomic marketplace purchase with double-entry ledger.
 *
 * Digital flow:  buyer pays → escrow released instantly → seller credited to available_earnings
 * Physical flow: buyer pays → funds held in escrow → released on delivery confirmation
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PLATFORM_ACCOUNT = 'platform@studentos.internal';
const DEFAULT_COMMISSION_RATE = 10; // %
const PHYSICAL_HOLD_DAYS = 14;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { item_id, delivery_option, delivery_address, notes } = body;
    if (!item_id) return Response.json({ error: 'item_id is required' }, { status: 400 });

    // ── 1. Fetch item ──────────────────────────────────────────────────────────
    const items = await base44.asServiceRole.entities.MarketItem.filter({ id: item_id });
    const item = items[0];
    if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });
    if (item.status !== 'available') return Response.json({ error: 'Item is no longer available' }, { status: 409 });
    if (item.seller_email === user.email) return Response.json({ error: 'You cannot purchase your own listing' }, { status: 400 });

    const price = item.price;
    const isDigital = item.is_digital;

    // ── 2. Validate buyer wallet ───────────────────────────────────────────────
    const buyerWallets = await base44.asServiceRole.entities.Wallet.filter({ user_email: user.email });
    const buyerWallet = buyerWallets[0];
    if (!buyerWallet) return Response.json({ error: 'Wallet not found. Please fund your wallet first.' }, { status: 400 });
    if (buyerWallet.is_frozen) return Response.json({ error: 'Your account is frozen. Contact support.' }, { status: 403 });
    if ((buyerWallet.wallet_balance || 0) < price) {
      return Response.json({ error: `Insufficient wallet balance. You have ₦${(buyerWallet.wallet_balance || 0).toLocaleString()} but need ₦${price.toLocaleString()}.` }, { status: 400 });
    }

    // ── 3. Fetch / create seller wallet ───────────────────────────────────────
    let sellerWallet;
    const sellerWallets = await base44.asServiceRole.entities.Wallet.filter({ user_email: item.seller_email });
    if (sellerWallets.length > 0) {
      sellerWallet = sellerWallets[0];
    } else {
      sellerWallet = await base44.asServiceRole.entities.Wallet.create({
        user_email: item.seller_email,
        user_name: item.seller_name,
        wallet_balance: 0, pending_earnings: 0, available_earnings: 0,
        total_funded: 0, total_spent: 0, total_earned: 0, total_withdrawn: 0,
      });
    }
    if (sellerWallet.is_frozen) return Response.json({ error: 'Seller account is currently unavailable.' }, { status: 403 });

    // ── 4. Commission calculation ─────────────────────────────────────────────
    let commissionRate = DEFAULT_COMMISSION_RATE;
    const configs = await base44.asServiceRole.entities.CommissionConfig.filter({ is_active: true });
    if (configs.length > 0) {
      const cfg = configs[0];
      const override = (cfg.category_overrides || []).find(o => o.category === item.category);
      commissionRate = override ? override.rate : (cfg.rate || DEFAULT_COMMISSION_RATE);
    }
    const commissionAmount = Math.round((price * commissionRate) / 100);
    const sellerPayout = price - commissionAmount;

    // ── 5. Reference key ──────────────────────────────────────────────────────
    const ref = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const now = new Date().toISOString();

    // ── 6. Debit buyer wallet immediately ─────────────────────────────────────
    const buyerNewBalance = (buyerWallet.wallet_balance || 0) - price;
    await base44.asServiceRole.entities.Wallet.update(buyerWallet.id, {
      wallet_balance: buyerNewBalance,
      total_spent: (buyerWallet.total_spent || 0) + price,
    });

    // ── 7. Credit seller (digital=available_earnings immediately, physical=pending_earnings) ─
    let sellerNewPending = sellerWallet.pending_earnings || 0;
    let sellerNewAvailable = sellerWallet.available_earnings || 0;
    if (isDigital) {
      sellerNewAvailable += sellerPayout;
    } else {
      sellerNewPending += sellerPayout;
    }
    await base44.asServiceRole.entities.Wallet.update(sellerWallet.id, {
      pending_earnings: sellerNewPending,
      available_earnings: sellerNewAvailable,
      total_earned: (sellerWallet.total_earned || 0) + sellerPayout,
    });

    // ── 8. Auto-release date (physical only) ─────────────────────────────────
    const autoReleaseAt = isDigital ? now : new Date(Date.now() + PHYSICAL_HOLD_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // ── 9. Create Order ────────────────────────────────────────────────────────
    // Digital: status=completed, escrow_released=true immediately
    // Physical: status=paid, awaiting seller to approve/ship
    const order = await base44.asServiceRole.entities.Order.create({
      reference: ref,
      item_id: item.id,
      item_title: item.title,
      item_image: item.image_url,
      item_type: isDigital ? 'digital' : 'physical',
      buyer_email: user.email,
      buyer_name: user.full_name,
      seller_email: item.seller_email,
      seller_name: item.seller_name,
      price,
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
      seller_payout: sellerPayout,
      delivery_option: delivery_option || (isDigital ? 'digital' : 'pickup'),
      delivery_address: delivery_address || '',
      notes: notes || '',
      status: isDigital ? 'completed' : 'paid',
      escrow_released: isDigital,
      auto_release_at: autoReleaseAt,
      buyer_confirmed_at: isDigital ? now : null,
    });

    // ── 10. EarningsEscrow ────────────────────────────────────────────────────
    await base44.asServiceRole.entities.EarningsEscrow.create({
      order_id: order.id,
      seller_email: item.seller_email,
      seller_name: item.seller_name,
      buyer_email: user.email,
      item_id: item.id,
      item_title: item.title,
      item_type: isDigital ? 'digital' : 'physical',
      gross_amount: price,
      commission_amount: commissionAmount,
      net_amount: sellerPayout,
      status: isDigital ? 'released' : 'holding',
      hold_until: autoReleaseAt,
      released_at: isDigital ? now : null,
      release_trigger: isDigital ? 'buyer_confirmed' : null,
    });

    // ── 11. Double-entry Ledger ────────────────────────────────────────────────
    if (isDigital) {
      // Digital: buyer wallet → seller available (direct, no escrow hold)
      await Promise.all([
        base44.asServiceRole.entities.Ledger.create({
          entry_id: `${ref}-PURCHASE`,
          transaction_ref: ref, order_id: order.id,
          debit_account: user.email, credit_account: item.seller_email,
          debit_type: 'wallet_balance', credit_type: 'available_earnings',
          amount: sellerPayout,
          description: `Digital purchase: ${item.title}`,
          entry_type: 'purchase',
        }),
        base44.asServiceRole.entities.Ledger.create({
          entry_id: `${ref}-COMMISSION`,
          transaction_ref: ref, order_id: order.id,
          debit_account: user.email, credit_account: PLATFORM_ACCOUNT,
          debit_type: 'wallet_balance', credit_type: 'platform_revenue',
          amount: commissionAmount,
          description: `Commission (${commissionRate}%): ${item.title}`,
          entry_type: 'commission',
        }),
      ]);
    } else {
      // Physical: buyer wallet → escrow → seller pending (held)
      await Promise.all([
        base44.asServiceRole.entities.Ledger.create({
          entry_id: `${ref}-PURCHASE`,
          transaction_ref: ref, order_id: order.id,
          debit_account: user.email, credit_account: 'escrow@studentos.internal',
          debit_type: 'wallet_balance', credit_type: 'escrow',
          amount: price,
          description: `Purchase (escrow hold): ${item.title}`,
          entry_type: 'purchase',
        }),
        base44.asServiceRole.entities.Ledger.create({
          entry_id: `${ref}-SALE`,
          transaction_ref: ref, order_id: order.id,
          debit_account: 'escrow@studentos.internal', credit_account: item.seller_email,
          debit_type: 'escrow', credit_type: 'pending_earnings',
          amount: sellerPayout,
          description: `Sale credit (pending): ${item.title}`,
          entry_type: 'sale_escrow',
        }),
        base44.asServiceRole.entities.Ledger.create({
          entry_id: `${ref}-COMMISSION`,
          transaction_ref: ref, order_id: order.id,
          debit_account: 'escrow@studentos.internal', credit_account: PLATFORM_ACCOUNT,
          debit_type: 'escrow', credit_type: 'platform_revenue',
          amount: commissionAmount,
          description: `Commission (${commissionRate}%): ${item.title}`,
          entry_type: 'commission',
        }),
      ]);
    }

    // ── 12. Transaction records ───────────────────────────────────────────────
    await Promise.all([
      base44.asServiceRole.entities.Transaction.create({
        reference: `${ref}-BUY`,
        user_email: user.email, user_name: user.full_name,
        type: 'purchase', amount: price,
        balance_type: 'wallet_balance',
        balance_before: buyerWallet.wallet_balance || 0, balance_after: buyerNewBalance,
        description: `Purchased: ${item.title}`,
        order_id: order.id, item_id: item.id, item_title: item.title,
        counterparty_email: item.seller_email, counterparty_name: item.seller_name,
        status: 'completed',
      }),
      base44.asServiceRole.entities.Transaction.create({
        reference: `${ref}-SELL`,
        user_email: item.seller_email, user_name: item.seller_name,
        type: 'sale', amount: sellerPayout,
        balance_type: isDigital ? 'available_earnings' : 'pending_earnings',
        balance_before: isDigital ? (sellerWallet.available_earnings || 0) : (sellerWallet.pending_earnings || 0),
        balance_after: isDigital ? sellerNewAvailable : sellerNewPending,
        description: isDigital
          ? `Sale (instant): ${item.title} — Commission ₦${commissionAmount} deducted`
          : `Sale (pending escrow): ${item.title} — Commission ₦${commissionAmount} deducted`,
        order_id: order.id, item_id: item.id, item_title: item.title,
        counterparty_email: user.email, counterparty_name: user.full_name,
        status: 'completed',
      }),
    ]);

    // ── 13. Revenue record ────────────────────────────────────────────────────
    await base44.asServiceRole.entities.Revenue.create({
      source_type: 'commission', order_id: order.id,
      item_id: item.id, item_title: item.title,
      payer_email: user.email, payer_name: user.full_name,
      seller_email: item.seller_email, amount: commissionAmount,
      commission_rate: commissionRate,
      description: `Commission from sale of: ${item.title}`,
      transaction_ref: ref,
    });

    // ── 14. Mark item sold/reserved ───────────────────────────────────────────
    if (isDigital) {
      // Digital items can be re-purchased; keep available unless seller wants sold
    } else {
      await base44.asServiceRole.entities.MarketItem.update(item.id, { status: 'reserved' });
    }

    // ── 15. Notifications ─────────────────────────────────────────────────────
    await Promise.all([
      base44.asServiceRole.entities.Notification.create({
        user_email: user.email, type: 'marketplace',
        content: isDigital
          ? `Purchase successful! Your download for "${item.title}" is ready.`
          : `Order placed! ₦${price.toLocaleString()} is held in escrow until delivery is confirmed.`,
        link: '/marketplace', entity_type: 'Order', entity_id: order.id, is_read: false,
      }),
      base44.asServiceRole.entities.Notification.create({
        user_email: item.seller_email, type: 'marketplace',
        content: isDigital
          ? `New sale! "${item.title}" — ₦${sellerPayout.toLocaleString()} added to your available earnings.`
          : `New order! "${item.title}" — ₦${sellerPayout.toLocaleString()} held in escrow. Please process the order.`,
        link: '/marketplace', entity_type: 'Order', entity_id: order.id, is_read: false,
      }),
    ]);

    return Response.json({
      success: true,
      order_id: order.id,
      reference: ref,
      price,
      commission_amount: commissionAmount,
      seller_payout: sellerPayout,
      is_digital: isDigital,
      file_url: isDigital ? item.file_url : null,
      message: isDigital ? 'Purchase complete! Your download is ready.' : 'Order placed! Payment held in escrow.',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});