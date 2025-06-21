import styles from "./DrawerHeader.module.scss";

import { JSX, JSXElement, Match, Switch } from "solid-js";

import { classNames } from "@/common/classNames";

export function DrawerHeader(props: {
  children?: JSXElement;
  class?: string;
  text?: string;
  style?: JSX.CSSProperties;
}) {
  return (
    <div
      style={props.style}
      class={classNames(styles.drawerHeaderContainer, props.class)}
    >
      <Switch fallback={props.children}>
        <Match when={props.text}>
          <div class={styles.text}>{props.text}</div>
        </Match>
      </Switch>
    </div>
  );
}
