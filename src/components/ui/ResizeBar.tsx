import style from "./ResizeBar.module.css";
import { Show } from "solid-js";
import { StorageKeys, useLocalStorage } from "@/common/localStorage";
import { useWindowProperties } from "@/common/useWindowProperties";
import { useResizeObserver } from "@/common/useResizeObserver";

interface ResizeBarOpts {
  storageKey: StorageKeys;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  element: () => HTMLElement | null | undefined;
  invert?: boolean;
}

export const useResizeBar = (opts: ResizeBarOpts) => {
  const { isMobileWidth } = useWindowProperties();

  const [width, setWidth] = useLocalStorage(opts.storageKey, opts.defaultWidth);

  const resizeObserver = useResizeObserver(() => opts.element());

  let startX = 0;
  let startWidth = 0;
  const onResizeMove = (event: MouseEvent) => {
    let newWidth = startWidth + (event.clientX - startX);
    if (opts.invert) {
      newWidth = startWidth - (event.clientX - startX);
    }
    if (newWidth < opts.minWidth) return;
    if (newWidth >= opts.maxWidth) return;
    if (opts.element()) {
      setWidth(newWidth);
    }
  };

  const onResizeUp = () => {
    document.removeEventListener("mousemove", onResizeMove);
    document.removeEventListener("mouseup", onResizeUp);
  };

  const onResizeDown = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    startWidth = resizeObserver.width();
    startX = event.clientX;
    document.addEventListener("mousemove", onResizeMove);
    document.addEventListener("mouseup", onResizeUp);
  };

  const Handle = (props: { left?: number; right?: number }) => {
    const localStyle = () => ({
      ...(props.left !== undefined ? { left: `${props.left}px` } : {}),
      ...(props.right !== undefined ? { right: `${props.right}px` } : {}),
    });
    return (
      <Show when={!isMobileWidth()}>
        <div
          style={localStyle()}
          class={style.resizeHandle}
          onMouseDown={onResizeDown}
        />
      </Show>
    );
  };

  return {
    Handle,
    width: () => {
      if (width() < opts.minWidth) return opts.defaultWidth;
      if (width() >= opts.maxWidth) return opts.maxWidth;
      if (isMobileWidth()) return opts.defaultWidth;
      return width();
    },
  };
};
