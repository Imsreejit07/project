const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            'X-User-Id': 'default-user',
            ...options?.headers,
        },
        ...options,
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
}

// User
export const getUser = () => request<any>('/user');
export const updateSettings = (settings: any) => request('/user/settings', { method: 'PUT', body: JSON.stringify(settings) });

// Goals
export const getGoals = (status?: string) => request<any[]>(`/goals${status ? `?status=${status}` : ''}`);
export const createGoal = (data: any) => request<any>('/goals', { method: 'POST', body: JSON.stringify(data) });
export const updateGoal = (id: string, data: any) => request<any>(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteGoal = (id: string) => request(`/goals/${id}`, { method: 'DELETE' });

// Projects
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

// Tasks
export const getTasks = (filters?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (filters) Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
    return request<any[]>(`/tasks${qs ? `?${qs}` : ''}`);
};
export const createTask = (data: any) => request<any>('/tasks', { method: 'POST', body: JSON.stringify(data) });
export const updateTask = (id: string, data: any) => request<any>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTask = (id: string) => request(`/tasks/${id}`, { method: 'DELETE' });

// Work Sessions
export const startSession = (taskId?: string) => request<any>('/sessions/start', { method: 'POST', body: JSON.stringify({ task_id: taskId }) });
export const endSession = (id: string, data?: any) => request<any>(`/sessions/${id}/end`, { method: 'POST', body: JSON.stringify(data || {}) });
export const getSessions = (limit?: number) => request<any[]>(`/sessions${limit ? `?limit=${limit}` : ''}`);

// Daily Plans
export const getDailyPlan = (date: string) => request<any>(`/plans/${date}`);
export const updateDailyPlan = (date: string, data: any) => request<any>(`/plans/${date}`, { method: 'PUT', body: JSON.stringify(data) });

// AI
export const generatePlan = (date?: string, availableMinutes?: number) =>
    request<any>('/ai/plan', { method: 'POST', body: JSON.stringify({ date, available_minutes: availableMinutes }) });
export const getSuggestions = (count?: number) => request<any[]>(`/ai/suggestions${count ? `?count=${count}` : ''}`);
export const getPatterns = () => request<any>('/ai/patterns');
export const chatWithAI = (message: string, conversationId?: string) =>
    request<any>('/ai/chat', { method: 'POST', body: JSON.stringify({ message, conversation_id: conversationId }) });

// Analytics
export const getStats = () => request<any>('/stats');
export const getActivity = (limit?: number) => request<any[]>(`/activity${limit ? `?limit=${limit}` : ''}`);
