import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ChatPanel() {
    const { state, dispatch, actions } = useApp();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const isLoading = state.loading.chat;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [state.chatMessages]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSend = async () => {
        const msg = input.trim();
        if (!msg || isLoading) return;
        setInput('');
        await actions.sendMessage(msg);
    };

    const quickActions = [
        { label: 'Plan my day', message: 'Plan my day' },
        { label: 'What should I focus on?', message: 'What should I focus on?' },
        { label: 'Show my status', message: 'Show my status' },
        { label: 'Analyze patterns', message: 'Analyze my work patterns' },
    ];

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-[#0A0A0A] border-l border-white/5 shadow-2xl z-50 flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/15">
                        <Sparkles className="h-4 w-4 text-primary-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-surface-900">FlowState AI</h3>
                        <p className="text-[10px] text-surface-500">Your productivity assistant</p>
                    </div>
                </div>
                <button
                    onClick={() => dispatch({ type: 'TOGGLE_CHAT' })}
                    className="btn-icon btn-ghost p-1.5"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto scrollbar-thin p-4 space-y-4">
                {state.chatMessages.length === 0 ? (
                    <div className="text-center py-8">
                        <Bot className="h-10 w-10 text-surface-400 mx-auto mb-3" />
                        <p className="text-sm text-surface-500 mb-4">
                            I can help you plan your day, organize tasks, and optimize your workflow.
                        </p>
                        <div className="space-y-2">
                            {quickActions.map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setInput(action.message);
                                        actions.sendMessage(action.message);
                                    }}
                                    className="block w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/[0.07] text-sm text-surface-600 transition-colors"
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    state.chatMessages.map((msg, i) => (
                        <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500/15 flex-shrink-0 mt-0.5">
                                    <Bot className="h-3.5 w-3.5 text-primary-400" />
                                </div>
                            )}
                            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed
                ${msg.role === 'user'
                                    ? 'bg-primary-600 text-white rounded-br-sm'
                                    : 'bg-white/5 text-surface-800 rounded-bl-sm'
                                }`}
                            >
                                <MessageContent content={msg.content} />
                                {msg.actions && msg.actions.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-white/10">
                                        {msg.actions.map((action: any, j: number) => (
                                            <div key={j} className="text-xs text-surface-500 flex items-center gap-1">
                                                <Sparkles className="h-3 w-3" />
                                                {action.action === 'create_task' && `Created task: "${action.result?.title}"`}
                                                {action.action === 'plan_day' && `Generated plan with ${action.result?.suggestions?.length || 0} tasks`}
                                                {action.action === 'create_goal' && `Created goal: "${action.result?.title}"`}
                                                {action.action === 'suggest_next' && 'Generated suggestions'}
                                                {action.action === 'analyze_patterns' && 'Analyzed your patterns'}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {msg.role === 'user' && (
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 flex-shrink-0 mt-0.5">
                                    <User className="h-3.5 w-3.5 text-surface-600" />
                                </div>
                            )}
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="flex gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500/15 flex-shrink-0">
                            <Bot className="h-3.5 w-3.5 text-primary-400" />
                        </div>
                        <div className="bg-white/5 rounded-xl px-4 py-3 rounded-bl-sm">
                            <Loader2 className="h-4 w-4 text-surface-500 animate-spin" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-white/5 p-3">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        className="input flex-1"
                        placeholder="Ask anything or type a command..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        disabled={isLoading}
                    />
                    <motion.button
                        whileHover={{ y: -2, boxShadow: '0 0 15px rgba(139,92,246,0.3)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="btn-primary px-3"
                    >
                        <Send className="h-4 w-4" />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}

function MessageContent({ content }: { content: string }) {
    const lines = content.split('\n');
    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                if (!line.trim()) return <br key={i} />;
                let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                if (processed.startsWith('• ') || processed.startsWith('- ')) {
                    return (
                        <div key={i} className="flex gap-1.5 items-start">
                            <span className="mt-1.5 h-1 w-1 rounded-full bg-current flex-shrink-0 opacity-40" />
                            <span dangerouslySetInnerHTML={{ __html: processed.slice(2) }} />
                        </div>
                    );
                }
                const numMatch = processed.match(/^(\d+)\.\s(.*)$/);
                if (numMatch) {
                    return (
                        <div key={i} className="flex gap-1.5 items-start">
                            <span className="text-xs opacity-50 mt-0.5 flex-shrink-0">{numMatch[1]}.</span>
                            <span dangerouslySetInnerHTML={{ __html: numMatch[2] }} />
                        </div>
                    );
                }
                return <p key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
            })}
        </div>
    );
}
