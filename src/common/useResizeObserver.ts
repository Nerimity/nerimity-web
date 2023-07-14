import { createEffect, on, onCleanup, onMount } from "solid-js";
import { createStore } from "solid-js/store";



export function useResizeObserver(element: () => HTMLElement | undefined | null) {
  const [dimensions, setDimensions] = createStore({width: 0, height: 0})
  createEffect(on(element, (el) => {
    if (!el) return;
    console.log(el)
    const resizeObserver = new ResizeObserver((entries) => {
      setDimensions({
        width: entries[0].contentRect.width,
        height: entries[0].contentRect.height
      })
    });
    resizeObserver.observe(el);

    onCleanup(() => {
      resizeObserver.disconnect();
    })
  }))
  return {width: () => dimensions.width, height: () => dimensions.height} as const
}


export function useMutationObserver(element: () => HTMLElement | undefined | null, callback: () => void) {
  createEffect(on(element, (el) => {
    if (!el) return;
    const resizeObserver = new MutationObserver(callback);
    resizeObserver.observe(el, {childList: true, subtree: true});

    onCleanup(() => {
      resizeObserver.disconnect();
    })
  }))
}