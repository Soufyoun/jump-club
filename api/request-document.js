const { Resend } = require('resend');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { action, docType, childName, childLastName, parentName, parentEmail, activity, period, amount, dateStart, dateEnd, nbDays, dayRate, requestId } = req.body;
        const resend = new Resend(process.env.RESEND_API_KEY);

        const docLabels = {
            'inscription': "Attestation d'inscription",
            'fiscale': 'Attestation fiscale',
            'mutuelle': 'Attestation mutuelle'
        };

        if (action === 'request') {
            const id = Date.now().toString(36);
            const approveUrl = `https://www.jumpstage.be/api/send-document?type=${docType}&child=${encodeURIComponent(childName + ' ' + (childLastName || ''))}&parent=${encodeURIComponent(parentName)}&email=${encodeURIComponent(parentEmail)}&activity=${encodeURIComponent(activity || '')}&period=${encodeURIComponent(period || '')}&amount=${encodeURIComponent(amount || '')}&dateStart=${encodeURIComponent(dateStart || '')}&dateEnd=${encodeURIComponent(dateEnd || '')}&nbDays=${encodeURIComponent(nbDays || '')}&dayRate=${encodeURIComponent(dayRate || '')}`;

            await resend.emails.send({
                from: 'Jump Stage <noreply@jumpstage.be>',
                to: 'info.jumpasbl@gmail.com',
                subject: `Demande de document — ${docLabels[docType] || docType} — ${childName} ${childLastName || ''}`,
                html: `
                    <div style="font-family:Arial,sans-serif;padding:20px;">
                        <h2 style="color:#FF6B35;">Nouvelle demande de document</h2>
                        <p><strong>Document :</strong> ${docLabels[docType]}</p>
                        <p><strong>Enfant :</strong> ${childName} ${childLastName || ''}</p>
                        <p><strong>Parent :</strong> ${parentName}</p>
                        <p><strong>Email :</strong> ${parentEmail}</p>
                        <p><strong>Activité :</strong> ${activity || '-'}</p>
                        <p><strong>Période :</strong> ${period || '-'}</p>
                        <p><strong>Montant :</strong> ${amount || '-'}€</p>
                        <div style="margin:24px 0;">
                            <a href="${approveUrl}" style="display:inline-block;padding:14px 32px;background:#4CAF50;color:white;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">Valider et envoyer le document</a>
                        </div>
                        <p style="color:#999;font-size:12px;">Cliquez sur le bouton pour générer et envoyer automatiquement le document au parent.</p>
                    </div>
                `
            });

            return res.status(200).json({ success: true, message: 'Demande envoyée' });
        }

        return res.status(400).json({ error: 'Action invalide' });
    } catch (error) {
        console.error('Document request error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};

module.exports.config = { api: { bodyParser: true } };
