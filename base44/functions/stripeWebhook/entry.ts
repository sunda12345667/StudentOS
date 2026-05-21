import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));

    // Paystack sends event in body directly
    const event = body;

    if (event.event === 'charge.success') {
      const data = event.data;
      const meta = data.metadata || {};

      if (meta.type === 'wallet_topup' && meta.advertiser_id) {
        const base44 = createClientFromRequest(req);
        const amount = Number(meta.amount);
        const advertiserId = meta.advertiser_id;

        // Verify transaction with Paystack before crediting
        const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
        const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${data.reference}`, {
          headers: { 'Authorization': `Bearer ${paystackSecret}` },
        });
        const verifyData = await verifyRes.json();

        if (!verifyData.status || verifyData.data?.status !== 'success') {
          console.error('Transaction verification failed:', verifyData.message);
          return Response.json({ error: 'Verification failed' }, { status: 400 });
        }

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