import { createEffect, on, onCleanup, onMount } from "solid-js";
import { createStore } from "solid-js/store";

export function useResizeObserver(element: () => HTMLElement | undefined | null) {
  const [dimensions, setDimensions] = createStore({width: 0, height: 0});
  let frame = 0;
  createEffect(on(element, (el) => {
    if (!el) return;
    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      const height = entries[0].contentRect.height;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (dimensions.width !== width || dimensions.height !== height) {
          setDimensions({width, height});
        }
      });
    });
    resizeObserver.observe(el);

    onCleanup(() => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    });
  }));
  return {width: () => dimensions.width, height: () => dimensions.height} as const;
}

export function useMutationObserver(element: () => HTMLElement | undefined | null, callback: MutationCallback) {
  createEffect(on(element, (el) => {
    if (!el) return;
    const resizeObserver = new MutationObserver(callback);
    resizeObserver.observe(el,{childList: true, subtree: true});

    onCleanup(() => {
      resizeObserver.disconnect();
    });
  }));
}
