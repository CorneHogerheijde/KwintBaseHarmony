import { setAuth, isLoggedIn } from "./scripts/auth.js";

if (isLoggedIn()) {
    window.location.href = "/";
}

const form = document.getElementById("register-form");
const errorEl = document.getElementById("register-error");

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.classList.add("hidden");

    const email = document.getElementById("email-input").value.trim();
    const password = document.getElementById("password-input").value;
    const role = document.getElementById("role-select").value;

    try {
        const response = await fetch(`${APP_CONFIG.apiBase.replace("/api/compositions", "")}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, role })
        });

        if (response.status === 409) {
            showError("An account with this email already exists.");
            return;
        }
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            showError(data.error || "Registration failed.");
            return;
        }

        const data = await response.json();
        setAuth(data.token, { userId: data.userId, email: data.email, role: data.role });
        window.location.href = "/";
    } catch {
        showError("Could not reach the server. Is the backend running?");
    }
});

function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove("hidden");
}
