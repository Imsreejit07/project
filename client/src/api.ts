import { hasSupabaseConfig, supabase } from './lib/supabase';

const API_BASE = 'http://localhost:3001/api';

let accessToken: string | null = localStorage.getItem('flowstate_token');

function setAccessToken(token: string | null) {
    accessToken = token;
    if (token) localStorage.setItem('flowstate_token', token);
    else localStorage.removeItem('flowstate_token');
}

async function request<T>(path: string, options?: RequestInit, retry = true): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options?.headers as Record<string, string> || {}),
    };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    const res = await fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        ...options,
        headers,
    });

    if (res.status === 401 && retry) {
        try {
            const refreshed = await refreshToken();
            if (refreshed?.accessToken) {
                setAccessToken(refreshed.accessToken);
                return request<T>(path, options, false);
            }
        } catch {
            setAccessToken(null);
        }
    }

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
}

// ─── Auth ───

export async function signup(name: string, email: string, password: string) {
    const res = await request<any>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
    }, false);
    if (res.accessToken) setAccessToken(res.accessToken);
    return res;
}

export async function login(email: string, password: string) {
    const res = await request<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    }, false);
    if (res.accessToken) setAccessToken(res.accessToken);
    return res;
}

export async function logout() {
    try {
        await request('/auth/logout', { method: 'POST' }, false);
    } finally {
        // Important: clear Supabase session too, otherwise AuthGate auto-restores login.
        await supabase.auth.signOut().catch(() => { });
        setAccessToken(null);
    }
}

export async function refreshToken() {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Unable to refresh token');
    const data = await res.json();
    if (data.accessToken) setAccessToken(data.accessToken);
    return data;
}

export const getMe = () => request<any>('/auth/me');
export const updateProfile = (name: string) => request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify({ name }) });
export const forgotPassword = (email: string) => request<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }, false);
export const resetPassword = (token: string, password: string) => request<any>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }, false);

// Supabase OTP Authentication
export const sendCode = async (email: string, name?: string) => {
    if (!hasSupabaseConfig) {
        throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in client/.env.local and restart the client.');
    }
    const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: name?.trim() ? { data: { full_name: name.trim() } } : undefined,
    });
    if (error) throw new Error(error.message);
    return data;
};

export const verifyCode = async (email: string, code: string) => {
    if (!hasSupabaseConfig) {
        throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in client/.env.local and restart the client.');
    }
    try {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: code,
            type: 'email',
        });
        if (error) {
            throw new Error('Invalid OTP entered');
        }
        return data;
    } catch {
        throw new Error('Invalid OTP entered');
    }
};

export const exchangeSupabaseSession = async (
    supabaseAccessToken: string,
    signupData?: { name?: string; password?: string }
) => {
    const res = await fetch(`${API_BASE}/auth/supabase/exchange`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Authorization': `Bearer ${supabaseAccessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData || {}),
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to exchange Supabase session' }));
        throw new Error(error.error || 'Failed to exchange Supabase session');
    }

    const data = await res.json();
    if (data.accessToken) setAccessToken(data.accessToken);
    return data;
};

// ─── Existing App API ───

export const getUser = () => request<any>('/user');
export const updateSettings = (settings: any) => request('/user/settings', { method: 'PUT', body: JSON.stringify(settings) });

export const getGoals = (status?: string) => request<any[]>(`/goals${status ? `?status=${status}` : ''}`);
export const createGoal = (data: any) => request<any>('/goals', { method: 'POST', body: JSON.stringify(data) });
export const updateGoal = (id: string, data: any) => request<any>(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteGoal = (id: string) => request(`/goals/${id}`, { method: 'DELETE' });

export const getProjects = (goalId?: string, status?: string) => {
    const params = new URLSearchParams();
    if (goalId) params.set('goal_id', goalId);
    if (status) params.set('status', status);
    const qs = params.toString();
    return request<any[]>(`/projects${qs ? `?${qs}` : ''}`);
};
export const createProject = (data: any) => request<any>('/projects', { method: 'POST', body: JSON.stringify(data) });
export const updateProject = (id: string, data: any) => request<any>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProject = (id: string) => request(`/projects/${id}`, { method: 'DELETE' });

export const getTasks = (filters?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (filters) Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
    return request<any[]>(`/tasks${qs ? `?${qs}` : ''}`);
};
export const createTask = (data: any) => request<any>('/tasks', { method: 'POST', body: JSON.stringify(data) });
export const updateTask = (id: string, data: any) => request<any>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTask = (id: string) => request(`/tasks/${id}`, { method: 'DELETE' });

export const startSession = (taskId?: string) => request<any>('/sessions/start', { method: 'POST', body: JSON.stringify({ task_id: taskId }) });
export const endSession = (id: string, data?: any) => request<any>(`/sessions/${id}/end`, { method: 'POST', body: JSON.stringify(data || {}) });
export const getSessions = (limit?: number) => request<any[]>(`/sessions${limit ? `?limit=${limit}` : ''}`);

export const getDailyPlan = (date: string) => request<any>(`/plans/${date}`);
export const updateDailyPlan = (date: string, data: any) => request<any>(`/plans/${date}`, { method: 'PUT', body: JSON.stringify(data) });

export const generatePlan = (date?: string, availableMinutes?: number) =>
    request<any>('/ai/plan', { method: 'POST', body: JSON.stringify({ date, available_minutes: availableMinutes }) });
export const getSuggestions = (count?: number) => request<any[]>(`/ai/suggestions${count ? `?count=${count}` : ''}`);
export const getPatterns = () => request<any>('/ai/patterns');
export const chatWithAI = (message: string, conversationId?: string) =>
    request<any>('/ai/chat', { method: 'POST', body: JSON.stringify({ message, conversation_id: conversationId }) });

export const getStats = () => request<any>('/stats');
export const getActivity = (limit?: number) => request<any[]>(`/activity${limit ? `?limit=${limit}` : ''}`);

// ─── Billing ───

export const getBillingPlans = () => request<any[]>('/billing/plans', { method: 'GET' }, false);
export const createCheckoutSession = () => request<any>('/billing/checkout', { method: 'POST' });
export const createBillingPortalSession = () => request<any>('/billing/portal', { method: 'POST' });

// ─── Admin ───

export const getAdminStats = () => request<any>('/admin/stats');
export const getAdminUsers = (page = 1) => request<any>(`/admin/users?page=${page}`);
export const updateAdminUser = (id: string, data: any) => request<any>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
