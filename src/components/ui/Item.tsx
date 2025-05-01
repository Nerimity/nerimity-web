import { JSXElement } from "solid-js";
import style from "./Item.module.scss";
import { Dynamic } from "solid-js/web";
import { CustomLink } from "./CustomLink";
import Icon from "./icon/Icon";
import { cn } from "@/common/classNames";

interface RootProps {
  children?: JSXElement;
  selected?: boolean;
  handlePosition?: "bottom" | "left";
  onClick?: (e?: MouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  href?: string;
  handleColor?: string;
  gap?: number;
  class?: string;
}
const Root = (props: RootProps) => (
  <Dynamic
    component={props.href ? CustomLink : "div"}
    href={props.href}
    class={cn(style.itemRoot, props.class)}
    data-selected={props.selected}
    style={{ "--handle-color": props.handleColor }}
    onClick={props.onClick}
    data-handle-position={props.handlePosition || "left"}
    data-selected={props.selected}
    onMouseEnter={props.onMouseEnter}
    onMouseLeave={props.onMouseLeave}
  >
    <div
      class={cn(style.itemContent, "itemContent")}
      style={{ gap: `${props.gap}px` }}
    >
      {props.children}
    </div>
  </Dynamic>
);

const IconItem = (props: { children?: string }) => (
  <Icon name={props.children} size={18} />
);

const Label = (props: { children?: JSXElement }) => (
  <div class={style.label}>{props.children}</div>
);

export const Item = {
  Root,
  Label,
  Icon: IconItem,
};
