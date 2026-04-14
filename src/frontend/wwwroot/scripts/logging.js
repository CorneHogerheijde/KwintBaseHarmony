import { activityLog, statusPill } from "./dom.js";

export function log(message, payload) {
  const line = payload ? `${message}\n${JSON.stringify(payload, null, 2)}` : message;
  activityLog.textContent = `${new Date().toLocaleTimeString()} ${line}\n\n${activityLog.textContent}`.trim();
}

export function setStatus(message, isHealthy) {
  statusPill.textContent = message;
  statusPill.style.background = isHealthy ? "rgba(18, 110, 90, 0.1)" : "rgba(187, 94, 48, 0.14)";
  statusPill.style.color = isHealthy ? "#0b4e40" : "#8b3a16";
}