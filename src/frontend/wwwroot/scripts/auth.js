// Auth helpers — token stored in sessionStorage (cleared on tab close)
// For production, prefer httpOnly cookies with SameSite=Strict.

const TOKEN_KEY = "kbh_token";
const USER_KEY = "kbh_user";

export function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
}

export function getUser() {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
}

export function setAuth(token, user) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
}

export function isLoggedIn() {
    return !!getToken();
}

/** Redirect to /login.html if not authenticated. */
export function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    }
}
