import styles from "./styles.module.scss";
import { JSX } from "solid-js";
import { classNames, conditionalClass } from "@/common/classNames";
import { css } from "solid-styled-components";

interface BlockProps {
  class?: string;
  children?: JSX.Element | undefined;
  style?: JSX.CSSProperties;
  borderTopRadius?: boolean
  borderBottomRadius?: boolean
  onClick?: () => void;
}

export default function Block(props: BlockProps) {
  return (
    <div
      onClick={props.onClick}
      class={classNames(
        styles.block,
        conditionalClass(props.borderTopRadius === false, styles.joinTop),
        conditionalClass(props.borderBottomRadius === false, styles.joinBottom),
        props.class
      )}
      style={props.style}
    >
      {props.children}
    </div>
  );
}


