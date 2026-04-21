import { setAuth, isLoggedIn } from "./scripts/auth.js";

// If already logged in, redirect straight to home
if (isLoggedIn()) {
    window.location.href = "/";
}

const form = document.getElementById("login-form");
const errorEl = document.getElementById("login-error");
const params = new URLSearchParams(window.location.search);
const redirect = params.get("redirect") || "/";

// ── Handle OAuth callback ─────────────────────────────────────────────────────
// After a social login the backend redirects here with token + user info in
// the query string.  Store the auth data and navigate to the requested page.
const oauthToken = params.get("token");
const oauthError = params.get("error");

if (oauthToken) {
    const userId = params.get("userId") ?? "";
    const email  = params.get("email")  ?? "";
    const role   = params.get("role")   ?? "Student";
    setAuth(oauthToken, { userId, email, role });
    // Clean the URL so the token is not sitting in browser history, then redirect.
    window.location.replace(redirect);
} else if (oauthError) {
    showError("Social login failed — please try again or use email/password.");
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.classList.add("hidden");

    const email = document.getElementById("email-input").value.trim();
    const password = document.getElementById("password-input").value;

    try {
        const response = await fetch(`${APP_CONFIG.apiBase.replace("/api/compositions", "")}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (response.status === 401) {
            showError("Incorrect email or password.");
            return;
        }
        if (!response.ok) {
            const text = await response.text();
            showError(text || "Login failed.");
            return;
        }

        const data = await response.json();
        setAuth(data.token, { userId: data.userId, email: data.email, role: data.role });
        window.location.href = redirect;
    } catch {
        showError("Could not reach the server. Is the backend running?");
    }
});

function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove("hidden");
}
