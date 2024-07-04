import { JSXElement, Match, Show, Switch } from "solid-js";
import styles from "./FounderAdminSupporterBorder.module.css";
import { classNames } from "@/common/classNames";

export function FounderAdminSupporterBorder(props: {
  children?: JSXElement;
  color?: string;
  url?: string;
  hovered?: boolean;
  type: "founder" | "supporter" | "admin";
}) {
  return (
    <div class={classNames(styles.container, props.hovered ? styles.hover : undefined)}>
      <img src={`/borders/${props.type}-left-wing.png`} class={classNames(styles.wing, styles.leftWing)} />
      <img src={`/borders/${props.type}.png`} class={styles.border} />
      <RawAvatar {...props} />
      <img src={`/borders/${props.type}-right-wing.png`} class={classNames(styles.wing, styles.rightWing)} />
    </div>
  );
}

function RawAvatar(props: {
  children?: JSXElement;
  url?: string;
  color?: string;
}) {
  return (
    <div class={styles.rawAvatar}>
      <Switch>
        <Match when={!props.children}>
          <Show when={!props.url && props.color}>
            <div
              style={{ "background-color": props.color }}
              class={styles.background}
            />
          </Show>
          <img
            src={props.url || "/assets/profile.png"}
            width="100%"
            height="100%"
            loading="lazy"
          />
        </Match>
        <Match when={props.children}>{props.children}</Match>
      </Switch>
    </div>
  );
}
