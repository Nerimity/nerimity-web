import { JSXElement } from "solid-js";
import style from "./Item.module.scss";
import { Dynamic } from "solid-js/web";
import { CustomLink } from "./CustomLink";
import Icon from "./icon/Icon";

interface RootProps {
  children?: JSXElement;
  selected?: boolean;
  handlePosition?: "bottom" | "left";
  onClick?: () => void;
  href?: string;
  handleColor?: string;
  gap?: number;
}
const Root = (props: RootProps) => (
  <Dynamic
    component={props.href ? CustomLink : "div"}
    href={props.href}
    class={style.itemRoot}
    style={{ "--handle-color": props.handleColor }}
    onClick={props.onClick}
    data-handle-position={props.handlePosition || "left"}
    data-selected={props.selected}
  >
    <div class={style.itemContent} style={{ gap: `${props.gap}px` }}>
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
