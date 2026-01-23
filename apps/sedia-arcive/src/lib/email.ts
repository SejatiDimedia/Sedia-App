import nodemailer from 'nodemailer';

// Create a reusable transporter using Gmail
// You need to set SMTP_USER (your gmail) and SMTP_PASS (your app password)
const smtpUser = import.meta.env.SMTP_USER || process.env.SMTP_USER;
const smtpPass = import.meta.env.SMTP_PASS || process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: smtpUser,
        pass: smtpPass,
    },
});

export async function sendEmail({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}) {
    // Check if env vars are present
    if (!smtpUser || !smtpPass) {
        console.warn("SMTP_USER or SMTP_PASS is not set. Email simulation:", { to, subject });
        return { success: true, simulated: true };
    }

    try {
        const info = await transporter.sendMail({
            from: `"Sedia Arcive" <${smtpUser}>`, // Sender address
            to,
            subject,
            html,
        });

        console.log("Message sent: %s", info.messageId);
        return { success: true, data: info };
    } catch (error) {
        console.error("Failed to send email:", error);
        return { success: false, error };
    }
}
