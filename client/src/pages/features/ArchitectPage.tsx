import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { FolderTree, ChevronRight, Plus, Target, ListTodo, FolderOpen } from 'lucide-react';
import FeaturePageLayout from '../../components/FeaturePageLayout';
import GlowCard from '../../components/GlowCard';

interface TreeNode {
    id: string;
    label: string;
    type: 'goal' | 'project' | 'task';
    children?: TreeNode[];
}

const sampleTree: TreeNode = {
    id: '1', label: 'Launch SaaS Product', type: 'goal', children: [
        { id: '1a', label: 'MVP Development', type: 'project', children: [
            { id: '1a1', label: 'Set up backend API', type: 'task' },
            { id: '1a2', label: 'Build authentication flow', type: 'task' },
            { id: '1a3', label: 'Design landing page', type: 'task' },
        ]},
        { id: '1b', label: 'Marketing Strategy', type: 'project', children: [
            { id: '1b1', label: 'Write blog posts', type: 'task' },
            { id: '1b2', label: 'Set up analytics', type: 'task' },
        ]},
        { id: '1c', label: 'Beta Testing', type: 'project', children: [
            { id: '1c1', label: 'Recruit beta users', type: 'task' },
            { id: '1c2', label: 'Create feedback form', type: 'task' },
            { id: '1c3', label: 'Fix critical bugs', type: 'task' },
        ]},
    ],
};

function TreeNodeItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
    const [expanded, setExpanded] = useState(depth < 1);
    const hasChildren = node.children && node.children.length > 0;
    const Icon = node.type === 'goal' ? Target : node.type === 'project' ? FolderOpen : ListTodo;
    const color = node.type === 'goal' ? 'text-primary-400' : node.type === 'project' ? 'text-yellow-400' : 'text-surface-600';

    return (
        <motion.div layout transition={{ type: 'spring' as const, damping: 25, stiffness: 200 }}>
            <motion.button
                layout="position"
                onClick={() => hasChildren && setExpanded(!expanded)}
                className={`flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors ${depth > 0 ? 'ml-6' : ''}`}
                whileHover={{ x: 2 }}
            >
                {hasChildren && (
                    <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight className="w-3.5 h-3.5 text-surface-500" />
                    </motion.div>
                )}
                {!hasChildren && <div className="w-3.5" />}
                <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                <span className="text-sm text-surface-800 font-medium">{node.label}</span>
                {hasChildren && (
                    <span className="text-[10px] text-surface-500 ml-auto">{node.children!.length}</span>
                )}
            </motion.button>
            <AnimatePresence>
                {expanded && hasChildren && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: 'spring' as const, damping: 25, stiffness: 200 }}
                        className="overflow-hidden border-l border-white/[0.06] ml-[18px]"
                    >
                        {node.children!.map(child => (
                            <TreeNodeItem key={child.id} node={child} depth={depth + 1} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function TreeDemo() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <div ref={ref} className="max-w-2xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ type: 'spring' as const, damping: 20, stiffness: 100 }}
            >
                <GlowCard className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-surface-900">Goal → Project → Task Hierarchy</h3>
                        <span className="text-xs text-surface-500">Click to expand/collapse</span>
                    </div>
                    <TreeNodeItem node={sampleTree} />
                </GlowCard>
            </motion.div>
        </div>
    );
}

export default function ArchitectPage() {
    return (
        <FeaturePageLayout
            badge="Project Architecture"
            title="Structure your ambitions with"
            titleHighlight="hierarchical clarity."
            subtitle="Architect mode nests goals into projects and projects into tasks — creating a clear, visual tree of everything you're building."
            demoSection={<TreeDemo />}
            useCases={[
                { icon: <FolderTree className="w-5 h-5" />, title: 'Nested Organization', desc: 'Create deep hierarchies: Goals → Projects → Tasks → Sub-tasks.' },
                { icon: <Target className="w-5 h-5" />, title: 'Goal-First Thinking', desc: 'Start from the outcome and work backward through milestones.' },
                { icon: <FolderOpen className="w-5 h-5" />, title: 'Multi-Project View', desc: 'Manage multiple active projects under a single strategic goal.' },
                { icon: <ListTodo className="w-5 h-5" />, title: 'Task Dependencies', desc: 'Define which tasks must complete before others can begin.' },
                { icon: <Plus className="w-5 h-5" />, title: 'Quick Add Anywhere', desc: 'Add tasks to any level in the tree with contextual quick-add.' },
                { icon: <ChevronRight className="w-5 h-5" />, title: 'Progress Roll-Up', desc: 'Goal progress is automatically calculated from task completions.' },
            ]}
            faqs={[
                { q: 'Is there a limit to nesting depth?', a: 'Currently the hierarchy supports Goal → Project → Task (3 levels). Sub-task support is on the roadmap.' },
                { q: 'Can a task belong to multiple projects?', a: 'Tasks belong to one project, but projects can link to one goal. This keeps the hierarchy clean.' },
                { q: 'How does progress calculation work?', a: 'Goal progress = % of completed tasks across all child projects. Project progress = % of its own completed tasks.' },
            ]}
            prevPage={{ label: 'AI Strategist', href: '/features/ai-strategist' }}
            nextPage={{ label: 'Zen Mode', href: '/features/zen-mode' }}
        />
    );
}
