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

    // "Je soussigné" → nom du responsable
    page.drawText('Soufiane Shabani — JUMP ASBL', { x: 180, y: 480, font: fontBold, size: 10, color: black });

    // "certifie que le(la) nommé(e)" → nom de l'enfant
    page.drawText(childName, { x: 260, y: 448, font: fontBold, size: 11, color: black });

    // Période du ../../../ au ../../../
    if (startDate) {
        const p = startDate.split('-');
        if (p.length === 3) {
            page.drawText(`${p[2]}/${p[1]}/${p[0]}`, { x: 130, y: 405, font, size: 10, color: black });
        }
    }
    if (endDate) {
        const p = endDate.split('-');
        if (p.length === 3) {
            page.drawText(`${p[2]}/${p[1]}/${p[0]}`, { x: 330, y: 405, font, size: 10, color: black });
        }
    }

    // Montant
    if (amount) {
        page.drawText(amount.toString(), { x: 280, y: 383, font: fontBold, size: 11, color: black });
    }

    // Discipline du club sportif
    const sportLabel = activity || 'Natation / Stages multi-activités';
    page.drawText(sportLabel, { x: 220, y: 360, font, size: 10, color: black });

    // Cachet (en bas à gauche)
    if (cachetImage) {
        page.drawImage(cachetImage, { x: 50, y: 180, width: 180, height: 140 });
    }

    // Date et signature (en bas à droite)
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2,'0')}/${(today.getMonth()+1).toString().padStart(2,'0')}/${today.getFullYear()}`;
    page.drawText(dateStr, { x: 380, y: 310, font, size: 9, color: black });

    if (signImage) {
        page.drawImage(signImage, { x: 350, y: 180, width: 180, height: 120 });
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
