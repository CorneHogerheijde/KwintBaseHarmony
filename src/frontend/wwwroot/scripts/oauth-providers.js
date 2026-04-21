// Fetches the list of configured OAuth providers from the backend and renders
// the appropriate sign-in buttons into #oauth-buttons / #oauth-section.
// If no providers are available the section stays hidden.

const PROVIDER_META = {
  google: {
    label: "Google",
    className: "oauth-button--google",
    svg: `<svg class="oauth-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`,
  },
  microsoft: {
    label: "Microsoft",
    className: "oauth-button--microsoft",
    svg: `<svg class="oauth-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#00A4EF" d="M13 1h10v10H13z"/><path fill="#7FBA00" d="M1 13h10v10H1z"/><path fill="#FFB900" d="M13 13h10v10H13z"/></svg>`,
  },
  linkedin: {
    label: "LinkedIn",
    className: "oauth-button--linkedin",
    svg: `<svg class="oauth-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  },
};

export async function renderOAuthButtons() {
  const section = document.getElementById("oauth-section");
  const container = document.getElementById("oauth-buttons");
  if (!section || !container) return;

  const backendBase = window.APP_CONFIG?.apiBase?.replace("/api/compositions", "") ?? "http://localhost:5000";

  let providers;
  try {
    const res = await fetch(`${backendBase}/api/auth/providers`);
    if (!res.ok) return;
    providers = await res.json();
  } catch {
    // Backend unreachable — silently hide the section.
    return;
  }

  if (!Array.isArray(providers) || providers.length === 0) return;

  for (const provider of providers) {
    const meta = PROVIDER_META[provider];
    if (!meta) continue;
    const a = document.createElement("a");
    a.href = `/api/auth/oauth/${provider}`;
    a.className = `oauth-button ${meta.className}`;
    a.innerHTML = `${meta.svg} ${meta.label}`;
    container.appendChild(a);
  }

  section.classList.remove("hidden");
}
