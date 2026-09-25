const { Resend } = require('resend');

module.exports = async (req, res) => {
    if (req.method !== 'GET') return res.status(405).end();

    const { type, child, parent, email, activity, period, amount } = req.query;
    if (!email || !child || !type) {
        return res.status(400).send('Paramètres manquants');
    }

    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const today = new Date().toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' });

        const docLabels = {
            'inscription': "Attestation d'inscription",
            'fiscale': 'Attestation fiscale',
            'mutuelle': 'Attestation mutuelle'
        };

        let docHtml = '';

        if (type === 'inscription') {
            docHtml = `
                <div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;padding:40px;border:2px solid #FF6B35;border-radius:12px;">
                    <div style="text-align:center;margin-bottom:30px;">
                        <h1 style="color:#FF6B35;font-size:28px;margin:0;">Jump Stage ASBL</h1>
                        <p style="color:#666;font-size:14px;">Association sans but lucratif — Bruxelles</p>
                    </div>
                    <h2 style="text-align:center;color:#1A1A2E;font-size:22px;margin:30px 0;padding:15px;background:#FFF5F0;border-radius:8px;">ATTESTATION D'INSCRIPTION</h2>
                    <p style="line-height:1.8;font-size:15px;">
                        Je soussigné, <strong>Soufiane Hamouda</strong>, en qualité d'administrateur de l'ASBL <strong>Jump Brussels</strong>,
                        certifie que l'enfant :
                    </p>
                    <div style="background:#f8f8fc;padding:20px;border-radius:8px;margin:20px 0;">
                        <p style="font-size:16px;margin:8px 0;"><strong>Nom de l'enfant :</strong> ${decodeURIComponent(child)}</p>
                        <p style="font-size:16px;margin:8px 0;"><strong>Activité :</strong> ${decodeURIComponent(activity || '-')}</p>
                        <p style="font-size:16px;margin:8px 0;"><strong>Période :</strong> ${decodeURIComponent(period || '-')}</p>
                        <p style="font-size:16px;margin:8px 0;"><strong>Montant payé :</strong> ${decodeURIComponent(amount || '0')}€</p>
                    </div>
                    <p style="line-height:1.8;font-size:15px;">
                        est bien inscrit(e) aux activités organisées par l'ASBL Jump Brussels pour la période mentionnée ci-dessus.
                    </p>
                    <p style="line-height:1.8;font-size:15px;">
                        Cette attestation est délivrée pour servir et valoir ce que de droit.
                    </p>
                    <div style="margin-top:40px;">
                        <p style="font-size:14px;color:#666;">Fait à Bruxelles, le ${today}</p>
                        <p style="font-size:14px;margin-top:20px;"><strong>Soufiane Hamouda</strong><br>Administrateur — Jump Brussels ASBL</p>
                    </div>
                    <div style="margin-top:30px;padding-top:15px;border-top:1px solid #eee;text-align:center;">
                        <p style="font-size:11px;color:#999;">Jump Brussels ASBL — www.jumpstage.be — info.jumpasbl@gmail.com</p>
                    </div>
                </div>`;
        } else if (type === 'fiscale') {
            docHtml = `
                <div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;padding:40px;border:2px solid #FF6B35;border-radius:12px;">
                    <div style="text-align:center;margin-bottom:30px;">
                        <h1 style="color:#FF6B35;font-size:28px;margin:0;">Jump Stage ASBL</h1>
                        <p style="color:#666;font-size:14px;">Association sans but lucratif — Bruxelles</p>
                    </div>
                    <h2 style="text-align:center;color:#1A1A2E;font-size:22px;margin:30px 0;padding:15px;background:#FFF5F0;border-radius:8px;">ATTESTATION FISCALE</h2>
                    <p style="font-size:13px;color:#666;text-align:center;margin-bottom:20px;">Article 113bis du Code des Impôts sur les Revenus — Frais de garde d'enfants</p>
                    <p style="line-height:1.8;font-size:15px;">
                        Je soussigné, <strong>Soufiane Hamouda</strong>, administrateur de l'ASBL <strong>Jump Brussels</strong>,
                        certifie que :
                    </p>
                    <div style="background:#f8f8fc;padding:20px;border-radius:8px;margin:20px 0;">
                        <p style="font-size:16px;margin:8px 0;"><strong>Nom de l'enfant :</strong> ${decodeURIComponent(child)}</p>
                        <p style="font-size:16px;margin:8px 0;"><strong>Nom du parent :</strong> ${decodeURIComponent(parent || '-')}</p>
                        <p style="font-size:16px;margin:8px 0;"><strong>Activité :</strong> ${decodeURIComponent(activity || '-')}</p>
                        <p style="font-size:16px;margin:8px 0;"><strong>Période de garde :</strong> ${decodeURIComponent(period || '-')}</p>
                        <p style="font-size:16px;margin:8px 0;"><strong>Montant total payé :</strong> ${decodeURIComponent(amount || '0')}€</p>
                    </div>
                    <p style="line-height:1.8;font-size:15px;">
                        a participé aux activités sportives et de garde organisées par notre association pendant la période mentionnée.
                        Le montant ci-dessus correspond aux frais de garde effectivement payés et peut être utilisé pour la déduction fiscale
                        prévue à l'article 113bis du CIR 1992.
                    </p>
                    <div style="margin-top:40px;">
                        <p style="font-size:14px;color:#666;">Fait à Bruxelles, le ${today}</p>
                        <p style="font-size:14px;margin-top:20px;"><strong>Soufiane Hamouda</strong><br>Administrateur — Jump Brussels ASBL</p>
                    </div>
                    <div style="margin-top:30px;padding-top:15px;border-top:1px solid #eee;text-align:center;">
                        <p style="font-size:11px;color:#999;">Jump Brussels ASBL — www.jumpstage.be — info.jumpasbl@gmail.com</p>
                    </div>
                </div>`;
        } else if (type === 'mutuelle') {
            docHtml = `
                <div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;padding:40px;border:2px solid #FF6B35;border-radius:12px;">
                    <div style="text-align:center;margin-bottom:30px;">
                        <h1 style="color:#FF6B35;font-size:28px;margin:0;">Jump Stage ASBL</h1>
                        <p style="color:#666;font-size:14px;">Association sans but lucratif — Bruxelles</p>
                    </div>
                    <h2 style="text-align:center;color:#1A1A2E;font-size:22px;margin:30px 0;padding:15px;background:#FFF5F0;border-radius:8px;">ATTESTATION POUR LA MUTUELLE</h2>
                    <p style="line-height:1.8;font-size:15px;">
                        Je soussigné, <strong>Soufiane Hamouda</strong>, administrateur de l'ASBL <strong>Jump Brussels</strong>,
                        certifie que l'enfant :
                    </p>
                    <div style="background:#f8f8fc;padding:20px;border-radius:8px;margin:20px 0;">
                        <p style="font-size:16px;margin:8px 0;"><strong>Nom de l'enfant :</strong> ${decodeURIComponent(child)}</p>
                        <p style="font-size:16px;margin:8px 0;"><strong>Nom du parent :</strong> ${decodeURIComponent(parent || '-')}</p>
                        <p style="font-size:16px;margin:8px 0;"><strong>Activité :</strong> ${decodeURIComponent(activity || '-')}</p>
                        <p style="font-size:16px;margin:8px 0;"><strong>Période :</strong> ${decodeURIComponent(period || '-')}</p>
                        <p style="font-size:16px;margin:8px 0;"><strong>Montant payé :</strong> ${decodeURIComponent(amount || '0')}€</p>
                    </div>
                    <p style="line-height:1.8;font-size:15px;">
                        a participé à des activités sportives encadrées (natation / stages multi-activités) organisées par notre association.
                        Cette attestation est délivrée en vue d'un éventuel remboursement par la mutuelle des frais liés aux activités sportives pour enfants.
                    </p>
                    <div style="margin-top:40px;">
                        <p style="font-size:14px;color:#666;">Fait à Bruxelles, le ${today}</p>
                        <p style="font-size:14px;margin-top:20px;"><strong>Soufiane Hamouda</strong><br>Administrateur — Jump Brussels ASBL</p>
                    </div>
                    <div style="margin-top:30px;padding-top:15px;border-top:1px solid #eee;text-align:center;">
                        <p style="font-size:11px;color:#999;">Jump Brussels ASBL — www.jumpstage.be — info.jumpasbl@gmail.com</p>
                    </div>
                </div>`;
        }

        await resend.emails.send({
            from: 'Jump Stage <noreply@jumpstage.be>',
            to: decodeURIComponent(email),
            subject: `${docLabels[type]} — ${decodeURIComponent(child)}`,
            html: `
                <div style="font-family:Arial,sans-serif;padding:20px;">
                    <p>Bonjour,</p>
                    <p>Veuillez trouver ci-dessous votre <strong>${docLabels[type]}</strong> pour <strong>${decodeURIComponent(child)}</strong>.</p>
                    <p style="color:#666;font-size:13px;margin-bottom:20px;">Vous pouvez imprimer ce document ou l'enregistrer en PDF (Fichier → Imprimer → Enregistrer en PDF).</p>
                    ${docHtml}
                </div>
            `
        });

        // Notify admin
        await resend.emails.send({
            from: 'Jump Stage <noreply@jumpstage.be>',
            to: 'info.jumpasbl@gmail.com',
            subject: `Document envoyé — ${docLabels[type]} — ${decodeURIComponent(child)}`,
            html: `<p>Le document <strong>${docLabels[type]}</strong> a été envoyé à <strong>${decodeURIComponent(email)}</strong> pour <strong>${decodeURIComponent(child)}</strong>.</p>`
        });

        res.status(200).send(`
            <html><body style="font-family:Arial;text-align:center;padding:60px;">
                <h1 style="color:#4CAF50;">Document envoyé !</h1>
                <p>L'attestation a été envoyée par email à <strong>${decodeURIComponent(email)}</strong>.</p>
                <p style="color:#666;">Vous pouvez fermer cette page.</p>
            </body></html>
        `);
    } catch (error) {
        console.error('Send document error:', error.message);
        res.status(500).send('Erreur: ' + error.message);
    }
};
