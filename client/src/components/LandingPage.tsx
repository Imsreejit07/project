import { ArrowRight, Zap, Target, Brain, Shield, BarChart3, Sparkles } from 'lucide-react';

export default function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
    return (
        <div className="min-h-screen bg-surface-950 text-surface-100 overflow-hidden">
            <section className="relative px-6 py-20 md:py-28">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-gradient-radial from-primary-500/20 to-transparent" />
                    <div className="absolute top-40 -left-24 w-96 h-96 rounded-full bg-primary-400/10 blur-3xl" />
                    <div className="absolute bottom-0 -right-32 w-[28rem] h-[28rem] rounded-full bg-blue-500/10 blur-3xl" />
                </div>

                <div className="relative max-w-6xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-300 text-sm mb-6">
                        <Sparkles className="w-4 h-4" /> AI-first productivity system
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight max-w-4xl">
                        Focus on the
                        <span className="gradient-text"> right work</span>,
                        <br /> every single day.
                    </h1>
                    <p className="text-surface-300 text-lg md:text-xl mt-6 max-w-2xl leading-relaxed">
                        FlowState is your personal strategic assistant. It plans your day, prioritizes tasks, and keeps you in deep work mode.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row gap-3">
                        <button onClick={onGetStarted} className="btn-primary px-7 py-3 text-base font-semibold inline-flex items-center gap-2 justify-center">
                            Get Started Free <ArrowRight className="w-4 h-4" />
                        </button>
                        <a href="#features" className="btn-secondary px-7 py-3 text-base font-semibold text-center">Explore Features</a>
                    </div>
                </div>
            </section>

            <section id="features" className="px-6 pb-20 md:pb-28">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { icon: Brain, title: 'AI Planning Engine', desc: 'Builds your day based on priority, deadlines, and energy levels.' },
                        { icon: Target, title: 'Goal-to-Task Alignment', desc: 'Every task maps back to your strategic goals.' },
                        { icon: Zap, title: 'Smart Next Action', desc: 'Know exactly what to work on next in one click.' },
                        { icon: BarChart3, title: 'Behavior Insights', desc: 'Track completion trends and focus quality over time.' },
                        { icon: Shield, title: 'Private by Design', desc: 'Your productivity data is isolated and secured.' },
                        { icon: Sparkles, title: 'Conversational Control', desc: 'Create tasks, plans, and projects just by chatting.' },
                    ].map((f) => (
                        <div key={f.title} className="card-glow rounded-xl p-5 border border-surface-800">
                            <f.icon className="w-5 h-5 text-primary-300" />
                            <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
                            <p className="mt-2 text-surface-400 text-sm leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
