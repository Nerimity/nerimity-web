import styles from "./styles.module.scss";
import { JSX } from "solid-js";
import { classNames, conditionalClass } from "@/common/classNames";
import { css } from "solid-styled-components";

interface BlockProps {
  children?: JSX.Element | undefined;
  class?: string;
  borderTopRadius?: boolean
  borderBottomRadius?: boolean
}

export default function Block(props: BlockProps) {
  return (
    <div class={
      classNames(
        styles.block,
        conditionalClass(props.borderTopRadius === false, css`&& {border-top-left-radius: 0; border-top-right-radius: 0; margin-top: 0;}`),
        conditionalClass(props.borderBottomRadius === false, css`&& {border-bottom-left-radius: 0; border-bottom-right-radius: 0; margin-bottom: 0;}`),
        conditionalClass(props.borderBottomRadius === false && props.borderTopRadius === false, css`&& {margin-bottom: 1px;}`),
        props.class
      )}>
      {props.children}
    </div>
  );
}


