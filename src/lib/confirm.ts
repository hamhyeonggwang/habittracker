// 앱 내 확인 다이얼로그 — window.confirm 대체.
// confirmDialog(opts)가 Promise<boolean>을 반환하고, <ConfirmHost/>가 구독해 렌더링한다.

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export type ConfirmState = (ConfirmOptions & { id: number }) | null;
type Listener = (s: ConfirmState) => void;

let current: ConfirmState = null;
let resolver: ((v: boolean) => void) | null = null;
let seq = 0;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach(l => l(current));
}

export function subscribeConfirm(listener: Listener): () => void {
  listeners.add(listener);
  listener(current);
  return () => { listeners.delete(listener); };
}

export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  if (resolver) { resolver(false); resolver = null; } // 이전 대기 취소
  current = { ...opts, id: ++seq };
  emit();
  return new Promise<boolean>((res) => { resolver = res; });
}

export function resolveConfirm(value: boolean) {
  if (resolver) { resolver(value); resolver = null; }
  current = null;
  emit();
}
