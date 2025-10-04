import { For, createSignal, onCleanup } from "solid-js";
import { useToast } from "./useToast";
import style from "./ToastStyles.module.scss";

export default function ToastContainer(props: { store: ReturnType<typeof useToast> }) {
  const { toasts, removeToast } = props.store;

  return (
    <div class={style.toastWrapper}>
      <For each={toasts()}>
        {(toast) => {
          const [progress, setProgress] = createSignal(1);
          const [dragX, setDragX] = createSignal(0);
          const [isRemoving, setIsRemoving] = createSignal(false);
          let interval: number;
          let startX: number | null = null;

          const startTimer = () => {
            const start = Date.now();
            const duration = toast.duration ?? 4000;
            interval = window.setInterval(() => {
              const elapsed = Date.now() - start;
              const remaining = Math.max(duration - elapsed, 0);
              setProgress(remaining / duration);
              if (remaining <= 0) {
                clearInterval(interval);
                triggerRemove();
              }
            }, 50);
          };

          startTimer();
          onCleanup(() => clearInterval(interval));

          const triggerRemove = () => {
            clearInterval(interval); 
            setIsRemoving(true);
            setTimeout(() => removeToast(toast.id), 300);
          };

          const onPointerDown = (e: PointerEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest(`.${style.close}`) || target.closest(`.${style.action}`)) return;

            startX = e.clientX;
            clearInterval(interval);
          };

          const onPointerMove = (e: PointerEvent) => {
            if (startX !== null) {
              const delta = e.clientX - startX;
              setDragX(delta);
            }
          };

          const onPointerUp = () => {
            if (Math.abs(dragX()) > 120) {
              setDragX(dragX() > 0 ? 500 : -500);
              triggerRemove();
            } else {
              setDragX(0);
              startTimer();
            }
            startX = null;
          };

          return (
            <div
              class={`${style.toast} ${isRemoving() ? style.removing : ""}`}
              style={{
                transform: `translateX(${dragX()}px)`,
                opacity: 1 - Math.min(Math.abs(dragX()) / 200, 1),
                transition: startX === null ? "transform 0.3s ease, opacity 0.3s ease" : "none",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <div class={style.content} onClick={() => toast.action?.onClick()}>
                {toast.title && <div class={style.title}>{toast.title}</div>}
                <div class={style.message}>{toast.message}</div>
                {toast.action && (
                  <button
                    class={style.action}
                    onClick={toast.action.onClick}
                    style={{ outline: "none" }} 
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>

              <button
                class={style.close}
                onClick={(e) => { e.stopPropagation(); triggerRemove(); }}
                style={{ outline: "none" }} 
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>

              <div
                class={style.progress}
                style={{
                  "background-color": toast.color || "var(--primary-color)",
                  width: `${progress() * 100}%`,
                }}
              />
            </div>
          );
        }}
      </For>
    </div>
  );
}
