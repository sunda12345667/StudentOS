import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount, bank, bank_code, account_number, account_name } = await req.json();

    if (!amount || amount < 100) return Response.json({ error: 'Minimum withdrawal is ₦100' }, { status: 400 });
    if (!bank || !account_number || !account_name) return Response.json({ error: 'Bank details are required' }, { status: 400 });
    if (account_number.length !== 10) return Response.json({ error: 'Invalid account number' }, { status: 400 });

    // Fetch user wallet
    const wallets = await base44.asServiceRole.entities.Wallet.filter({ user_email: user.email });
    const wallet = wallets[0];
    if (!wallet) return Response.json({ error: 'Wallet not found' }, { status: 404 });

    // Balance check
    if (wallet.balance < amount) {
      return Response.json({ error: `Insufficient balance. Available: ₦${wallet.balance.toLocaleString()}` }, { status: 400 });
    }

    // Duplicate check — prevent same amount + account within 60 seconds
    const recent = await base44.asServiceRole.entities.WithdrawalRequest.filter({
      user_email: user.email,
      account_number,
      status: 'approved',
    });
    const sixtySecondsAgo = Date.now() - 60000;
    const isDuplicate = recent.some(r => new Date(r.created_date).getTime() > sixtySecondsAgo && r.amount === amount);
    if (isDuplicate) {
      return Response.json({ error: 'Duplicate withdrawal detected. Please wait a moment before retrying.' }, { status: 429 });
    }

    const reference = `WD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore - amount;

    // Deduct balance immediately
    await base44.asServiceRole.entities.Wallet.update(wallet.id, {
      balance: balanceAfter,
      total_withdrawn: (wallet.total_withdrawn || 0) + amount,
    });

    // Record transaction
    await base44.asServiceRole.entities.Transaction.create({
      user_email: user.email,
      type: 'withdrawal',
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      description: `Withdrawal to ${account_name} (${bank} ${account_number})`,
      reference,
      status: 'completed',
    });

    // Log withdrawal request as approved
    await base44.asServiceRole.entities.WithdrawalRequest.create({
      user_email: user.email,
      user_name: user.full_name || '',
      amount,
      bank,
      account_number,
      account_name,
      status: 'approved',
      wallet_id: wallet.id,
      reference,
      note: `Instant withdrawal processed`,
    });

    // Notify user
    await base44.asServiceRole.entities.Notification.create({
      user_email: user.email,
      type: 'marketplace',
      content: `Your withdrawal of ₦${amount.toLocaleString()} to ${account_name} (${bank}) has been initiated. Ref: ${reference}`,
      is_read: false,
    });

    // Notify admins
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    for (const admin of admins) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: admin.email,
        type: 'marketplace',
        content: `Withdrawal of ₦${amount.toLocaleString()} by ${user.full_name || user.email} to ${account_name} (${bank} ${account_number}). Ref: ${reference}`,
        is_read: false,
      });
    }

    console.log(`Withdrawal processed: ${user.email} -₦${amount} → ${account_name} (${reference})`);

    return Response.json({
      success: true,
      reference,
      balance_after: balanceAfter,
      message: `₦${amount.toLocaleString()} withdrawal to ${account_name} initiated successfully.`,
    });

  } catch (error) {
    console.error('processWithdrawal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});