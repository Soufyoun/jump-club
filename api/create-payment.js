const { createMollieClient } = require('@mollie/api-client');

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

        const { amount, description, inscriptionId, redirectUrl } = req.body;

        if (!amount || !description || !inscriptionId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const payment = await mollieClient.payments.create({
            amount: {
                currency: 'EUR',
                value: parseFloat(amount).toFixed(2)
            },
            description: description,
            redirectUrl: redirectUrl || `${req.headers.origin || 'https://jump-club.vercel.app'}/?payment=success&id=${inscriptionId}`,
            webhookUrl: `${req.headers.origin || 'https://jump-club.vercel.app'}/api/webhook-mollie`,
            metadata: {
                inscription_id: inscriptionId
            },
            method: ['bancontact', 'creditcard']
        });

        return res.status(200).json({
            id: payment.id,
            checkoutUrl: payment.getCheckoutUrl()
        });
    } catch (error) {
        console.error('Mollie error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};
