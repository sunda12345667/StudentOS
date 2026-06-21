/**
 * purchaseProduct — Atomic marketplace purchase with double-entry ledger.
 *
 * Flow:
 *  1. Validate buyer wallet (balance, frozen)
 *  2. Fetch commission config
 *  3. Debit buyer wallet_balance
 *  4. Credit seller pending_earnings (net after commission)
 *  5. Credit platform revenue account
 *  6. Write double-entry ledger records
 *  7. Create Order + EarningsEscrow + Transactions + Revenue record
 *  8. Notify buyer and seller
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PLATFORM_ACCOUNT = 'platform@studentos.internal';
const DEFAULT_COMMISSION_RATE = 10; // %
const DIGITAL_HOLD_DAYS = 5;
const PHYSICAL_HOLD_DAYS = 14;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { item_id } = body;
    if (!item_id) return Response.json({ error: 'item_id is required' }, { status: 400 });

    // ── 1. Fetch item ─────────────────────────────────────────────────────────
    const items = await base44.entities.MarketItem.filter({ id: item_id });
    const item = items[0];
    if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });
    if (item.status !== 'available') return Response.json({ error: 'Item is no longer available' }, { status: 409 });
    if (item.seller_email === user.email) return Response.json({ error: 'You cannot purchase your own listing' }, { status: 400 });

    const price = item.price;
    const itemType = item.is_digital ? 'digital' : 'physical';

    // ── 2. Fetch & validate buyer wallet ─────────────────────────────────────
    const buyerWallets = await base44.asServiceRole.entities.Wallet.filter({ user_email: user.email });
    const buyerWallet = buyerWallets[0];
    if (!buyerWallet) return Response.json({ error: 'Wallet not found. Please fund your wallet first.' }, { status: 400 });
    if (buyerWallet.is_frozen) return Response.json({ error: 'Your account is frozen. Contact support.' }, { status: 403 });
    if ((buyerWallet.wallet_balance || 0) < price) {
      return Response.json({ error: `Insufficient wallet balance. You have ₦${buyerWallet.wallet_balance || 0} but need ₦${price}.` }, { status: 400 });
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
      // Check category overrides
      const override = (cfg.category_overrides || []).find(o => o.category === item.category);
      commissionRate = override ? override.rate : (cfg.rate || DEFAULT_COMMISSION_RATE);
    }
    const commissionAmount = Math.round((price * commissionRate) / 100);
    const sellerPayout = price - commissionAmount;

    // ── 5. Idempotency key ────────────────────────────────────────────────────
    const ref = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // ── 6. Atomic balance updates ─────────────────────────────────────────────
    const buyerNewBalance = (buyerWallet.wallet_balance || 0) - price;
    const sellerNewPending = (sellerWallet.pending_earnings || 0) + sellerPayout;

    await Promise.all([
      base44.asServiceRole.entities.Wallet.update(buyerWallet.id, {
        wallet_balance: buyerNewBalance,
        total_spent: (buyerWallet.total_spent || 0) + price,
      }),
      base44.asServiceRole.entities.Wallet.update(sellerWallet.id, {
        pending_earnings: sellerNewPending,
        total_earned: (sellerWallet.total_earned || 0) + sellerPayout,
      }),
    ]);

    // ── 7. Auto-release date ───────────────────────────────────────────────────
    const holdDays = itemType === 'digital' ? DIGITAL_HOLD_DAYS : PHYSICAL_HOLD_DAYS;
    const autoReleaseAt = new Date(Date.now() + holdDays * 24 * 60 * 60 * 1000).toISOString();

    // ── 8. Create Order ────────────────────────────────────────────────────────
    const order = await base44.asServiceRole.entities.Order.create({
      reference: ref,
      item_id: item.id,
      item_title: item.title,
      item_image: item.image_url,
      item_type: itemType,
      buyer_email: user.email,
      buyer_name: user.full_name,
      seller_email: item.seller_email,
      seller_name: item.seller_name,
      price,
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
      seller_payout: sellerPayout,
      delivery_option: itemType === 'digital' ? 'digital' : 'pickup',
      status: 'paid',
      escrow_released: false,
      auto_release_at: autoReleaseAt,
    });

    // ── 9. EarningsEscrow ─────────────────────────────────────────────────────
    await base44.asServiceRole.entities.EarningsEscrow.create({
      order_id: order.id,
      seller_email: item.seller_email,
      seller_name: item.seller_name,
      buyer_email: user.email,
      item_id: item.id,
      item_title: item.title,
      item_type: itemType,
      gross_amount: price,
      commission_amount: commissionAmount,
      net_amount: sellerPayout,
      status: 'holding',
      hold_until: autoReleaseAt,
    });

    // ── 10. Double-entry Ledger records ───────────────────────────────────────
    await Promise.all([
      // Entry 1: Buyer wallet → Escrow (purchase debit)
      base44.asServiceRole.entities.Ledger.create({
        entry_id: `${ref}-PURCHASE`,
        transaction_ref: ref,
        order_id: order.id,
        debit_account: user.email,
        credit_account: 'escrow@studentos.internal',
        debit_type: 'wallet_balance',
        credit_type: 'escrow',
        amount: price,
        description: `Purchase: ${item.title}`,
        entry_type: 'purchase',
      }),
      // Entry 2: Escrow → Seller pending (sale credit, net of commission)
      base44.asServiceRole.entities.Ledger.create({
        entry_id: `${ref}-SALE`,
        transaction_ref: ref,
        order_id: order.id,
        debit_account: 'escrow@studentos.internal',
        credit_account: item.seller_email,
        debit_type: 'escrow',
        credit_type: 'pending_earnings',
        amount: sellerPayout,
        description: `Sale credit (pending): ${item.title}`,
        entry_type: 'sale_escrow',
      }),
      // Entry 3: Escrow → Platform (commission)
      base44.asServiceRole.entities.Ledger.create({
        entry_id: `${ref}-COMMISSION`,
        transaction_ref: ref,
        order_id: order.id,
        debit_account: 'escrow@studentos.internal',
        credit_account: PLATFORM_ACCOUNT,
        debit_type: 'escrow',
        credit_type: 'platform_revenue',
        amount: commissionAmount,
        description: `Commission (${commissionRate}%): ${item.title}`,
        entry_type: 'commission',
      }),
    ]);

    // ── 11. Transaction records ────────────────────────────────────────────────
    await Promise.all([
      // Buyer transaction
      base44.asServiceRole.entities.Transaction.create({
        reference: `${ref}-BUY`,
        user_email: user.email,
        user_name: user.full_name,
        type: 'purchase',
        amount: price,
        balance_type: 'wallet_balance',
        balance_before: buyerWallet.wallet_balance || 0,
        balance_after: buyerNewBalance,
        description: `Purchased: ${item.title}`,
        order_id: order.id,
        item_id: item.id,
        item_title: item.title,
        counterparty_email: item.seller_email,
        counterparty_name: item.seller_name,
        status: 'completed',
      }),
      // Seller transaction
      base44.asServiceRole.entities.Transaction.create({
        reference: `${ref}-SELL`,
        user_email: item.seller_email,
        user_name: item.seller_name,
        type: 'sale',
        amount: sellerPayout,
        balance_type: 'pending_earnings',
        balance_before: sellerWallet.pending_earnings || 0,
        balance_after: sellerNewPending,
        description: `Sale (pending): ${item.title} — Commission ₦${commissionAmount} deducted`,
        order_id: order.id,
        item_id: item.id,
        item_title: item.title,
        counterparty_email: user.email,
        counterparty_name: user.full_name,
        status: 'completed',
      }),
    ]);

    // ── 12. Revenue record ─────────────────────────────────────────────────────
    await base44.asServiceRole.entities.Revenue.create({
      source_type: 'commission',
      order_id: order.id,
      item_id: item.id,
      item_title: item.title,
      payer_email: user.email,
      payer_name: user.full_name,
      seller_email: item.seller_email,
      amount: commissionAmount,
      commission_rate: commissionRate,
      description: `Commission from sale of: ${item.title}`,
      transaction_ref: ref,
    });

    // ── 13. Mark item as sold (digital stays available, physical goes reserved) ─
    if (!item.is_digital) {
      await base44.asServiceRole.entities.MarketItem.update(item.id, { status: 'reserved' });
    }

    // ── 14. Notifications ──────────────────────────────────────────────────────
    await Promise.all([
      base44.asServiceRole.entities.Notification.create({
        user_email: user.email,
        type: 'marketplace',
        content: `Purchase successful! You bought "${item.title}" for ₦${price.toLocaleString()}. ${item.is_digital ? 'Your download is ready.' : 'The seller will process your order shortly.'}`,
        link: '/marketplace',
        entity_type: 'Order',
        entity_id: order.id,
        is_read: false,
      }),
      base44.asServiceRole.entities.Notification.create({
        user_email: item.seller_email,
        type: 'marketplace',
        content: `New sale! "${item.title}" was purchased. ₦${sellerPayout.toLocaleString()} is now in your Pending Earnings (releases in ${holdDays} days).`,
        link: '/marketplace',
        entity_type: 'Order',
        entity_id: order.id,
        is_read: false,
      }),
    ]);

    return Response.json({
      success: true,
      order_id: order.id,
      reference: ref,
      price,
      commission_amount: commissionAmount,
      seller_payout: sellerPayout,
      message: `Purchase successful! ${item.is_digital ? 'Your download is ready.' : 'Order created and seller notified.'}`,
      file_url: item.is_digital ? item.file_url : null,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});