import { useEffect, useState } from 'react';
import { getBillingPlans, createCheckoutSession, createBillingPortalSession, getMe } from '@/api';

interface Plan {
    id: 'free' | 'pro';
    name: string;
    price: number;
    period: string;
    features: string[];
}

export default function BillingView() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(false);
    const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');

    useEffect(() => {
        Promise.all([getBillingPlans(), getMe()]).then(([p, me]) => {
            setPlans(p as Plan[]);
            setUserPlan((me as any).plan || 'free');
        }).catch(console.error);
    }, []);

    async function upgradeToPro() {
        setLoading(true);
        try {
            const r = await createCheckoutSession();
            const url = (r as any).url;
            if (url) window.location.href = url;
        } catch (err: any) {
            alert(err.message || 'Failed to start checkout');
        } finally {
            setLoading(false);
        }
    }

    async function manageBilling() {
        setLoading(true);
        try {
            const r = await createBillingPortalSession();
            const url = (r as any).url;
            if (url) window.location.href = url;
        } catch (err: any) {
            alert(err.message || 'Failed to open billing portal');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Billing</h2>
                <p className="text-surface-400 mt-1">Current plan: <span className="text-surface-200 font-medium uppercase">{userPlan}</span></p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {plans.map((plan) => (
                    <div key={plan.id} className={`card-glow rounded-xl p-5 border ${userPlan === plan.id ? 'border-primary-500' : 'border-surface-800'}`}>
                        <div className="flex items-baseline justify-between">
                            <h3 className="text-lg font-semibold">{plan.name}</h3>
                            <div className="text-right">
                                <div className="text-2xl font-bold">${plan.price}</div>
                                <div className="text-xs text-surface-400">/{plan.period}</div>
                            </div>
                        </div>
                        <ul className="mt-4 space-y-2 text-sm text-surface-300">
                            {plan.features.map((f) => <li key={f}>• {f}</li>)}
                        </ul>
                        <div className="mt-5">
                            {plan.id === 'pro' && userPlan !== 'pro' && (
                                <button onClick={upgradeToPro} disabled={loading} className="btn-primary w-full">Upgrade to Pro</button>
                            )}
                            {plan.id === 'pro' && userPlan === 'pro' && (
                                <button onClick={manageBilling} disabled={loading} className="btn-secondary w-full">Manage Subscription</button>
                            )}
                            {plan.id === 'free' && userPlan === 'free' && (
                                <button className="btn-secondary w-full" disabled>Current plan</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
