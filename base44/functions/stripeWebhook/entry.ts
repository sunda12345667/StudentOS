import Stripe from 'npm:stripe@14.21.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    let event;
    if (webhookSecret && sig) {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const meta = session.metadata || {};

      if (meta.type === 'wallet_topup' && meta.advertiser_id) {
        const base44 = createClientFromRequest(req);
        const amount = Number(meta.amount);
        const advertiserId = meta.advertiser_id;

        // Update advertiser balance
        const advertisers = await base44.asServiceRole.entities.Advertiser.filter({ id: advertiserId });
        if (advertisers.length > 0) {
          const adv = advertisers[0];
          const newBalance = (adv.balance || 0) + amount;
          await base44.asServiceRole.entities.Advertiser.update(advertiserId, { balance: newBalance });
          console.log(`Topped up ${meta.advertiser_name} by ₦${amount}. New balance: ₦${newBalance}`);
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
});