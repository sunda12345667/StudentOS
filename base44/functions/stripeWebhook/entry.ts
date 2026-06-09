import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14';

Deno.serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return Response.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Stripe webhook event:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const metadata = session.metadata || {};

      if (metadata.type !== 'wallet_topup') {
        return Response.json({ received: true });
      }

      const userEmail = metadata.user_email;
      const amount = Number(metadata.amount);

      if (!userEmail || !amount) {
        console.error('Missing user_email or amount in metadata');
        return Response.json({ error: 'Missing metadata' }, { status: 400 });
      }

      const base44 = createClientFromRequest(req);

      // Idempotency: check if this session was already processed
      const existing = await base44.asServiceRole.entities.Transaction.filter({ reference: session.id });
      if (existing.length > 0) {
        console.log('Already processed session:', session.id);
        return Response.json({ received: true });
      }

      // Get or create wallet
      const wallets = await base44.asServiceRole.entities.Wallet.filter({ user_email: userEmail });
      let wallet;
      if (wallets.length > 0) {
        wallet = wallets[0];
      } else {
        wallet = await base44.asServiceRole.entities.Wallet.create({
          user_email: userEmail,
          user_name: metadata.user_name || '',
          balance: 0,
          total_funded: 0,
          total_spent: 0,
          total_earned: 0,
          total_withdrawn: 0,
        });
      }

      const balanceBefore = wallet.balance || 0;
      const balanceAfter = balanceBefore + amount;

      // Update wallet
      await base44.asServiceRole.entities.Wallet.update(wallet.id, {
        balance: balanceAfter,
        total_funded: (wallet.total_funded || 0) + amount,
      });

      // Log transaction
      await base44.asServiceRole.entities.Transaction.create({
        user_email: userEmail,
        type: 'fund',
        amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: `Wallet funded via Stripe`,
        reference: session.id,
        status: 'completed',
      });

      console.log(`Wallet credited: ${userEmail} +${amount} → balance: ${balanceAfter}`);
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('stripeWebhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});