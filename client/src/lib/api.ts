// client/src/lib/api.ts
export const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export function apiFetch(path: string, init?: RequestInit) {
    const token =
        typeof localStorage !== "undefined"
            ? localStorage.getItem("token")
            : null;
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(init?.headers as Record<string, string> | undefined),
    };

    if (token && !headers.Authorization) {
        headers.Authorization = `Bearer ${token}`;
    }

    return fetch(`${API_BASE}${path}`, {
        ...init,
        headers,
    });
}
