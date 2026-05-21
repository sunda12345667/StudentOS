import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createHmac } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecret) {
      console.error('PAYSTACK_SECRET_KEY not set');
      return Response.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    // Read raw body for signature verification
    const rawBody = await req.text();
    const paystackSignature = req.headers.get('x-paystack-signature');

    // Verify Paystack HMAC-SHA512 signature
    if (!paystackSignature) {
      console.error('Missing x-paystack-signature header');
      return Response.json({ error: 'Missing signature' }, { status: 401 });
    }

    const expectedSignature = createHmac('sha512', paystackSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== paystackSignature) {
      console.error('Invalid Paystack webhook signature');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    console.log(`Paystack webhook received: ${event.event}`);

    if (event.event === 'charge.success') {
      const chargeData = event.data;
      const meta = chargeData.metadata || {};
      const reference = chargeData.reference;

      // Only process wallet top-ups
      if (meta.type !== 'wallet_topup' || !meta.advertiser_id) {
        return Response.json({ received: true });
      }

      // Server-side verification against Paystack API
      const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { 'Authorization': `Bearer ${paystackSecret}` },
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.status || verifyData.data?.status !== 'success') {
        console.error('Transaction verification failed for ref:', reference, verifyData.message);
        return Response.json({ error: 'Payment verification failed' }, { status: 400 });
      }

      // Use verified amount from Paystack (kobo → naira), not metadata
      const verifiedAmountNaira = verifyData.data.amount / 100;
      const advertiserId = meta.advertiser_id;

      const base44 = createClientFromRequest(req);
      const advertisers = await base44.asServiceRole.entities.Advertiser.filter({ id: advertiserId });

      if (advertisers.length === 0) {
        console.error('Advertiser not found:', advertiserId);
        return Response.json({ error: 'Advertiser not found' }, { status: 404 });
      }

      const adv = advertisers[0];

      // Idempotency: check if this reference was already processed
      // Store the reference in notes or use a dedicated field check
      const existingTx = await base44.asServiceRole.entities.Transaction.filter({ reference });
      if (existingTx.length > 0) {
        console.log(`Reference ${reference} already processed. Skipping.`);
        return Response.json({ received: true });
      }

      const newBalance = (adv.balance || 0) + verifiedAmountNaira;
      await base44.asServiceRole.entities.Advertiser.update(advertiserId, { balance: newBalance });

      // Log transaction record
      await base44.asServiceRole.entities.Transaction.create({
        user_email: adv.contact_email,
        type: 'fund',
        amount: verifiedAmountNaira,
        balance_after: newBalance,
        description: `Wallet funded via Paystack`,
        reference,
        status: 'completed',
      });

      console.log(`Wallet credited: ${adv.company_name} +₦${verifiedAmountNaira} → balance: ₦${newBalance} (ref: ${reference})`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('paystackWebhook error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
});