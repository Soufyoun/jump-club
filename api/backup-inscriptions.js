const { Resend } = require('resend');

module.exports = async (req, res) => {
    // Secret key to prevent unauthorized access
    const secret = req.query.secret || req.headers['x-backup-secret'];
    if (secret !== process.env.BACKUP_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const supabaseUrl = 'https://zcxspkeaybrcaljgdapb.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeHNwa2VheWJyY2FsamdkYXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjk4NzEsImV4cCI6MjA5MTc0NTg3MX0.JeBvtDg0Txl6a_1vHNft3WZBR47BXLtOSE81gGeIzi0';

        // Fetch all inscriptions
        const response = await fetch(`${supabaseUrl}/rest/v1/inscriptions?order=created_at.desc`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        const inscriptions = await response.json();

        if (!Array.isArray(inscriptions)) {
            return res.status(500).json({ error: 'Supabase error', details: inscriptions });
        }

        if (inscriptions.length === 0) {
            return res.status(200).json({ message: 'No data to backup' });
        }

        // Build CSV
        const headers = ['ID', 'Date', 'Nom enfant', 'Prenom enfant', 'Age', 'Activite', 'Periode', 'Groupe', 'Groupe natation', 'Nom parent', 'Prenom parent', 'Email', 'Telephone', 'Prix', 'Paiement', 'Statut', 'Message'];
        const rows = inscriptions.map(i => [
            i.id,
            i.created_at ? new Date(i.created_at).toLocaleDateString('fr-BE') : '',
            i.child_last_name || '',
            i.child_name || '',
            i.child_age || '',
            i.activity || '',
            i.period || '',
            i.group_name || '',
            i.swim_group || '',
            i.parent_last_name || '',
            i.parent_name || '',
            i.parent_email || '',
            i.parent_phone || '',
            i.price || 0,
            i.payment_method || '',
            i.payment_status || '',
            (i.message || '').replace(/;/g, ',').replace(/\n/g, ' ')
        ]);
        const csv = [headers.join(';'), ...rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(';'))].join('\n');

        const today = new Date().toLocaleDateString('fr-BE');
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
            from: 'Jump Stage <noreply@jumpstage.be>',
            to: 'info.jumpasbl@gmail.com',
            subject: `Backup inscriptions Jump Stage — ${today} (${inscriptions.length} inscrits)`,
            html: `
                <div style="font-family:Arial,sans-serif;padding:20px;">
                    <h2 style="color:#FF6B35;">Backup automatique — Jump Stage</h2>
                    <p>Voici le backup de toutes les inscriptions au ${today}.</p>
                    <p><strong>${inscriptions.length}</strong> inscriptions au total.</p>
                    <p>Le fichier CSV est en pièce jointe.</p>
                    <p style="color:#999;font-size:12px;">Ce backup est envoyé automatiquement chaque semaine.</p>
                </div>
            `,
            attachments: [
                {
                    filename: `backup_inscriptions_${today.replace(/\//g, '-')}.csv`,
                    content: Buffer.from(csv).toString('base64'),
                    content_type: 'text/csv'
                }
            ]
        });

        return res.status(200).json({ success: true, count: inscriptions.length });
    } catch (error) {
        console.error('Backup error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};
