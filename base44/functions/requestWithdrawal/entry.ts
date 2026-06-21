/**
 * requestWithdrawal — Submit a withdrawal from available_earnings.
 * Immediately holds the amount (deducts from available_earnings) and creates
 * a pending WithdrawalRequest for admin approval.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const MIN_WITHDRAWAL = 5000; // ₦5,000 default minimum

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount, bank, bank_code, account_number, account_name, note } = await req.json();

    // Validation
    if (!amount || !bank || !account_number || !account_name) {
      return Response.json({ error: 'amount, bank, account_number, and account_name are required' }, { status: 400 });
    }
    if (amount < MIN_WITHDRAWAL) {
      return Response.json({ error: `Minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}` }, { status: 400 });
    }

    // Fetch wallet
    const wallets = await base44.asServiceRole.entities.Wallet.filter({ user_email: user.email });
    const wallet = wallets[0];
    if (!wallet) return Response.json({ error: 'Wallet not found' }, { status: 404 });
    if (wallet.is_frozen) return Response.json({ error: 'Account is frozen. Contact support.' }, { status: 403 });

    const available = wallet.available_earnings || 0;
    if (available < amount) {
      return Response.json({ error: `Insufficient available earnings. You have ₦${available.toLocaleString()} available for withdrawal.` }, { status: 400 });
    }

    // Deduct immediately to prevent double-withdrawal
    const newAvailable = available - amount;
    await base44.asServiceRole.entities.Wallet.update(wallet.id, {
      available_earnings: newAvailable,
      total_withdrawn: (wallet.total_withdrawn || 0) + amount,
    });

    const ref = `WD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // Create withdrawal request
    const wr = await base44.asServiceRole.entities.WithdrawalRequest.create({
      reference: ref,
      user_email: user.email,
      user_name: user.full_name,
      amount,
      bank,
      bank_code,
      account_number,
      account_name,
      note: note || '',
      status: 'pending',
      wallet_id: wallet.id,
    });

    // Ledger entry: available_earnings deducted
    await base44.asServiceRole.entities.Ledger.create({
      entry_id: ref,
      transaction_ref: ref,
      debit_account: user.email,
      credit_account: 'withdrawal_queue@studentos.internal',
      debit_type: 'available_earnings',
      credit_type: 'platform_revenue',
      amount,
      description: `Withdrawal request to ${bank} ${account_number}`,
      entry_type: 'withdrawal',
    });

    // Transaction record
    await base44.asServiceRole.entities.Transaction.create({
      reference: ref,
      user_email: user.email,
      user_name: user.full_name,
      type: 'withdrawal',
      amount,
      balance_type: 'available_earnings',
      balance_before: available,
      balance_after: newAvailable,
      description: `Withdrawal to ${bank} •••${account_number.slice(-4)} — pending admin approval`,
      status: 'pending',
    });

    // Notify user
    await base44.asServiceRole.entities.Notification.create({
      user_email: user.email,
      type: 'marketplace',
      content: `Your withdrawal request of ₦${amount.toLocaleString()} to ${bank} has been submitted and is pending review.`,
      is_read: false,
    });

    return Response.json({ success: true, reference: ref, withdrawal_id: wr.id, message: 'Withdrawal request submitted. Admin will process it shortly.' });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});