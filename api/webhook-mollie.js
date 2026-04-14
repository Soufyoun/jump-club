const { createMollieClient } = require('@mollie/api-client');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

        const paymentId = req.body.id;
        const payment = await mollieClient.payments.get(paymentId);

        const inscriptionId = payment.metadata.inscription_id;
        const isPaid = payment.status === 'paid';

        if (isPaid && inscriptionId) {
            // Update Supabase
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_ANON_KEY;

            await fetch(`${supabaseUrl}/rest/v1/inscriptions?id=eq.${inscriptionId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    payment_status: 'paid',
                    payment_id: paymentId
                })
            });
        }

        return res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};
