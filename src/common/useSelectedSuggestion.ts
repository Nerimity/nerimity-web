import { createEffect, createSignal, onCleanup } from "solid-js";

export function useSelectedSuggestion(
  length: () => number,
  textArea: HTMLTextAreaElement,
  onEnterClick: (i: number) => void,
  sendButtonRef?: () => HTMLButtonElement | undefined
) {
  const [current, setCurrent] = createSignal(0);

  createEffect(() => {

    sendButtonRef?.()?.addEventListener("click", onSendClick);
    textArea.addEventListener("keydown", onKey);
    onCleanup(() => {
      sendButtonRef?.()?.removeEventListener("click", onSendClick);
      textArea.removeEventListener("keydown", onKey);
    });
  });

  const next = () => {
    if (current() + 1 >= length()) {
      setCurrent(0);
    } else {
      setCurrent(current() + 1);
    }
  };

  const previous = () => {
    if (current() - 1 < 0) {
      setCurrent(length() - 1);
    } else {
      setCurrent(current() - 1);
    }
  };

  const onSendClick = (event: MouseEvent) => {
    if (!length()) return;
    event.stopPropagation();
    event.preventDefault();
    onEnterClick(current());
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.shiftKey) return;
    if (!length()) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      next();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      previous();
    }


    if (event.key === "Enter" || event.key === "Tab") {
      event.stopPropagation();
      event.preventDefault();
      onEnterClick(current());
    }
  };

  return [current, next, previous, setCurrent] as const;
}