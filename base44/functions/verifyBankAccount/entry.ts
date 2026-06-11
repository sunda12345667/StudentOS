import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { account_number, bank_code } = await req.json();

    if (!account_number || account_number.length !== 10) {
      return Response.json({ error: 'Account number must be exactly 10 digits' }, { status: 400 });
    }
    if (!bank_code) {
      return Response.json({ error: 'Bank code is required' }, { status: 400 });
    }

    const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecret) return Response.json({ error: 'Server misconfiguration' }, { status: 500 });

    const res = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      { headers: { Authorization: `Bearer ${paystackSecret}` } }
    );
    const data = await res.json();

    if (!data.status) {
      return Response.json({ error: data.message || 'Could not verify account. Please check the details.' }, { status: 400 });
    }

    return Response.json({
      account_name: data.data.account_name,
      account_number: data.data.account_number,
    });
  } catch (error) {
    console.error('verifyBankAccount error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});