import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth/middleware.js';
import { getPool } from '../db/database.js';
import { sendProUpgradeEmail } from '../services/email.js';

const router = Router();

function getStripe() {
    if (!process.env.STRIPE_SECRET_KEY) return null;
    const Stripe = require('stripe');
    return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' });
}

// GET /api/billing/plans — public
router.get('/plans', (_req: Request, res: Response) => {
    res.json([
        {
            id: 'free', name: 'Free', price: 0, period: 'forever',
            features: ['10 active tasks', '3 active goals', '1 project', 'Basic AI assistant', '10 AI chats/day'],
            limits: { tasks: 10, goals: 3, projects: 1 },
        },
        {
            id: 'pro', name: 'Pro', price: 9, period: 'month',
            priceId: process.env.STRIPE_PRO_PRICE_ID || '',
            features: ['Unlimited tasks', 'Unlimited goals & projects', 'Advanced Gemini AI', 'Unlimited AI chat', 'Priority support', 'Analytics & insights'],
            limits: { tasks: Infinity, goals: Infinity, projects: Infinity },
        },
    ]);
});

// POST /api/billing/checkout
router.post('/checkout', requireAuth, async (req: Request, res: Response) => {
    try {
        const stripe = getStripe();
        if (!stripe) return res.status(503).json({ error: 'Billing not configured. Add STRIPE_SECRET_KEY to .env' });

        const userId = (req as any).userId;
        const pool = getPool();
        const { rows } = await pool.query('SELECT email, name, stripe_customer_id FROM users WHERE id = $1', [userId]);
        const user = rows[0];
        if (!user) return res.status(404).json({ error: 'User not found' });

        let customerId = user.stripe_customer_id;
        if (!customerId) {
            const customer = await stripe.customers.create({ email: user.email, name: user.name, metadata: { userId } });
            customerId = customer.id;
            await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, userId]);
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
            mode: 'subscription',
            success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/billing?success=true`,
            cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/billing`,
            metadata: { userId },
        });
        res.json({ url: session.url });
    } catch (err: any) {
        console.error('Checkout error:', err);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// POST /api/billing/portal
router.post('/portal', requireAuth, async (req: Request, res: Response) => {
    try {
        const stripe = getStripe();
        if (!stripe) return res.status(503).json({ error: 'Billing not configured' });

        const userId = (req as any).userId;
        const pool = getPool();
        const { rows } = await pool.query('SELECT stripe_customer_id FROM users WHERE id = $1', [userId]);
        if (!rows[0]?.stripe_customer_id) return res.status(400).json({ error: 'No billing account found. Upgrade first.' });

        const session = await stripe.billingPortal.sessions.create({
            customer: rows[0].stripe_customer_id,
            return_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/billing`,
        });
        res.json({ url: session.url });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to open billing portal' });
    }
});

// POST /api/billing/webhook (raw body — mounted separately)
router.post('/webhook', async (req: Request, res: Response) => {
    const stripe = getStripe();
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(200).json({ received: true });
    }

    const sig = req.headers['stripe-signature'];
    let event: any;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
        return res.status(400).json({ error: 'Webhook signature invalid' });
    }

    const pool = getPool();
    try {
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const sub = event.data.object;
                const plan = sub.status === 'active' ? 'pro' : 'free';
                const { rows } = await pool.query(
                    'UPDATE users SET plan = $1, stripe_subscription_id = $2 WHERE stripe_customer_id = $3 RETURNING email, name',
                    [plan, sub.id, sub.customer]
                );
                if (rows[0] && plan === 'pro') sendProUpgradeEmail(rows[0].email, rows[0].name).catch(console.error);
                break;
            }
            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                await pool.query('UPDATE users SET plan = $1, stripe_subscription_id = NULL WHERE stripe_customer_id = $2', ['free', sub.customer]);
                break;
            }
        }
    } catch (err) {
        console.error('Webhook processing error:', err);
    }
    res.json({ received: true });
});

export default router;
