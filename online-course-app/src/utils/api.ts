export async function fetchApi(url: string, options: RequestInit = {}){
    const token = typeof window !== 'undefined' ? localStorage.getItem('user-token') : null;

    const defaultOptions: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}`} : {}),
            ...(options.headers || {})
        },
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {}),
        }
    };

    const response = await fetch(url, mergedOptions);

    if (response.status === 401) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('user-token');

            window.location.href = '/auth';
        }
    }

    return response;
}

export async function getCurrentUser(){
    try {
        const response = await fetchApi('/api/auth/me');

        if (!response.ok) {
            return null;
        }

        return await response.json();
    }
    catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

export function isAuthenticated() {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('user-token')
}

export function logout() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('user-token');
    window.location.href = '/auth';
}