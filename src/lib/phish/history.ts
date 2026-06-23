import type { UrlScanResult } from "./types";

const KEY = "phishguard:history:v1";
const LIMIT = 20;

export function loadHistory(): UrlScanResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UrlScanResult[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveScans(items: UrlScanResult[]): void {
  if (typeof window === "undefined") return;
  const existing = loadHistory();
  const next = [...items, ...existing].slice(0, LIMIT);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}