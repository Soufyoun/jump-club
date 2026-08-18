const { Resend } = require('resend');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { parentEmail, parentName, childName, childLastName, childAge, activity, period, paymentMethod } = req.body;

        if (!parentEmail || !childName) {
            return res.status(400).json({ error: 'Missing fields' });
        }

        const activityLabels = {
            'natation-ixelles': 'Natation — Ixelles',
            'natation-molenbeek': 'Natation — Molenbeek',
            'stage-start-molenbeek': 'Jumpy Start (3-4 ans) — Molenbeek',
            'stage-boost-molenbeek': 'Jumpy Boost (5-6 ans) — Molenbeek',
            'stage-go-molenbeek': 'Jumpy Go (7-12 ans) — Molenbeek',
            'stage-start-uccle': 'Jumpy Start (3-4 ans) — Uccle',
            'stage-boost-uccle': 'Jumpy Boost (5-6 ans) — Uccle',
            'stage-go-uccle': 'Jumpy Go (7-12 ans) — Uccle'
        };

        const actLabel = activityLabels[activity] || activity;
        const paiement = paymentMethod === 'online' ? 'Paiement en ligne' : 'Paiement en cash';

        // Email au parent
        await resend.emails.send({
            from: 'Jump Stage <onboarding@resend.dev>',
            to: parentEmail,
            subject: `Confirmation d'inscription — ${childName} ${childLastName || ''}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                    <div style="text-align:center;margin-bottom:30px;">
                        <h1 style="color:#FF6B35;margin:0;">Jump Stage</h1>
                        <p style="color:#666;">Confirmation d'inscription</p>
                    </div>
                    <p>Bonjour <strong>${parentName || ''}</strong>,</p>
                    <p>Nous avons bien reçu l'inscription de <strong>${childName} ${childLastName || ''}</strong> (${childAge || ''} ans).</p>
                    <div style="background:#FFF5F0;border-radius:12px;padding:20px;margin:20px 0;">
                        <h3 style="color:#FF6B35;margin-top:0;">Récapitulatif</h3>
                        <p><strong>Activité :</strong> ${actLabel}</p>
                        <p><strong>Période :</strong> ${period || ''}</p>
                        <p><strong>Paiement :</strong> ${paiement}</p>
                    </div>
                    ${paymentMethod === 'cash' ? '<p style="background:#FFF3E0;padding:15px;border-radius:8px;border-left:4px solid #FF6B35;"><strong>⚠️ Rappel :</strong> Votre inscription ne sera validée qu\'après confirmation par un administrateur. Prenez rendez-vous par email à <a href="mailto:info.jumpasbl@gmail.com" style="color:#FF6B35;">info.jumpasbl@gmail.com</a></p>' : ''}
                    <p>À très bientôt chez Jump Stage !</p>
                    <p style="color:#999;font-size:12px;margin-top:30px;">Jump Stage ASBL — Bruxelles<br><a href="https://www.jumpstage.be" style="color:#FF6B35;">www.jumpstage.be</a></p>
                </div>
            `
        });

        // Notification à l'admin
        await resend.emails.send({
            from: 'Jump Stage <onboarding@resend.dev>',
            to: 'info.jumpasbl@gmail.com',
            subject: `Nouvelle inscription — ${childName} ${childLastName || ''} — ${actLabel}`,
            html: `
                <div style="font-family:Arial,sans-serif;padding:20px;">
                    <h2 style="color:#FF6B35;">Nouvelle inscription</h2>
                    <p><strong>Enfant :</strong> ${childName} ${childLastName || ''} (${childAge || ''} ans)</p>
                    <p><strong>Parent :</strong> ${parentName || ''}</p>
                    <p><strong>Email :</strong> ${parentEmail}</p>
                    <p><strong>Activité :</strong> ${actLabel}</p>
                    <p><strong>Période :</strong> ${period || ''}</p>
                    <p><strong>Paiement :</strong> ${paiement}</p>
                </div>
            `
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Email error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};
