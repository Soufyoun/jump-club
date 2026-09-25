const { Resend } = require('resend');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

module.exports = async (req, res) => {
    if (req.method !== 'GET') return res.status(405).end();

    const { type, child, parent, email, activity, period, amount } = req.query;
    if (!email || !child || !type) {
        return res.status(400).send('Paramètres manquants');
    }

    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const today = new Date().toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' });
        const childName = decodeURIComponent(child);
        const parentName = decodeURIComponent(parent || '');
        const activityName = decodeURIComponent(activity || '-');
        const periodName = decodeURIComponent(period || '-');
        const amountVal = decodeURIComponent(amount || '0');
        const emailAddr = decodeURIComponent(email);

        const docLabels = {
            'inscription': "Attestation d'inscription",
            'fiscale': 'Attestation fiscale',
            'mutuelle': 'Attestation mutuelle'
        };
        const docLabel = docLabels[type] || type;

        // Generate PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]); // A4
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const orange = rgb(1, 0.42, 0.21);
        const black = rgb(0.1, 0.1, 0.18);
        const gray = rgb(0.4, 0.4, 0.48);
        const lightBg = rgb(0.97, 0.97, 0.98);

        const w = page.getWidth();
        let y = 780;

        // Header
        page.drawText('JUMP STAGE ASBL', { x: 50, y, font: fontBold, size: 24, color: orange });
        y -= 22;
        page.drawText('Association sans but lucratif — Bruxelles', { x: 50, y, font, size: 10, color: gray });
        y -= 10;
        page.drawLine({ start: { x: 50, y }, end: { x: w - 50, y }, thickness: 2, color: orange });

        // Title
        y -= 40;
        const titleText = docLabel.toUpperCase();
        const titleWidth = fontBold.widthOfTextAtSize(titleText, 18);
        page.drawRectangle({ x: (w - titleWidth) / 2 - 20, y: y - 8, width: titleWidth + 40, height: 32, color: rgb(1, 0.96, 0.94), borderColor: orange, borderWidth: 1 });
        page.drawText(titleText, { x: (w - titleWidth) / 2, y: y, font: fontBold, size: 18, color: black });

        // Body
        y -= 50;
        const bodyLines = [];

        if (type === 'inscription') {
            bodyLines.push(
                'Je soussigne, Soufiane Hamouda, en qualite d\'administrateur de',
                'l\'ASBL Jump Brussels, certifie que l\'enfant :'
            );
        } else if (type === 'fiscale') {
            bodyLines.push(
                'Je soussigne, Soufiane Hamouda, administrateur de l\'ASBL Jump',
                'Brussels, certifie dans le cadre de l\'article 113bis du Code des',
                'Impots sur les Revenus (frais de garde d\'enfants) que :'
            );
        } else {
            bodyLines.push(
                'Je soussigne, Soufiane Hamouda, administrateur de l\'ASBL Jump',
                'Brussels, certifie que l\'enfant :'
            );
        }

        bodyLines.forEach(line => {
            page.drawText(line, { x: 50, y, font, size: 12, color: black });
            y -= 20;
        });

        // Info box
        y -= 10;
        const boxH = type === 'fiscale' ? 130 : 110;
        page.drawRectangle({ x: 50, y: y - boxH + 20, width: w - 100, height: boxH, color: lightBg });

        y -= 5;
        const infoLines = [
            ['Nom de l\'enfant :', childName],
        ];
        if (type === 'fiscale' || type === 'mutuelle') {
            infoLines.push(['Nom du parent :', parentName]);
        }
        infoLines.push(
            ['Activite :', activityName],
            ['Periode :', periodName],
            ['Montant paye :', amountVal + ' EUR']
        );

        infoLines.forEach(([label, value]) => {
            page.drawText(label, { x: 70, y, font: fontBold, size: 12, color: gray });
            page.drawText(value, { x: 230, y, font: fontBold, size: 12, color: black });
            y -= 22;
        });

        // Closing text
        y -= 20;
        const closingLines = [];
        if (type === 'inscription') {
            closingLines.push(
                'est bien inscrit(e) aux activites organisees par l\'ASBL Jump',
                'Brussels pour la periode mentionnee ci-dessus.',
                '',
                'Cette attestation est delivree pour servir et valoir ce que de droit.'
            );
        } else if (type === 'fiscale') {
            closingLines.push(
                'a participe aux activites sportives et de garde organisees par',
                'notre association pendant la periode mentionnee.',
                '',
                'Le montant ci-dessus correspond aux frais de garde effectivement',
                'payes et peut etre utilise pour la deduction fiscale prevue a',
                'l\'article 113bis du CIR 1992.'
            );
        } else {
            closingLines.push(
                'a participe a des activites sportives encadrees (natation / stages',
                'multi-activites) organisees par notre association.',
                '',
                'Cette attestation est delivree en vue d\'un eventuel remboursement',
                'par la mutuelle des frais lies aux activites sportives pour enfants.'
            );
        }

        closingLines.forEach(line => {
            if (line === '') { y -= 10; return; }
            page.drawText(line, { x: 50, y, font, size: 12, color: black });
            y -= 20;
        });

        // Signature
        y -= 40;
        page.drawText('Fait a Bruxelles, le ' + today, { x: 50, y, font, size: 11, color: gray });
        y -= 30;
        page.drawText('Soufiane Hamouda', { x: 50, y, font: fontBold, size: 13, color: black });
        y -= 18;
        page.drawText('Administrateur — Jump Brussels ASBL', { x: 50, y, font, size: 11, color: gray });

        // Footer
        page.drawLine({ start: { x: 50, y: 60 }, end: { x: w - 50, y: 60 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.88) });
        page.drawText('Jump Brussels ASBL — www.jumpstage.be — info.jumpasbl@gmail.com', { x: 120, y: 42, font, size: 9, color: gray });

        const pdfBytes = await pdfDoc.save();
        const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
        const filename = `${docLabel.replace(/[^a-zA-Z0-9]/g, '_')}_${childName.replace(/\s/g, '_')}.pdf`;

        // Send email with PDF attachment
        await resend.emails.send({
            from: 'Jump Stage <noreply@jumpstage.be>',
            to: emailAddr,
            subject: `${docLabel} — ${childName}`,
            html: `
                <div style="font-family:Arial,sans-serif;padding:20px;">
                    <h2 style="color:#FF6B35;">Jump Stage</h2>
                    <p>Bonjour,</p>
                    <p>Veuillez trouver en pièce jointe votre <strong>${docLabel}</strong> pour <strong>${childName}</strong>.</p>
                    <p>Vous pouvez télécharger et imprimer le document PDF ci-joint.</p>
                    <p style="color:#999;font-size:12px;margin-top:30px;">Jump Stage ASBL — www.jumpstage.be</p>
                </div>
            `,
            attachments: [{
                filename,
                content: pdfBase64,
                content_type: 'application/pdf'
            }]
        });

        // Notify admin
        await resend.emails.send({
            from: 'Jump Stage <noreply@jumpstage.be>',
            to: 'info.jumpasbl@gmail.com',
            subject: `Document envoyé — ${docLabel} — ${childName}`,
            html: `<p>Le document <strong>${docLabel}</strong> (PDF) a été envoyé à <strong>${emailAddr}</strong> pour <strong>${childName}</strong>.</p>`
        });

        res.status(200).send(`
            <html><body style="font-family:Arial;text-align:center;padding:60px;">
                <h1 style="color:#4CAF50;">Document PDF envoyé !</h1>
                <p>L'attestation PDF a été envoyée par email à <strong>${emailAddr}</strong>.</p>
                <p style="color:#666;">Vous pouvez fermer cette page.</p>
            </body></html>
        `);
    } catch (error) {
        console.error('Send document error:', error.message);
        res.status(500).send('Erreur: ' + error.message);
    }
};
