// client/src/lib/api.ts
export const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
}