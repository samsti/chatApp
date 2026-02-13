// Token storage utilities
let authToken: string | null = null;

export function setAuthToken(token: string) {
    authToken = token;
    localStorage.setItem('chat_auth_token', token);
}

export function getAuthToken(): string | null {
    if (!authToken) {
        authToken = localStorage.getItem('chat_auth_token');
    }
    return authToken;
}

export function clearAuthToken() {
    authToken = null;
    localStorage.removeItem('chat_auth_token');
}

// Helper to get headers with auth token
function getHeaders(): HeadersInit {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

export async function createRoom(apiBaseUrl: string, name: string) {
    const res = await fetch(`${apiBaseUrl}/Chat/CreateRoom`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name }),
    });

    if (!res.ok) {
        throw new Error('Failed to create room');
    }

    return res.json();
}

export async function joinRoom(apiBaseUrl: string, roomId: string, connectionId: string) {
    const res = await fetch(`${apiBaseUrl}/Chat/JoinGroup`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ connectionId, group: roomId }),
    });

    if (!res.ok) {
        throw new Error('Failed to join room');
    }

    return res.json();
}

export async function sendMessage(apiBaseUrl: string, roomId: string, message: string) {
    const res = await fetch(`${apiBaseUrl}/Chat/SendMessageToGroup`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message, groupId: roomId }),
    });

    if (!res.ok) {
        throw new Error('Failed to send message');
    }
}

export async function getRooms(apiBaseUrl: string) {
    const res = await fetch(`${apiBaseUrl}/Chat/GetRooms`);
    if (!res.ok) throw new Error('Failed to fetch rooms');
    return res.json();
}

export async function getMessages(apiBaseUrl: string, roomId: string) {
    const res = await fetch(`${apiBaseUrl}/Chat/GetMessages/${roomId}`, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
}

export async function pokeRoom(apiBaseUrl: string, connectionId: string) {
    const res = await fetch(`${apiBaseUrl}/Chat/Poke`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ connectionIdToPoke: connectionId }),
    });

    if (!res.ok) {
        throw new Error('Failed to poke');
    }
}

export async function getRoomMembers(apiBaseUrl: string, roomId: string) {
    const res = await fetch(`${apiBaseUrl}/Chat/GetRoomMembers/${roomId}`, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch room members');
    return res.json();
}