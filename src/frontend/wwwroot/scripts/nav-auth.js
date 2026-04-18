import { isLoggedIn, getUser, clearAuth } from "./auth.js";

/**
 * Renders a login link or user email + logout button into `containerId`.
 * The container element must exist in the DOM when this runs.
 */
export function renderAuthNav(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (isLoggedIn()) {
        const user = getUser();
        container.innerHTML = `
            <span class="auth-nav-email">${escapeHtml(user?.email ?? "")}</span>
            <button id="auth-logout-btn" class="auth-nav-logout-btn">Log out</button>
        `;
        document.getElementById("auth-logout-btn").addEventListener("click", () => {
            clearAuth();
            window.location.reload();
        });
    } else {
        container.innerHTML = `
            <a href="/login.html" class="auth-nav-login-link">Log in</a>
            <a href="/register.html" class="auth-nav-register-link">Register</a>
        `;
    }
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
