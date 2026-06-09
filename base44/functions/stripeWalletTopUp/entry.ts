import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14';

Deno.serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const base44 = createClientFromRequest(req);

    const { amount, success_url, cancel_url, user_email, user_name } = await req.json();

    if (!amount || amount < 100) {
      return Response.json({ error: 'Minimum amount is 100' }, { status: 400 });
    }

    // Create Stripe Checkout session (amount in kobo/cents — use NGN if available, else USD)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'StudentOS Wallet Top-Up', description: `Fund your StudentOS wallet with ₦${amount.toLocaleString()}` },
          unit_amount: Math.round(amount), // treat as cents in USD for now
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: success_url || 'https://app.studentos.com/marketplace?wallet=funded',
      cancel_url: cancel_url || 'https://app.studentos.com/marketplace?wallet=cancelled',
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        type: 'wallet_topup',
        user_email: user_email || '',
        user_name: user_name || '',
        amount: String(amount),
      },
      customer_email: user_email || undefined,
    });

    console.log('Stripe session created:', session.id, 'for', user_email, 'amount:', amount);
    return Response.json({ url: session.url, session_id: session.id });

  } catch (error) {
    console.error('stripeWalletTopUp error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});