import { useApp } from '../context/AppContext';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import GoalsView from './GoalsView';
import TasksView from './TasksView';
import PlanView from './PlanView';
import InsightsView from './InsightsView';
import ChatPanel from './ChatPanel';
import CreateTaskModal from './CreateTaskModal';
import CreateGoalModal from './CreateGoalModal';
import CreateProjectModal from './CreateProjectModal';
import { MessageCircle, LayoutDashboard, Target, ListTodo, CalendarDays, BarChart3 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import DashboardLoading from './DashboardLoading';

const MOBILE_NAV = [
    { id: 'dashboard' as const, icon: LayoutDashboard, label: 'Home' },
    { id: 'tasks' as const, icon: ListTodo, label: 'Tasks' },
    { id: 'plan' as const, icon: CalendarDays, label: 'Plan' },
    { id: 'goals' as const, icon: Target, label: 'Goals' },
    { id: 'insights' as const, icon: BarChart3, label: 'Insights' },
];

const viewTransition = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function Layout() {
    const { state, dispatch } = useApp();

    const renderView = () => {
        if (state.loading.init) {
            return <DashboardLoading key="loading" />;
        }
        
        switch (state.activeView) {
            case 'dashboard': return <Dashboard key="dashboard" />;
            case 'goals': return <GoalsView key="goals" />;
            case 'tasks': return <TasksView key="tasks" />;
            case 'plan': return <PlanView key="plan" />;
            case 'insights': return <InsightsView key="insights" />;
            default: return <Dashboard key="default" />;
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#020202]">
            <Sidebar />
            <main className="flex-1 overflow-auto scrollbar-thin pb-20 lg:pb-0">
                <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
                    <AnimatePresence mode="wait">
                        <motion.div key={state.activeView} {...viewTransition}>
                            {renderView()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Mobile bottom navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/5 z-30">
                <div className="flex justify-around">
                    {MOBILE_NAV.map(item => (
                        <button
                            key={item.id}
                            onClick={() => dispatch({ type: 'SET_VIEW', view: item.id })}
                            className={`flex flex-col items-center gap-0.5 py-2 px-3 text-[10px] font-medium transition-colors
                ${state.activeView === item.id ? 'text-primary-400' : 'text-surface-500'}`}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </button>
                    ))}
                </div>
            </nav>

            {/* Chat panel */}
            {state.showChat && <ChatPanel />}

            {/* Modals */}
            {state.showCreateTask && <CreateTaskModal />}
            {state.showCreateGoal && <CreateGoalModal />}
            {state.showCreateProject && <CreateProjectModal />}
        </div>
    );
}
