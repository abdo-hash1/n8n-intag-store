/**
 * API Client for backend communication
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    errors?: { field: string; message: string }[];
}

interface RequestOptions extends RequestInit {
    skipAuth?: boolean;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private getAuthToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('accessToken');
    }

    private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
        const data = await response.json();

        if (!response.ok) {
            // Handle 401 - unauthorized
            if (response.status === 401) {
                // Try to refresh token
                const refreshed = await this.refreshToken();
                if (!refreshed) {
                    // Clear auth and redirect to login
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            }

            throw new Error(data.message || 'An error occurred');
        }

        return data;
    }

    private async refreshToken(): Promise<boolean> {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });

            if (!response.ok) return false;

            const data = await response.json();
            localStorage.setItem('accessToken', data.data.tokens.accessToken);
            localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
            return true;
        } catch {
            return false;
        }
    }

    async request<T>(
        endpoint: string,
        options: RequestOptions = {}
    ): Promise<ApiResponse<T>> {
        const { skipAuth = false, ...fetchOptions } = options;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (!skipAuth) {
            const token = this.getAuthToken();
            if (token) {
                (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
            }
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...fetchOptions,
            headers,
        });

        return this.handleResponse<T>(response);
    }

    async get<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    async post<T>(
        endpoint: string,
        body?: unknown,
        options: RequestOptions = {}
    ): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async put<T>(
        endpoint: string,
        body?: unknown,
        options: RequestOptions = {}
    ): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }
}

// Export singleton instance
export const api = new ApiClient(API_URL);

// Auth API
export const authApi = {
    login: (email: string, password: string) =>
        api.post<{ user: unknown; tokens: unknown }>('/api/auth/login', { email, password }, { skipAuth: true }),

    signup: (data: { email: string; password: string; fullName: string; phone?: string }) =>
        api.post<{ user: unknown; tokens: unknown }>('/api/auth/signup', data, { skipAuth: true }),

    logout: () => api.post('/api/auth/logout'),

    refreshToken: (refreshToken: string) =>
        api.post<{ tokens: unknown }>('/api/auth/refresh', { refreshToken }, { skipAuth: true }),

    getMe: () => api.get<{ user: unknown }>('/api/auth/me'),
};

// User API
export const userApi = {
    getProfile: () => api.get<{ user: unknown }>('/api/user/profile'),

    updateProfile: (data: { fullName?: string; phone?: string }) =>
        api.put<{ user: unknown }>('/api/user/profile', data),

    changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
        api.put('/api/user/password', data),

    updatePreferences: (data: { emailNotifications?: boolean; marketingEmails?: boolean }) =>
        api.put('/api/user/preferences', data),

    getSubscription: () => api.get<{ subscription: unknown }>('/api/user/subscription'),

    getActivityLog: (page = 1, limit = 20) =>
        api.get<{ logs: unknown[]; total: number }>(`/api/user/activity?page=${page}&limit=${limit}`),
};
