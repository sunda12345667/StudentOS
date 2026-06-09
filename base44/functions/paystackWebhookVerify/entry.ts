import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Called directly from the frontend after Paystack redirects back.
 * Verifies the transaction with Paystack and credits the wallet immediately
 * (idempotent — safe to call even if the webhook already ran).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { reference, user_email, user_name } = await req.json().catch(() => ({}));
    if (!reference) return Response.json({ error: 'Missing reference' }, { status: 400 });

    // Only allow crediting the authenticated user's own wallet
    if (user_email && user_email !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecret) return Response.json({ error: 'Payment gateway not configured' }, { status: 500 });

    // Verify with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { 'Authorization': `Bearer ${paystackSecret}` },
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data?.status !== 'success') {
      console.error('Verification failed:', reference, verifyData.message);
      return Response.json({ credited: false, error: 'Payment not confirmed by Paystack' });
    }

    const amountNaira = verifyData.data.amount / 100;

    // Idempotency: skip if already processed
    const existingTx = await base44.asServiceRole.entities.Transaction.filter({ reference });
    if (existingTx.length > 0) {
      console.log(`Reference ${reference} already processed (idempotent).`);
      // Return the current wallet so frontend can update
      const wallets = await base44.asServiceRole.entities.Wallet.filter({ user_email: user.email });
      return Response.json({ credited: true, balance: wallets[0]?.balance || 0 });
    }

    // Get or create wallet
    const wallets = await base44.asServiceRole.entities.Wallet.filter({ user_email: user.email });
    let wallet = wallets[0];
    if (!wallet) {
      wallet = await base44.asServiceRole.entities.Wallet.create({
        user_email: user.email,
        user_name: user_name || user.full_name || '',
        balance: 0, total_funded: 0, total_spent: 0, total_earned: 0, total_withdrawn: 0,
      });
    }

    const newBalance = (wallet.balance || 0) + amountNaira;

    await base44.asServiceRole.entities.Wallet.update(wallet.id, {
      balance: newBalance,
      total_funded: (wallet.total_funded || 0) + amountNaira,
    });

    await base44.asServiceRole.entities.Transaction.create({
      user_email: user.email,
      type: 'fund',
      amount: amountNaira,
      balance_before: wallet.balance || 0,
      balance_after: newBalance,
      description: `Wallet funded via Paystack`,
      reference,
      status: 'completed',
    });

    console.log(`Wallet credited immediately: ${user.email} +₦${amountNaira} (ref: ${reference})`);
    return Response.json({ credited: true, balance: newBalance });
  } catch (error) {
    console.error('paystackWebhookVerify error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});