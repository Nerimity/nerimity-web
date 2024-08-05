import styles from "./Tooltip.module.scss";
import { JSXElement, onCleanup, createUniqueId, createSignal, createEffect, on } from "solid-js";
import { useCustomPortal } from "./custom-portal/CustomPortal";
import { useResizeObserver } from "@/common/useResizeObserver";
import { useWindowProperties } from "@/common/useWindowProperties";
import { classNames } from "@/common/classNames";
import { Delay } from "@/common/Delay";

export const Tooltip = (props: { disable?: boolean; onBeforeShow?: (el: HTMLDivElement) => boolean; children: JSXElement, tooltip: JSXElement, anchor?: "left" | "right", class?: string }) => {
  const {isMobileAgent} = useWindowProperties();
  const {createPortal, closePortalById} = useCustomPortal();
  const id = createUniqueId();

  const portalId = "tooltip" + id;

  createEffect(on(() => props.disable, () => {
    onMouseLeave();
  }))
  

  const onMouseEnter = (e: MouseEvent) => {
    if (props.disable) return;
    if (isMobileAgent()) return;
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    if (props.onBeforeShow) {
      const shouldShow = props.onBeforeShow(e.currentTarget as HTMLDivElement);
      if (!shouldShow) return;
    }

    createPortal(() => <TooltipItem  rect={rect} children={props.tooltip} anchor={props.anchor} />, portalId);
  };
  const onMouseLeave = () => {
    closePortalById(portalId);
  };

  onCleanup(() => {
    onMouseLeave();
  });


  return (
    <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} class={classNames(styles.container, props.class)}>
      {props.children}
    </div>
  );
};

const TooltipItem = (props: {rect: DOMRect, children: JSXElement, anchor?: "left" | "right"}) => {
  const [el, setEl] = createSignal<HTMLElement | undefined>();
  const {height, width} = useResizeObserver(el);

  const style = () => {    
    if (!width()) {
      return undefined;
    }
    let left = (props.rect.left + (props.anchor === "left" ? -width() - 4  : props.rect.width));

    if (props.anchor === "right") {
      if (((width() + left) + 10) > window.innerWidth) {
        left = window.innerWidth - (width() + 20);
      }
    }
    if (props.anchor === "left") {
      if (left <= 0) {
        left = 0;
      }
    }
    

    return {
      top: (props.rect.top + (props.rect.height / 2) - (height() / 2)) + "px", 
      left: left + "px"
    };
  };

  return (
    <div ref={setEl}  class={styles.tooltip} style={style()}>
      <div class={styles.tooltipContent}>{props.children}</div>
    </div>
  );
};