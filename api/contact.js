import { kv } from '@vercel/kv';
import { Resend } from 'resend';

function buildEmailHTML({ name, email, subject, message, timestamp }) {
    const date = new Date(timestamp).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#faf8f4;font-family:'Inter',-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f4;padding:40px 20px;">
        <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
                <!-- Header -->
                <tr><td style="background:#2d8a4e;padding:24px 32px;border-radius:16px 16px 0 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="color:white;font-family:'DM Sans','Inter',-apple-system,sans-serif;font-size:18px;font-weight:700;">
                                Nourish
                            </td>
                            <td align="right" style="color:rgba(255,255,255,0.8);font-size:13px;">
                                New Message
                            </td>
                        </tr>
                    </table>
                </td></tr>
                <!-- Body -->
                <tr><td style="background:#ffffff;padding:32px;border:1px solid #e8e4dd;border-top:none;">
                    <h2 style="margin:0 0 24px;font-family:'DM Sans','Inter',-apple-system,sans-serif;font-size:20px;font-weight:700;color:#1a1a1a;">
                        ${subject}
                    </h2>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                        <tr>
                            <td style="padding:8px 0;font-size:13px;color:#9a9a9a;width:60px;vertical-align:top;">From</td>
                            <td style="padding:8px 0;font-size:14px;color:#1a1a1a;font-weight:600;">${name}</td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0;font-size:13px;color:#9a9a9a;width:60px;vertical-align:top;">Email</td>
                            <td style="padding:8px 0;font-size:14px;">
                                <a href="mailto:${email}" style="color:#2d8a4e;text-decoration:none;font-weight:500;">${email}</a>
                            </td>
                        </tr>
                    </table>
                    <div style="border-top:1px solid #e8e4dd;padding-top:20px;margin-bottom:24px;">
                        <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a;white-space:pre-wrap;">${message}</p>
                    </div>
                    <div style="background:#faf8f4;border-radius:8px;padding:12px 16px;font-size:12px;color:#9a9a9a;">
                        Received ${date}
                    </div>
                </td></tr>
                <!-- Footer -->
                <tr><td style="background:#ffffff;padding:20px 32px;border:1px solid #e8e4dd;border-top:none;border-radius:0 0 16px 16px;text-align:center;">
                    <a href="${process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : ''}/admin.html"
                       style="display:inline-block;background:#1a1a1a;color:white;text-decoration:none;padding:10px 24px;border-radius:50px;font-size:13px;font-weight:600;">
                        View in Dashboard
                    </a>
                </td></tr>
            </table>
            <p style="margin:24px 0 0;font-size:12px;color:#9a9a9a;text-align:center;">
                Nourish &mdash; Eat Better, Together.
            </p>
        </td></tr>
    </table>
</body>
</html>`;
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name, email, subject, message } = req.body;

        // Validate required fields
        if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({ error: 'Please enter a valid email address.' });
        }

        // Validate lengths
        if (subject.trim().length > 200) {
            return res.status(400).json({ error: 'Subject is too long (max 200 characters).' });
        }
        if (message.trim().length > 5000) {
            return res.status(400).json({ error: 'Message is too long (max 5000 characters).' });
        }

        // Rate limiting: 1 submission per email per 5 minutes
        const rateLimitKey = `ratelimit:${email.trim().toLowerCase()}`;
        const existing = await kv.get(rateLimitKey);
        if (existing) {
            return res.status(429).json({ error: 'Please wait a few minutes before sending another message.' });
        }

        // Generate unique ID
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();

        const submission = {
            id,
            name: name.trim(),
            email: email.trim(),
            subject: subject.trim(),
            message: message.trim(),
            timestamp,
            read: false,
        };

        // Store in KV
        await kv.set(`submission:${id}`, JSON.stringify(submission));
        await kv.zadd('submissions', { score: Date.now(), member: id });

        // Set rate limit (expires in 5 minutes)
        await kv.set(rateLimitKey, '1', { ex: 300 });

        // Send email notification
        if (process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL) {
            const resend = new Resend(process.env.RESEND_API_KEY);
            try {
                await resend.emails.send({
                    from: process.env.EMAIL_FROM || 'Nourish <onboarding@resend.dev>',
                    to: process.env.NOTIFY_EMAIL,
                    subject: `New Contact: ${submission.subject}`,
                    html: buildEmailHTML(submission),
                });
            } catch (emailErr) {
                console.error('Email send failed:', emailErr);
                // Don't fail the submission if email fails
            }
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Contact form error:', err);
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
}
