import styles from "./styles.module.scss";
import { JSX, JSXElement, Show, children } from "solid-js";
import Icon from "@/components/ui/icon/Icon";
import { classNames, conditionalClass } from "@/common/classNames";
import { css } from "solid-styled-components";
import { Dynamic } from "solid-js/web";
import { CustomLink } from "../CustomLink";

interface BlockProps {
  label: string;
  icon?: string;
  iconSrc?: string;
  description?: string | JSXElement;
  children?: JSX.Element | undefined;
  header?: boolean;
  class?: string;
  borderTopRadius?: boolean;
  borderBottomRadius?: boolean;
  onClick?: () => void;
  onClickIcon?: string;
  href?: string;
  hrefBlank?: boolean;
  historyState?: any;
}

export default function SettingsBlock(props: BlockProps) {
  const child = children(() => props.children);
  return (
    <Dynamic
      component={props.href ? CustomLink : "div"}
      {...(props.hrefBlank
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      state={props.historyState}
      href={props.href}
      class={classNames(
        styles.block,
        conditionalClass(props.header, styles.header!),
        conditionalClass(
          props.borderTopRadius === false,
          css`
            && {
              border-top-left-radius: 0;
              border-top-right-radius: 0;
              margin-top: 0;
            }
          `
        ),
        conditionalClass(
          props.borderBottomRadius === false,
          css`
            && {
              border-bottom-left-radius: 0;
              border-bottom-right-radius: 0;
              margin-bottom: 0;
            }
          `
        ),
        conditionalClass(
          props.borderBottomRadius === false && props.borderTopRadius === false,
          css`
            && {
              margin-bottom: 1px;
            }
          `
        ),
        conditionalClass(props.onClick || props.href, styles.clickable!),
        props.class
      )}
      onClick={props.onClick}
    >
      <div class={styles.outerContainer}>
        <Show
          when={props.iconSrc}
          fallback={<Icon name={props.icon || "texture"} />}
        >
          <img class={styles.icon} src={props.iconSrc} alt="" />
        </Show>
        <div class={styles.details}>
          <div class={styles.label}>{props.label}</div>
          <Show when={props.description}>
            <div class={styles.description}>{props.description}</div>
          </Show>
        </div>
      </div>
      {child()}
      <Show when={!child() && (props.onClick || props.href)}>
        <Icon name={props.onClickIcon || "keyboard_arrow_right"} />
      </Show>
    </Dynamic>
  );
}
