export type ToastTone = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
}

export interface ToastItem extends ToastOptions {
  id: string;
}
