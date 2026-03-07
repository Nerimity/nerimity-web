import styles from "./styles.module.scss";
import { JSX } from "solid-js";
import { classNames } from "@/common/classNames";

interface BlockProps {
  class?: string;
  children?: JSX.Element | undefined;
  style?: JSX.CSSProperties;
  onClick?: () => void;
}

export default function Block(props: BlockProps) {
  return (
    <div
      onClick={props.onClick}
      class={classNames(styles.block, props.class)}
      style={props.style}
    >
      {props.children}
    </div>
  );
}
