import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import * as api from '@/api';
import { Goal, Project, Task, UserStats, DailyPlanResult, ChatMessage } from '../types';

interface CurrentUser {
    id: string;
    name: string;
    email: string;
    plan: 'free' | 'pro';
    role: 'user' | 'admin';
}

interface AppState {
    currentUser: CurrentUser | null;
    goals: Goal[];
    projects: Project[];
    tasks: Task[];
    stats: UserStats | null;
    dailyPlan: DailyPlanResult | null;
    chatMessages: ChatMessage[];
    conversationId: string | null;
    loading: { [key: string]: boolean };
    activeView: 'dashboard' | 'goals' | 'tasks' | 'plan' | 'insights';
    selectedGoalId: string | null;
    selectedProjectId: string | null;
    showChat: boolean;
    showCreateTask: boolean;
    showCreateGoal: boolean;
    showCreateProject: boolean;
}

type Action =
    | { type: 'SET_CURRENT_USER'; user: CurrentUser | null }
    | { type: 'SET_GOALS'; goals: Goal[] }
    | { type: 'SET_PROJECTS'; projects: Project[] }
    | { type: 'SET_TASKS'; tasks: Task[] }
    | { type: 'SET_STATS'; stats: UserStats }
    | { type: 'SET_DAILY_PLAN'; plan: DailyPlanResult }
    | { type: 'ADD_GOAL'; goal: Goal }
    | { type: 'UPDATE_GOAL'; goal: Goal }
    | { type: 'REMOVE_GOAL'; id: string }
    | { type: 'ADD_PROJECT'; project: Project }
    | { type: 'UPDATE_PROJECT'; project: Project }
    | { type: 'REMOVE_PROJECT'; id: string }
    | { type: 'ADD_TASK'; task: Task }
    | { type: 'UPDATE_TASK'; task: Task }
    | { type: 'REMOVE_TASK'; id: string }
    | { type: 'ADD_CHAT_MESSAGE'; message: ChatMessage }
    | { type: 'SET_CONVERSATION_ID'; id: string }
    | { type: 'SET_LOADING'; key: string; value: boolean }
    | { type: 'SET_VIEW'; view: AppState['activeView'] }
    | { type: 'SET_SELECTED_GOAL'; id: string | null }
    | { type: 'SET_SELECTED_PROJECT'; id: string | null }
    | { type: 'TOGGLE_CHAT' }
    | { type: 'TOGGLE_CREATE_TASK' }
    | { type: 'TOGGLE_CREATE_GOAL' }
    | { type: 'TOGGLE_CREATE_PROJECT' };

const initialState: AppState = {
    currentUser: null,
    goals: [],
    projects: [],
    tasks: [],
    stats: null,
    dailyPlan: null,
    chatMessages: [],
    conversationId: null,
    loading: {},
    activeView: 'dashboard',
    selectedGoalId: null,
    selectedProjectId: null,
    showChat: false,
    showCreateTask: false,
    showCreateGoal: false,
    showCreateProject: false,
};

function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'SET_CURRENT_USER': return { ...state, currentUser: action.user };
        case 'SET_GOALS': return { ...state, goals: action.goals };
        case 'SET_PROJECTS': return { ...state, projects: action.projects };
        case 'SET_TASKS': return { ...state, tasks: action.tasks };
        case 'SET_STATS': return { ...state, stats: action.stats };
        case 'SET_DAILY_PLAN': return { ...state, dailyPlan: action.plan };
        case 'ADD_GOAL': return { ...state, goals: [action.goal, ...state.goals] };
        case 'UPDATE_GOAL': return { ...state, goals: state.goals.map(g => g.id === action.goal.id ? action.goal : g) };
        case 'REMOVE_GOAL': return { ...state, goals: state.goals.filter(g => g.id !== action.id) };
        case 'ADD_PROJECT': return { ...state, projects: [action.project, ...state.projects] };
        case 'UPDATE_PROJECT': return { ...state, projects: state.projects.map(p => p.id === action.project.id ? action.project : p) };
        case 'REMOVE_PROJECT': return { ...state, projects: state.projects.filter(p => p.id !== action.id) };
        case 'ADD_TASK': return { ...state, tasks: [action.task, ...state.tasks] };
        case 'UPDATE_TASK': return { ...state, tasks: state.tasks.map(t => t.id === action.task.id ? action.task : t) };
        case 'REMOVE_TASK': return { ...state, tasks: state.tasks.filter(t => t.id !== action.id) };
        case 'ADD_CHAT_MESSAGE': return { ...state, chatMessages: [...state.chatMessages, action.message] };
        case 'SET_CONVERSATION_ID': return { ...state, conversationId: action.id };
        case 'SET_LOADING': return { ...state, loading: { ...state.loading, [action.key]: action.value } };
        case 'SET_VIEW': return { ...state, activeView: action.view };
        case 'SET_SELECTED_GOAL': return { ...state, selectedGoalId: action.id };
        case 'SET_SELECTED_PROJECT': return { ...state, selectedProjectId: action.id };
        case 'TOGGLE_CHAT': return { ...state, showChat: !state.showChat };
        case 'TOGGLE_CREATE_TASK': return { ...state, showCreateTask: !state.showCreateTask };
        case 'TOGGLE_CREATE_GOAL': return { ...state, showCreateGoal: !state.showCreateGoal };
        case 'TOGGLE_CREATE_PROJECT': return { ...state, showCreateProject: !state.showCreateProject };
        default: return state;
    }
}

interface AppContextValue {
    state: AppState;
    dispatch: React.Dispatch<Action>;
    actions: {
        loadAll: () => Promise<void>;
        createGoal: (data: Partial<Goal>) => Promise<void>;
        updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
        deleteGoal: (id: string) => Promise<void>;
        createProject: (data: Partial<Project>) => Promise<void>;
        updateProject: (id: string, data: Partial<Project>) => Promise<void>;
        deleteProject: (id: string) => Promise<void>;
        createTask: (data: Partial<Task>) => Promise<void>;
        updateTask: (id: string, data: Partial<Task>) => Promise<void>;
        deleteTask: (id: string) => Promise<void>;
        completeTask: (id: string) => Promise<void>;
        generatePlan: () => Promise<void>;
        sendMessage: (message: string) => Promise<void>;
    };
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children, currentUser }: { children: ReactNode; currentUser?: CurrentUser | null }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    const loadAll = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', key: 'init', value: true });
        try {
            const [me, goals, projects, tasks, stats] = await Promise.all([
                api.getMe(),
                api.getGoals(),
                api.getProjects(),
                api.getTasks(),
                api.getStats(),
            ]);
            dispatch({ type: 'SET_CURRENT_USER', user: me as CurrentUser });
            dispatch({ type: 'SET_GOALS', goals });
            dispatch({ type: 'SET_PROJECTS', projects });
            dispatch({ type: 'SET_TASKS', tasks });
            dispatch({ type: 'SET_STATS', stats });
        } catch (e) {
            console.error('Failed to load data:', e);
        } finally {
            dispatch({ type: 'SET_LOADING', key: 'init', value: false });
        }
    }, []);

    const createGoalAction = useCallback(async (data: Partial<Goal>) => {
        const goal = await api.createGoal(data);
        dispatch({ type: 'ADD_GOAL', goal });
    }, []);

    const updateGoalAction = useCallback(async (id: string, data: Partial<Goal>) => {
        const goal = await api.updateGoal(id, data);
        dispatch({ type: 'UPDATE_GOAL', goal });
    }, []);

    const deleteGoalAction = useCallback(async (id: string) => {
        await api.deleteGoal(id);
        dispatch({ type: 'REMOVE_GOAL', id });
    }, []);

    const createProjectAction = useCallback(async (data: Partial<Project>) => {
        const project = await api.createProject(data);
        dispatch({ type: 'ADD_PROJECT', project });
    }, []);

    const updateProjectAction = useCallback(async (id: string, data: Partial<Project>) => {
        const project = await api.updateProject(id, data);
        dispatch({ type: 'UPDATE_PROJECT', project });
    }, []);

    const deleteProjectAction = useCallback(async (id: string) => {
        await api.deleteProject(id);
        dispatch({ type: 'REMOVE_PROJECT', id });
    }, []);

    const createTaskAction = useCallback(async (data: Partial<Task>) => {
        const task = await api.createTask(data);
        dispatch({ type: 'ADD_TASK', task });
        const stats = await api.getStats();
        dispatch({ type: 'SET_STATS', stats });
    }, []);

    const updateTaskAction = useCallback(async (id: string, data: Partial<Task>) => {
        const task = await api.updateTask(id, data);
        dispatch({ type: 'UPDATE_TASK', task });
    }, []);

    const deleteTaskAction = useCallback(async (id: string) => {
        await api.deleteTask(id);
        dispatch({ type: 'REMOVE_TASK', id });
        const stats = await api.getStats();
        dispatch({ type: 'SET_STATS', stats });
    }, []);

    const completeTask = useCallback(async (id: string) => {
        const task = await api.updateTask(id, { status: 'completed' });
        dispatch({ type: 'UPDATE_TASK', task });
        const stats = await api.getStats();
        dispatch({ type: 'SET_STATS', stats });
    }, []);

    const generatePlanAction = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', key: 'plan', value: true });
        try {
            const plan = await api.generatePlan();
            dispatch({ type: 'SET_DAILY_PLAN', plan });
        } finally {
            dispatch({ type: 'SET_LOADING', key: 'plan', value: false });
        }
    }, []);

    const sendMessage = useCallback(async (message: string) => {
        dispatch({ type: 'ADD_CHAT_MESSAGE', message: { role: 'user', content: message, timestamp: new Date().toISOString() } });
        dispatch({ type: 'SET_LOADING', key: 'chat', value: true });
        try {
            const result = await api.chatWithAI(message, state.conversationId || undefined);
            dispatch({ type: 'SET_CONVERSATION_ID', id: result.conversationId });
            dispatch({
                type: 'ADD_CHAT_MESSAGE',
                message: { role: 'assistant', content: result.response, actions: result.actions, timestamp: new Date().toISOString() }
            });
            if (result.actions?.length > 0) {
                await loadAll();
            }
        } catch {
            dispatch({
                type: 'ADD_CHAT_MESSAGE',
                message: { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: new Date().toISOString() }
            });
        } finally {
            dispatch({ type: 'SET_LOADING', key: 'chat', value: false });
        }
    }, [state.conversationId, loadAll]);

    useEffect(() => {
        if (currentUser) {
            dispatch({ type: 'SET_CURRENT_USER', user: currentUser });
        }
    }, [currentUser]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const contextValue: AppContextValue = {
        state,
        dispatch,
        actions: {
            loadAll,
            createGoal: createGoalAction,
            updateGoal: updateGoalAction,
            deleteGoal: deleteGoalAction,
            createProject: createProjectAction,
            updateProject: updateProjectAction,
            deleteProject: deleteProjectAction,
            createTask: createTaskAction,
            updateTask: updateTaskAction,
            deleteTask: deleteTaskAction,
            completeTask,
            generatePlan: generatePlanAction,
            sendMessage,
        },
    };

    return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
