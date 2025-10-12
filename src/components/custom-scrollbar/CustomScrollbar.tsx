import { cn } from "@/common/classNames";
import style from "./CustomScrollbar.module.scss";

import {
  useMutationObserver,
  useResizeObserver,
} from "@/common/useResizeObserver";
import { createEffect, createSignal, on, onCleanup, onMount } from "solid-js";
import { createContextProvider } from "@solid-primitives/context";

interface CustomScrollbarProps {
  scrollElement?: HTMLElement;
  class?: string;
  marginTop?: number;
  marginBottom?: number;
}

const [CustomScrollbarProvider, _useCustomScrollbar] = createContextProvider(
  () => {
    const [isVisible, setIsVisible] = createSignal(false);
    const [marginTop, setMarginTop] = createSignal(0);
    const [marginBottom, setMarginBottom] = createSignal(0);
    const [thumbColor, setThumbColor] = createSignal("var(--primary-color)");
    const [contentHovered, setContentHovered] = createSignal(false);

    return {
      marginTop,
      marginBottom,
      setMarginTop,
      setMarginBottom,
      contentHovered,
      setContentHovered,
      isVisible: () => isVisible() && contentHovered(),
      setIsVisible,
      thumbColor,
      setThumbColor,
    };
  },
  {
    marginTop: () => 0,
    marginBottom: () => 0,
    setContentHovered: () => {},
    contentHovered: () => false,
    setMarginBottom: () => {},
    setMarginTop: () => {},
    isVisible: () => false,
    setIsVisible: () => {},
    thumbColor: () => "var(--primary-color)",
    setThumbColor: () => {},
  }
);

export { CustomScrollbarProvider };

export const useCustomScrollbar = () => {
  const hook = _useCustomScrollbar();
  onCleanup(() => {
    hook.setThumbColor("var(--primary-color)");
  });
  return hook;
};

export const CustomScrollbar = (props: CustomScrollbarProps) => {
  let scrollBarEl: HTMLDivElement | undefined;
  let thumbEl: HTMLDivElement | undefined;
  const {
    marginBottom,
    marginTop,
    setMarginBottom,
    setMarginTop,
    isVisible,
    setIsVisible,
    setContentHovered,
    thumbColor,
  } = useCustomScrollbar();
  setMarginBottom(props.marginBottom || 0);
  setMarginTop(props.marginTop || 0);

  const scrollElement = () => props.scrollElement;
  const { height, width } = useResizeObserver(scrollElement);
  const [thumbHeight, setThumbHeight] = createSignal(0);
  const [thumbTop, setThumbTop] = createSignal(0);
  let tempHovered = false;
  let isMouseDown = false;

  createEffect(
    on(scrollElement, (el) => {
      el?.addEventListener("scroll", update, { passive: true });
      onCleanup(() => el?.removeEventListener("scroll", update));
    })
  );

  const calculateThumbHeight = () => {
    if (!scrollElement()) return;
    if (!scrollBarEl) return;

    const scrollbarHeight = scrollBarEl.clientHeight;

    const thumbHeightRatio =
      scrollbarHeight * (height() / scrollElement()!.scrollHeight);

    if (thumbHeightRatio < 15) return 15;

    return thumbHeightRatio;
  };

  function calculateThumbTopPosition() {
    if (!scrollElement()) return;
    if (!scrollBarEl) return;

    const viewportHeight = scrollElement()!.clientHeight;
    const contentHeight = scrollElement()!.scrollHeight;
    const scrollbarHeight = scrollBarEl.clientHeight;

    const scrollableDistance = contentHeight - viewportHeight;

    const thumbHeight = (viewportHeight / contentHeight) * scrollbarHeight;

    const scrollPosition = scrollElement()!.scrollTop;
    const thumbTopPosition =
      (scrollPosition / scrollableDistance) * (scrollbarHeight - thumbHeight);

    return thumbTopPosition;
  }

  const update = () => {
    setThumbHeight(calculateThumbHeight() || 0);
    setThumbTop(calculateThumbTopPosition() || 0);
    setIsVisible(scrollElement()!.scrollHeight > scrollElement()!.clientHeight);
  };

  const onDomChange = () => {
    update();
  };

  useMutationObserver(scrollElement!, onDomChange);

  const dimensions = [width, height];
  createEffect(on(dimensions, update));

  // handle thumb drag

  let yOffset = 0;

  const onMouseDown = (e: MouseEvent) => {
    isMouseDown = true;
    e.preventDefault();
    if (!scrollElement()) return;
    if (!scrollBarEl) return;
    if (!thumbEl) return;

    const rect = thumbEl.getBoundingClientRect();
    yOffset = e.clientY - rect.top;

    document.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseup", onMouseUp, { once: true });
  };

  let frameAnimation: number | undefined;
  const onMouseMove = (e: MouseEvent) => {
    if (frameAnimation) {
      window.cancelAnimationFrame(frameAnimation);
    }
    frameAnimation = window.requestAnimationFrame(() => {
      if (!scrollElement()) return;
      if (!thumbEl) return;
      if (!scrollBarEl) return;

      const top = e.clientY - scrollBarEl.getBoundingClientRect().top - yOffset;

      const thumbHeight = thumbEl.clientHeight;

      const scrollableDistance =
        scrollElement()!.scrollHeight - scrollElement()!.clientHeight;

      const scrollPosition =
        (top / (scrollBarEl.clientHeight - thumbHeight)) * scrollableDistance;

      scrollElement()!.scrollTop = scrollPosition;
    });
  };

  const onMouseUp = () => {
    isMouseDown = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    setContentHovered(tempHovered);
  };

  const handleContentMouseEnter = () => {
    tempHovered = true;
    setContentHovered(true);
  };
  const handleContentMouseLeave = () => {
    tempHovered = false;
    if (isMouseDown) return;
    setContentHovered(false);
  };

  createEffect(
    on(scrollElement, () => {
      const el = scrollElement();
      el?.addEventListener("mouseenter", handleContentMouseEnter);
      el?.addEventListener("mouseleave", handleContentMouseLeave);
      onCleanup(() => {
        el?.removeEventListener("mouseenter", handleContentMouseEnter);
        el?.removeEventListener("mouseleave", handleContentMouseLeave);
      });
    })
  );

  return (
    <div
      ref={scrollBarEl}
      class={cn(style.scrollbarContainer, props.class)}
      style={{
        "margin-top": `${marginTop()}px`,
        "margin-bottom": `${marginBottom()}px`,
        visibility: isVisible() ? "visible" : "hidden",
      }}
    >
      <div
        onMouseDown={onMouseDown}
        ref={thumbEl}
        class={style.scrollbarThumb}
        style={{
          height: `${thumbHeight()}px`,
          top: `${thumbTop()}px`,
          background: thumbColor(),
        }}
      />
    </div>
  );
};
