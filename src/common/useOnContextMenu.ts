// Because of trashy safari on ios not haivng a proper contextmenu event, we have to do some bs touchstart and stuff.

import { createUniqueId, onCleanup } from "solid-js";
import { useWindowProperties } from "./useWindowProperties";
import { isFileServingAllowed } from "vite";
import { sourceMapsEnabled } from "process";

let timer: number;

type Handler = (event: any) => void;

let handlers = new Map<HTMLElement, Handler>();

const { isSafari, isMobileAgent } = useWindowProperties();

if (isSafari && isMobileAgent()) {
  let isTouchDown = false;
  let startX = 0;
  let startY = 0;
  let diffX = 0;
  let diffY = 0;
  document.addEventListener(
    "touchstart",
    (event) => {
      startX = event.touches[0]?.clientX || 0;
      startY = event.touches[0]?.clientY || 0;
      timer = window.setTimeout(function () {
        if (diffX >= 10 || diffY >= 10) return;
        if (event.target instanceof Element) {
          const el = event.target.closest("[ctx]");
          if (!el) return;
          const handler = handlers.get(el as HTMLDivElement);
          if (handler) {
            isTouchDown = true;
            handler(event);
          }
        }
      }, 1000);
    },
    false
  );

  document.addEventListener("touchmove", (event) => {
    diffX = Math.abs(startX - (event.touches[0]?.clientX || 0));
    diffY = Math.abs(startY - (event.touches[0]?.clientY || 0));
  });

  document.addEventListener("touchend", (event) => {
    if (isTouchDown) {
      isTouchDown = false;
      event.preventDefault();
    }

    window.clearTimeout(timer);
  });
}

document.addEventListener("contextmenu", (event) => {
  if (!event.target) return;
  if (event.target instanceof Element) {
    const el = event.target.closest("[ctx]");
    if (!el) return;
    const handler = handlers.get(el as HTMLDivElement);
    handler?.(event);
  }
});

export function onContextMenu(
  el: HTMLDivElement,
  value: () => Handler | undefined
) {
  const handler = value();
  if (!handler) return;
  el.setAttribute("ctx", "");
  handlers.set(el, handler);

  onCleanup(() => {
    handlers.delete(el);
  });
}
