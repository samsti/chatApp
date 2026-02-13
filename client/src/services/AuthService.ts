// Single source of truth for token: chatApi.ts
// Import for local use AND re-export so existing consumers still work.
import { getAuthToken, setAuthToken, clearAuthToken } from "./chatApi";
export { getAuthToken, setAuthToken, clearAuthToken };

// Decode JWT to get user info (username/id)
export function decodeToken(token: string): any {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

// Get current user info from stored token
export function getCurrentUser(): { userId: string; username?: string } | null {
    const token = getAuthToken();
    if (!token) return null;

    const decoded = decodeToken(token);
    if (!decoded) return null;

    return {
        userId: decoded.sub || decoded.nameid || decoded.userId,
        username: decoded.unique_name || decoded.name || decoded.username
    };
}

// Call this in your login component after successful login
export async function login(apiBaseUrl: string, username: string, password: string): Promise<string> {
    const res = await fetch(`${apiBaseUrl}/Chat/Login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
        throw new Error('Login failed');
    }

    const data = await res.json();
    setAuthToken(data.token);
    return data.token;
}

// Call this in your register component after successful registration
export async function register(apiBaseUrl: string, username: string, password: string): Promise<string> {
    const res = await fetch(`${apiBaseUrl}/Chat/Register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
        throw new Error('Registration failed');
    }

    const data = await res.json();
    setAuthToken(data.token);
    return data.token;
}

// Call this when user logs out
export async function logout() {
    clearAuthToken();
}