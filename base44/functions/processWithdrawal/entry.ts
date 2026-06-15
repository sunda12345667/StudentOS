import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function paystackPost(path, body) {
  // Read secret inside handler scope — never at module top-level
  const secret = Deno.env.get('PAYSTACK_SECRET_KEY');
  const res = await fetch(`https://api.paystack.co${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount, bank, bank_code, account_number, account_name } = await req.json();

    if (!amount || amount < 100) return Response.json({ error: 'Minimum withdrawal is ₦100' }, { status: 400 });
    if (!bank || !bank_code || !account_number || !account_name) return Response.json({ error: 'Bank details are required' }, { status: 400 });
    if (account_number.length !== 10) return Response.json({ error: 'Invalid account number' }, { status: 400 });

    // Fetch user wallet
    const wallets = await base44.asServiceRole.entities.Wallet.filter({ user_email: user.email });
    const wallet = wallets[0];
    if (!wallet) return Response.json({ error: 'Wallet not found' }, { status: 404 });

    // Balance check (amount in Naira, Paystack transfers in kobo)
    if (wallet.balance < amount) {
      return Response.json({ error: `Insufficient balance. Available: ₦${wallet.balance.toLocaleString()}` }, { status: 400 });
    }

    // Duplicate check — prevent same amount + account within 30 seconds
    // Only check 'pending' status to avoid blocking legitimate retries
    const recent = await base44.asServiceRole.entities.WithdrawalRequest.filter({
      user_email: user.email,
      account_number,
    });
    const thirtySecondsAgo = Date.now() - 30000;
    const isDuplicate = recent.some(
      r => new Date(r.created_date).getTime() > thirtySecondsAgo && r.amount === amount && r.status === 'pending'
    );
    if (isDuplicate) {
      return Response.json({ error: 'Duplicate withdrawal detected. Please wait a moment before retrying.' }, { status: 429 });
    }

    const reference = `WD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Step 1: Create a transfer recipient on Paystack
    const recipientRes = await paystackPost('/transferrecipient', {
      type: 'nuban',
      name: account_name,
      account_number,
      bank_code,
      currency: 'NGN',
    });

    if (!recipientRes.status || !recipientRes.data?.recipient_code) {
      console.error('Paystack create recipient failed:', JSON.stringify(recipientRes));
      return Response.json({ error: recipientRes.message || 'Could not create transfer recipient. Please check bank details.' }, { status: 400 });
    }

    const recipient_code = recipientRes.data.recipient_code;

    // Step 2: Initiate the transfer (amount in kobo)
    const transferRes = await paystackPost('/transfer', {
      source: 'balance',
      amount: amount * 100, // convert Naira → kobo
      recipient: recipient_code,
      reason: `StudentOS withdrawal by ${user.full_name || user.email}`,
      reference,
    });

    console.log('Paystack transfer response:', JSON.stringify(transferRes));

    if (!transferRes.status) {
      console.error('Paystack transfer failed:', JSON.stringify(transferRes));
      return Response.json({ error: transferRes.message || 'Transfer failed. Please try again.' }, { status: 400 });
    }

    const transferStatus = transferRes.data?.status || 'pending';
    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore - amount;

    // Deduct balance only after successful Paystack response
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
      status: transferStatus === 'success' ? 'completed' : 'pending',
    });

    // Log withdrawal request as pending (not approved) until bank confirms
    await base44.asServiceRole.entities.WithdrawalRequest.create({
      user_email: user.email,
      user_name: user.full_name || '',
      amount,
      bank,
      bank_code,
      account_number,
      account_name,
      status: 'pending',
      wallet_id: wallet.id,
      reference,
      note: `Paystack transfer ${transferStatus}. Recipient: ${recipient_code}`,
    });

    // Notify user in-app
    await base44.asServiceRole.entities.Notification.create({
      user_email: user.email,
      type: 'marketplace',
      content: `Your withdrawal of ₦${amount.toLocaleString()} to ${account_name} (${bank}) is being processed. Ref: ${reference}`,
      is_read: false,
    });

    // Notify admins
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    for (const admin of admins) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: admin.email,
        type: 'marketplace',
        content: `Withdrawal of ₦${amount.toLocaleString()} by ${user.full_name || user.email} to ${account_name} (${bank} ${account_number}). Paystack status: ${transferStatus}. Ref: ${reference}`,
        is_read: false,
      });
    }

    console.log(`Withdrawal initiated: ${user.email} -₦${amount} → ${account_name} (${reference}) Paystack status: ${transferStatus}`);

    return Response.json({
      success: true,
      reference,
      transfer_status: transferStatus,
      balance_after: balanceAfter,
      message: `₦${amount.toLocaleString()} withdrawal initiated to ${account_name}'s bank account. Funds typically arrive within minutes.`,
    });

  } catch (error) {
    console.error('processWithdrawal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});