import Stripe from 'npm:stripe@14.21.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { amount, advertiser_id, advertiser_email, advertiser_name, success_url, cancel_url } = body;

    if (!amount || amount < 1000) {
      return Response.json({ error: 'Minimum top-up is ₦1,000' }, { status: 400 });
    }

    // Convert Naira to kobo (Stripe smallest unit)
    const amountKobo = Math.round(amount * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'ngn',
          product_data: {
            name: 'EduVerse Ads Wallet Top-Up',
            description: `Add ₦${Number(amount).toLocaleString()} to your advertising wallet`,
          },
          unit_amount: amountKobo,
        },
        quantity: 1,
      }],
      success_url: success_url || 'https://app.base44.com/advertiser?topup=success',
      cancel_url: cancel_url || 'https://app.base44.com/advertiser?topup=cancelled',
      customer_email: advertiser_email,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        advertiser_id,
        advertiser_name,
        amount,
        type: 'wallet_topup',
      },
    });

    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error('Stripe topup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});