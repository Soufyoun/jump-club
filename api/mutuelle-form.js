const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { Resend } = require('resend');

async function loadImages(pdfDoc) {
    let cachetImage, signImage;
    try {
        const cachetRes = await fetch('https://www.jumpstage.be/assets/cachet.png');
        const cachetBytes = await cachetRes.arrayBuffer();
        cachetImage = await pdfDoc.embedPng(new Uint8Array(cachetBytes));
    } catch (e) {}
    try {
        const signRes = await fetch('https://www.jumpstage.be/assets/signature.png');
        const signBytes = await signRes.arrayBuffer();
        signImage = await pdfDoc.embedPng(new Uint8Array(signBytes));
    } catch (e) {}
    return { cachetImage, signImage };
}

async function fillPartenamut({ pdfDoc, childName, activity, startDate, amount }) {
    const page = pdfDoc.getPages()[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { cachetImage, signImage } = await loadImages(pdfDoc);
    const black = rgb(0, 0, 0);

    page.drawText('JUMP ASBL', { x: 240, y: 530, font: fontBold, size: 10, color: black });
    page.drawText('FFBN - Fédération Francophone Belge de Natation', { x: 240, y: 510, font, size: 9, color: black });
    page.drawText(childName, { x: 240, y: 490, font: fontBold, size: 11, color: black });

    if (startDate) {
        const parts = startDate.split('-');
        if (parts.length === 3) {
            page.drawText(parts[2], { x: 340, y: 473, font, size: 9, color: black });
            page.drawText(parts[1], { x: 375, y: 473, font, size: 9, color: black });
            page.drawText(parts[0], { x: 405, y: 473, font, size: 9, color: black });
        }
    }

    const sportLabel = activity || 'Natation / Stages multi-activités';
    page.drawText(sportLabel, { x: 170, y: 450, font, size: 10, color: black });

    if (amount) {
        page.drawText(amount.toString(), { x: 145, y: 395, font: fontBold, size: 11, color: black });
    }

    if (cachetImage) {
        page.drawImage(cachetImage, { x: 65, y: 230, width: 200, height: 160 });
    }
    if (signImage) {
        page.drawImage(signImage, { x: 340, y: 250, width: 200, height: 130 });
    }
}

async function fillSolidaris({ pdfDoc, childName, activity, startDate, endDate, amount }) {
    const page = pdfDoc.getPages()[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { cachetImage, signImage } = await loadImages(pdfDoc);
    const black = rgb(0, 0, 0);

    // "Je soussigné.e :"
    page.drawText('Soufiane Hamouda', { x: 145, y: 365, font: fontBold, size: 10, color: black });

    // "Nom :" (association)
    page.drawText('JUMP ASBL', { x: 95, y: 325, font: fontBold, size: 10, color: black });

    // "Adresse :"
    page.drawText('Rue de Birmingham 12', { x: 115, y: 303, font, size: 9, color: black });

    // "Code postal et localité :"
    page.drawText('1080 Molenbeek-Saint-Jean', { x: 185, y: 283, font, size: 9, color: black });

    // "N° de téléphone :"
    page.drawText('+32 490 21 44 50', { x: 150, y: 263, font, size: 9, color: black });

    // "Nom et prénom du/de la bénéficiaire du service :"
    page.drawText(childName, { x: 295, y: 243, font: fontBold, size: 10, color: black });

    // "Certifie sur l'honneur que la somme de ... €"
    if (amount) {
        page.drawText(amount.toString(), { x: 265, y: 223, font: fontBold, size: 11, color: black });
    }

    // "pour la période du .../.../..... au .../.../...."
    if (startDate) {
        const p = startDate.split('-');
        if (p.length === 3) {
            page.drawText(p[2], { x: 145, y: 203, font, size: 9, color: black });
            page.drawText(p[1], { x: 172, y: 203, font, size: 9, color: black });
            page.drawText(p[0], { x: 197, y: 203, font, size: 9, color: black });
        }
    }
    if (endDate) {
        const p = endDate.split('-');
        if (p.length === 3) {
            page.drawText(p[2], { x: 285, y: 203, font, size: 9, color: black });
            page.drawText(p[1], { x: 312, y: 203, font, size: 9, color: black });
            page.drawText(p[0], { x: 338, y: 203, font, size: 9, color: black });
        }
    }

    // "pour la pratique du sport suivant :"
    const sportLabel = activity || 'Natation / Stages multi-activités';
    page.drawText(sportLabel, { x: 225, y: 183, font, size: 10, color: black });

    // "Date :" (date du jour)
    const today = new Date();
    const dd = today.getDate().toString().padStart(2, '0');
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const yyyy = today.getFullYear();
    page.drawText(dd, { x: 95, y: 163, font, size: 9, color: black });
    page.drawText(mm, { x: 122, y: 163, font, size: 9, color: black });
    page.drawText(yyyy.toString(), { x: 148, y: 163, font, size: 9, color: black });

    // "Signature et cachet :" — sous le texte, dans l'espace vide
    if (cachetImage) {
        page.drawImage(cachetImage, { x: 350, y: 55, width: 200, height: 160 });
    }
    if (signImage) {
        page.drawImage(signImage, { x: 365, y: 40, width: 170, height: 115 });
    }
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { mutuelle, childName, parentName, parentEmail, activity, startDate, endDate, amount } = req.body;

        if (!childName || !parentEmail || !mutuelle) {
            return res.status(400).json({ error: 'Champs manquants' });
        }

        const supported = ['partenamut', 'solidaris'];
        if (!supported.includes(mutuelle)) {
            return res.status(400).json({ error: 'Mutuelle non supportée pour le moment' });
        }

        const pdfUrl = mutuelle === 'partenamut'
            ? 'https://www.jumpstage.be/assets/partenamut-form.pdf'
            : 'https://www.jumpstage.be/assets/solidaris-form.pdf';

        const pdfRes = await fetch(pdfUrl);
        const pdfBytes = await pdfRes.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);

        if (mutuelle === 'partenamut') {
            await fillPartenamut({ pdfDoc, childName, activity, startDate, amount });
        } else {
            await fillSolidaris({ pdfDoc, childName, activity, startDate, endDate, amount });
        }

        const filledPdf = await pdfDoc.save();
        const pdfBase64 = Buffer.from(filledPdf).toString('base64');

        const mutLabel = mutuelle === 'partenamut' ? 'Partenamut' : 'Solidaris';
        const filename = `${mutLabel}_${childName.replace(/\s/g, '_')}.pdf`;

        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'Jump Stage <noreply@jumpstage.be>',
            reply_to: 'info.jumpasbl@gmail.com',
            to: parentEmail,
            subject: `Formulaire ${mutLabel} pré-rempli — ${childName}`,
            html: `
                <div style="font-family:Arial,sans-serif;padding:20px;">
                    <h2 style="color:#FF6B35;">Jump Stage — Formulaire mutuelle</h2>
                    <p>Bonjour,</p>
                    <p>Veuillez trouver en pièce jointe le formulaire <strong>${mutLabel}</strong> pré-rempli pour <strong>${childName}</strong>.</p>
                    <p><strong>Ce qu'il vous reste à faire :</strong></p>
                    <ul>
                        <li>Compléter vos coordonnées (partie haute du formulaire)</li>
                        <li>Coller la vignette de l'enfant${mutuelle === 'solidaris' ? ' (en bas du formulaire)' : ''}</li>
                        <li>Envoyer le document à votre mutuelle (en ligne, en agence ou par courrier)</li>
                    </ul>
                    <p>La partie club sportif est déjà complétée avec le cachet et la signature de JUMP ASBL.</p>
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
