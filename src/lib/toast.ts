// 프레임워크 무관 토스트 이벤트 버스.
// storage 등 lib 레이어에서 showToast를 호출하고, ui/Toast.tsx의 <Toaster/>가 구독해 렌더링한다.

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach(l => l(toasts));
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  listener(toasts);
  return () => { listeners.delete(listener); };
}

export function dismissToast(id: string) {
  toasts = toasts.filter(t => t.id !== id);
  emit();
}

export function showToast(message: string, type: ToastType = 'info', durationMs = 3500) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  toasts = [...toasts, { id, message, type }];
  emit();
  if (durationMs > 0) {
    setTimeout(() => dismissToast(id), durationMs);
  }
}
