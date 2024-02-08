import styles from "./DrawerHeader.module.scss";

import { JSXElement, Match, Switch } from "solid-js";

import { classNames } from "@/common/classNames";

export function DrawerHeader(props: {children?: JSXElement, class?: string; text?: string}) {
  return (
    <div class={classNames(styles.drawerHeaderContainer, props.class)}>
      <Switch fallback={props.children}>
        <Match when={props.text}><div class={styles.text}>{props.text}</div></Match>
      </Switch>
    </div>
  );

}