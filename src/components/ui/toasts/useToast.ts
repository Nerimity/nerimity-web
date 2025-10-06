import { createSignal } from "solid-js";

export type Toast = {
  id: number;
  title?: string;
  message: string;
  color?: string;
  duration?: number; // ms
  action?: { label: string; onClick: () => void };
};

export function useToast() {
  const [toasts, setToasts] = createSignal<Toast[]>([]);
  let counter = 0;

  function pushToast(toast: Omit<Toast, "id">) {
    const id = counter++;
    setToasts((prev) => [...prev, { ...toast, id }]);
    if (toast.duration !== 0) {
      setTimeout(() => removeToast(id), toast.duration ?? 4000);
    }
  }

  function removeToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return { toasts, pushToast, removeToast };
}
