"use client";

import type { AdminSession } from "./types";

const SESSION_KEY = "turfin.admin.session";

export function saveAdminSession(session: AdminSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getAdminSession(): AdminSession | null {
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearAdminSession() {
  window.localStorage.removeItem(SESSION_KEY);
}
