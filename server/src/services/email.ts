const FROM_EMAIL = process.env.FROM_EMAIL || 'FlowState <noreply@flowstate.app>';
const APP_URL = process.env.CLIENT_URL || 'https://flowstate.app';

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!process.env.RESEND_API_KEY) {
        console.log(`[Email] ${subject} → ${to} (RESEND_API_KEY not set, skipping)`);
        return;
    }
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
    await sendEmail(email, 'Welcome to FlowState! 🚀', `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;background:#fff;">
            <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:12px;padding:32px;margin-bottom:24px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:28px;">Welcome to FlowState!</h1>
                <p style="color:#e9d5ff;margin:8px 0 0;">Your AI-powered productivity system is ready.</p>
            </div>
            <p style="color:#374151;font-size:16px;">Hi ${name},</p>
            <p style="color:#6b7280;">You're all set to start building your most productive life. Here's how to get started:</p>
            <ol style="color:#374151;line-height:2;">
                <li><strong>Create your first goal</strong> — What do you want to achieve in the next 90 days?</li>
                <li><strong>Break it into tasks</strong> — Small steps lead to big wins</li>
                <li><strong>Chat with your AI assistant</strong> — Try "Plan my day" or "What should I focus on?"</li>
            </ol>
            <a href="${APP_URL}" style="display:inline-block;background:#7c3aed;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">Start Planning →</a>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
            <p style="color:#9ca3af;font-size:13px;">Need help? Reply to this email — we actually read these.</p>
        </div>
    `);
}

export async function sendPasswordResetEmail(email: string, name: string, resetUrl: string): Promise<void> {
    await sendEmail(email, 'Reset your FlowState password', `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;background:#fff;">
            <h2 style="color:#7c3aed;">Reset your password</h2>
            <p style="color:#374151;">Hi ${name}, we received a request to reset your FlowState password.</p>
            <a href="${resetUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">Reset Password</a>
            <p style="color:#6b7280;font-size:14px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        </div>
    `);
}

export async function sendProUpgradeEmail(email: string, name: string): Promise<void> {
    await sendEmail(email, "You're now on FlowState Pro! ⚡", `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;background:#fff;">
            <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:12px;padding:32px;margin-bottom:24px;text-align:center;">
                <h1 style="color:#fff;margin:0;">You're Pro now! ⚡</h1>
            </div>
            <p style="color:#374151;">Hi ${name}, your FlowState Pro subscription is now active. You have access to:</p>
            <ul style="color:#374151;line-height:2;">
                <li>✅ Unlimited tasks, goals, and projects</li>
                <li>✅ Advanced AI planning with Gemini</li>
                <li>✅ Unlimited AI chat</li>
                <li>✅ Priority support</li>
            </ul>
            <a href="${APP_URL}" style="display:inline-block;background:#7c3aed;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">Back to FlowState →</a>
        </div>
    `);
}
