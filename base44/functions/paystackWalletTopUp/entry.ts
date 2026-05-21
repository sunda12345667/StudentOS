import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { amount, success_url, cancel_url } = body;

    if (!amount || amount < 100) {
      return Response.json({ error: 'Minimum top-up is ₦100' }, { status: 400 });
    }

    const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecret) {
      return Response.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(amount * 100), // Naira to kobo
        currency: 'NGN',
        callback_url: success_url,
        metadata: {
          user_email: user.email,
          user_name: user.full_name,
          amount: String(amount),
          type: 'student_wallet_topup',
        },
        channels: ['card', 'bank', 'ussd', 'mobile_money', 'bank_transfer'],
      }),
    });

    const data = await response.json();

    if (!data.status) {
      console.error('Paystack init error:', data.message);
      return Response.json({ error: data.message || 'Failed to initialize payment' }, { status: 500 });
    }

    console.log(`Student wallet top-up for ${user.email} - ₦${amount} - ref: ${data.data.reference}`);
    return Response.json({
      url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (error) {
    console.error('paystackWalletTopUp error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});