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

const MOBILE_NAV = [
    { id: 'dashboard' as const, icon: LayoutDashboard, label: 'Home' },
    { id: 'tasks' as const, icon: ListTodo, label: 'Tasks' },
    { id: 'plan' as const, icon: CalendarDays, label: 'Plan' },
    { id: 'goals' as const, icon: Target, label: 'Goals' },
    { id: 'insights' as const, icon: BarChart3, label: 'Insights' },
];

export default function Layout() {
    const { state, dispatch } = useApp();

    const renderView = () => {
        switch (state.activeView) {
            case 'dashboard': return <Dashboard />;
            case 'goals': return <GoalsView />;
            case 'tasks': return <TasksView />;
            case 'plan': return <PlanView />;
            case 'insights': return <InsightsView />;
            default: return <Dashboard />;
        }
    };

    if (state.loading.init) {
        return (
            <div className="flex h-screen items-center justify-center bg-surface-50">
                <div className="text-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white mb-4">
                        <svg className="w-7 h-7 animate-pulse-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12l5 5L20 7" />
                        </svg>
                    </div>
                    <p className="text-surface-500 text-sm font-medium">Loading FlowState...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-surface-50">
            <Sidebar />
            <main className="flex-1 overflow-auto scrollbar-thin pb-20 lg:pb-0">
                <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
                    {renderView()}
                </div>
            </main>

            {/* Mobile bottom navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-0 border-t border-surface-200 z-30">
                <div className="flex justify-around">
                    {MOBILE_NAV.map(item => (
                        <button
                            key={item.id}
                            onClick={() => dispatch({ type: 'SET_VIEW', view: item.id })}
                            className={`flex flex-col items-center gap-0.5 py-2 px-3 text-[10px] font-medium transition-colors
                ${state.activeView === item.id ? 'text-primary-600' : 'text-surface-400'}`}
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
