const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { Resend } = require('resend');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { mutuelle, childName, parentName, parentEmail, activity, startDate, amount } = req.body;

        if (!childName || !parentEmail || !mutuelle) {
            return res.status(400).json({ error: 'Champs manquants' });
        }

        // For now only Partenamut
        if (mutuelle !== 'partenamut') {
            return res.status(400).json({ error: 'Mutuelle non supportée pour le moment' });
        }

        // Fetch the original Partenamut PDF
        const pdfRes = await fetch('https://www.jumpstage.be/assets/partenamut-form.pdf');
        const pdfBytes = await pdfRes.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const page = pdfDoc.getPages()[0];
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Load signature+cachet
        let stampImage;
        try {
            const stampRes = await fetch('https://www.jumpstage.be/assets/signature-cachet.png');
            const stampBytes = await stampRes.arrayBuffer();
            stampImage = await pdfDoc.embedPng(new Uint8Array(stampBytes));
        } catch (e) {}

        const black = rgb(0, 0, 0);

        // "La direction du club sportif" → après la flèche
        page.drawText('Jump Brussels ASBL', { x: 240, y: 530, font: fontBold, size: 10, color: black });

        // "affilié à la Fédération/Ligue" → après la flèche
        page.drawText('FFBN - Fédération Francophone Belge de Natation', { x: 240, y: 510, font, size: 9, color: black });

        // "certifie que (nom et prénom)" → après la flèche
        page.drawText(childName, { x: 240, y: 490, font: fontBold, size: 11, color: black });

        // "a contracté... à partir du" → dans les petites cases
        if (startDate) {
            const parts = startDate.split('-');
            if (parts.length === 3) {
                // JJ dans la 1ère case, MM dans la 2ème, AAAA dans la 3ème
                page.drawText(parts[2], { x: 340, y: 473, font, size: 9, color: black });
                page.drawText(parts[1], { x: 375, y: 473, font, size: 9, color: black });
                page.drawText(parts[0], { x: 405, y: 473, font, size: 9, color: black });
            }
        }

        // "Sport pratiqué :" → après la flèche
        const sportLabel = activity || 'Natation / Stages multi-activités';
        page.drawText(sportLabel, { x: 170, y: 450, font, size: 10, color: black });

        // "Montant payé" → dans les cases
        if (amount) {
            page.drawText(amount.toString(), { x: 145, y: 395, font: fontBold, size: 11, color: black });
        }

        // Cachet du club sportif (case gauche)
        if (stampImage) {
            const scale = 90 / stampImage.height;
            page.drawImage(stampImage, { x: 100, y: 270, width: stampImage.width * scale, height: 90 });
        }

        // Signature du responsable (case droite)
        if (stampImage) {
            const sigScale = 65 / stampImage.height;
            page.drawImage(stampImage, { x: 390, y: 285, width: stampImage.width * sigScale, height: 65 });
        }

        const filledPdf = await pdfDoc.save();
        const pdfBase64 = Buffer.from(filledPdf).toString('base64');
        const filename = `Partenamut_${childName.replace(/\s/g, '_')}.pdf`;

        // Send by email
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'Jump Stage <noreply@jumpstage.be>',
            reply_to: 'info.jumpasbl@gmail.com',
            to: parentEmail,
            subject: `Formulaire Partenamut pré-rempli — ${childName}`,
            html: `
                <div style="font-family:Arial,sans-serif;padding:20px;">
                    <h2 style="color:#FF6B35;">Jump Stage — Formulaire mutuelle</h2>
                    <p>Bonjour,</p>
                    <p>Veuillez trouver en pièce jointe le formulaire <strong>Partenamut</strong> pré-rempli pour <strong>${childName}</strong>.</p>
                    <p><strong>Ce qu'il vous reste à faire :</strong></p>
                    <ul>
                        <li>Compléter vos coordonnées (partie haute du formulaire)</li>
                        <li>Envoyer le document à votre mutuelle (en ligne, en agence ou par courrier)</li>
                    </ul>
                    <p>La partie club sportif est déjà complétée avec le cachet et la signature de Jump Brussels ASBL.</p>
                    <p style="color:#999;font-size:12px;margin-top:30px;">Jump Stage ASBL — www.jumpstage.be</p>
                </div>
            `,
            attachments: [{
                filename,
                content: pdfBase64,
                content_type: 'application/pdf'
            }]
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Mutuelle form error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};
