import { JSX } from "solid-js/jsx-runtime";
import styles from "./styles.module.scss";
import { classNames } from "@/common/classNames";

interface IconProps {
  name?: string;
  color?: string;
  size?: number;
  class?: string;
  style?: JSX.CSSProperties;
  title?: string
  onClick?: JSX.EventHandlerUnion<HTMLSpanElement, MouseEvent>;
}

/**
 * @deprecated Use unplugin-icons instead. https://icones.js.org/collection/material-symbols?variant=Rounded
 */
export default function Icon(props: IconProps) {
  return (
    <span
      class={classNames("icon", "material-symbols-rounded", styles.icon, props.class)}
      style={{color: props.color, "font-size": props.size + "px", ...props.style}}
      title={props.title}
      onClick={props.onClick}>
      {props.name || "texture"} 
    </span>
  );
}
