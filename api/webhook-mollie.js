const { createMollieClient } = require('@mollie/api-client');
const { Resend } = require('resend');

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
            const supabaseUrl = 'https://zcxspkeaybrcaljgdapb.supabase.co';
            const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeHNwa2VheWJyY2FsamdkYXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjk4NzEsImV4cCI6MjA5MTc0NTg3MX0.JeBvtDg0Txl6a_1vHNft3WZBR47BXLtOSE81gGeIzi0';
            const headers = {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            };

            // Update payment status
            await fetch(`${supabaseUrl}/rest/v1/inscriptions?id=eq.${inscriptionId}`, {
                method: 'PATCH',
                headers: { ...headers, 'Prefer': 'return=minimal' },
                body: JSON.stringify({ payment_status: 'paid', payment_id: paymentId })
            });

            // Get inscription data for email
            const insRes = await fetch(`${supabaseUrl}/rest/v1/inscriptions?id=eq.${inscriptionId}&select=*`, { headers });
            const insData = await insRes.json();

            if (Array.isArray(insData) && insData.length > 0) {
                const ins = insData[0];
                const resend = new Resend(process.env.RESEND_API_KEY);

                const activityLabels = {
                    'natation-ixelles': 'Natation — Ixelles',
                    'natation-molenbeek': 'Natation — Molenbeek',
                    'natation-molenbeek-2x': 'Natation — Molenbeek (2x/semaine)',
                    'stage-start-molenbeek': 'Jumpy Start — Molenbeek',
                    'stage-boost-molenbeek': 'Jumpy Boost — Molenbeek',
                    'stage-go-molenbeek': 'Jumpy Go — Molenbeek',
                    'stage-start-uccle': 'Jumpy Start — Uccle',
                    'stage-boost-uccle': 'Jumpy Boost — Uccle',
                    'stage-go-uccle': 'Jumpy Go — Uccle'
                };
                const actLabel = activityLabels[ins.activity] || ins.activity;
                const restant = (ins.price || 0) - 30;

                // Email au parent
                if (ins.parent_email) {
                    await resend.emails.send({
                        from: 'Jump Stage <noreply@jumpstage.be>',
                        reply_to: 'info.jumpasbl@gmail.com',
                        to: ins.parent_email,
                        subject: `Confirmation d'inscription — ${ins.child_name} ${ins.child_last_name || ''}`,
                        html: `
                            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                                <div style="text-align:center;margin-bottom:30px;">
                                    <h1 style="color:#FF6B35;margin:0;">Jump Stage</h1>
                                    <p style="color:#666;">Confirmation d'inscription</p>
                                </div>
                                <p>Bonjour <strong>${ins.parent_last_name || ''} ${ins.parent_name || ''}</strong>,</p>
                                <p>L'inscription de <strong>${ins.child_name} ${ins.child_last_name || ''}</strong> (${ins.child_age || ''} ans) est confirmée !</p>
                                <div style="background:#FFF5F0;border-radius:12px;padding:20px;margin:20px 0;">
                                    <h3 style="color:#FF6B35;margin-top:0;">Récapitulatif</h3>
                                    <p><strong>Activité :</strong> ${actLabel}</p>
                                    <p><strong>Période :</strong> ${ins.period || ''}</p>
                                    ${ins.swim_group ? `<p><strong>Groupe :</strong> ${ins.swim_group}</p>` : ''}
                                    ${ins.time_slot ? `<p><strong>Créneau :</strong> ${ins.time_slot}</p>` : ''}
                                    <p><strong>Acompte payé :</strong> 30€</p>
                                    <p><strong>Restant à payer :</strong> ${restant}€</p>
                                </div>
                                <p style="background:#E8F5E9;padding:15px;border-radius:8px;border-left:4px solid #4CAF50;"><strong>✅ Acompte de 30€ confirmé.</strong> Le montant restant (${restant}€) vous sera communiqué par email.</p>
                                <p>À très bientôt chez Jump Stage !</p>
                                <p style="color:#999;font-size:12px;margin-top:30px;">Jump Stage ASBL — Bruxelles<br><a href="https://www.jumpstage.be" style="color:#FF6B35;">www.jumpstage.be</a></p>
                            </div>
                        `
                    });
                }

                // Notification admin
                await resend.emails.send({
                    from: 'Jump Stage <noreply@jumpstage.be>',
                    reply_to: 'info.jumpasbl@gmail.com',
                    to: 'info.jumpasbl@gmail.com',
                    subject: `Nouvelle inscription PAYÉE — ${ins.child_name} ${ins.child_last_name || ''} — ${actLabel}`,
                    html: `
                        <div style="font-family:Arial,sans-serif;padding:20px;">
                            <h2 style="color:#4CAF50;">Inscription confirmée (acompte 30€ payé)</h2>
                            <p><strong>Enfant :</strong> ${ins.child_last_name || ''} ${ins.child_name || ''} (${ins.child_age || ''} ans)</p>
                            <p><strong>Parent :</strong> ${ins.parent_last_name || ''} ${ins.parent_name || ''}</p>
                            <p><strong>Email :</strong> ${ins.parent_email}</p>
                            <p><strong>Téléphone :</strong> ${ins.parent_phone || ''}</p>
                            <p><strong>Activité :</strong> ${actLabel}</p>
                            <p><strong>Période :</strong> ${ins.period || ''}</p>
                            ${ins.swim_group ? `<p><strong>Groupe :</strong> ${ins.swim_group}</p>` : ''}
                            ${ins.time_slot ? `<p><strong>Créneau :</strong> ${ins.time_slot}</p>` : ''}
                            <p><strong>Prix total :</strong> ${ins.price || 0}€</p>
                            <p><strong>Acompte payé :</strong> 30€</p>
                            <p><strong>Restant :</strong> ${restant}€</p>
                        </div>
                    `
                });
            }
        }

        return res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};
