import { apiBaseUrl } from "./dom.js";
import { setStatus } from "./logging.js";

export async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    ...options
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function checkBackendStatus() {
  try {
    const response = await fetch("http://localhost:5000/health", { method: "GET", mode: "cors" });
    if (!response.ok) {
      throw new Error(`Health check returned ${response.status}`);
    }

    setStatus("Backend reachable on http://localhost:5000", true);
  } catch {
    setStatus("Backend not reachable on http://localhost:5000", false);
  }
}