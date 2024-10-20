import { cn } from "@/common/classNames";
import style from "./CustomScrollbar.module.scss";

import {
  useMutationObserver,
  useResizeObserver,
} from "@/common/useResizeObserver";
import { createEffect, createSignal, on, onCleanup } from "solid-js";
import { createContextProvider } from "@solid-primitives/context";

interface CustomScrollbarProps {
  scrollElement?: HTMLElement;
  class?: string;
  marginTop?: number;
  marginBottom?: number;
}

export const [CustomScrollbarProvider, useCustomScrollbar] =
  createContextProvider(
    () => {
      const [isVisible, setIsVisible] = createSignal(false);
      const [marginTop, setMarginTop] = createSignal(0);
      const [marginBottom, setMarginBottom] = createSignal(0);

      return {
        marginTop,
        marginBottom,
        setMarginTop,
        setMarginBottom,
        isVisible,
        setIsVisible,
      };
    },
    {
      marginTop: () => 0,
      marginBottom: () => 0,
      setMarginBottom: () => {},
      setMarginTop: () => {},
      isVisible: () => false,
      setIsVisible: () => {},
    }
  );

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
  } = useCustomScrollbar();
  setMarginBottom(props.marginBottom || 0);
  setMarginTop(props.marginTop || 0);

  const scrollElement = () => props.scrollElement;
  const { height, width } = useResizeObserver(scrollElement);
  const [thumbHeight, setThumbHeight] = createSignal(0);
  const [thumbTop, setThumbTop] = createSignal(0);

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
    e.preventDefault();
    if (!scrollElement()) return;
    if (!scrollBarEl) return;
    if (!thumbEl) return;

    const rect = thumbEl.getBoundingClientRect();
    yOffset = e.clientY - rect.top;

    document.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseup", onMouseUp, { once: true });
  };

  const onMouseMove = (e: MouseEvent) => {
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

    // thumbEl.style.top = `${top}px`;
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

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
        }}
      />
    </div>
  );
};
