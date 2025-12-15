import { JSXElement, Match, Show, Switch } from "solid-js";
import styles from "./FounderAdminSupporterBorder.module.css";
import { classNames } from "@/common/classNames";
import { FirstLetterAvatar, ServerOrUserAvatar } from "../ui/Avatar";

export function FounderAdminSupporterBorder(props: {
  children?: JSXElement;
  color?: string;
  url?: string;
  hovered?: boolean;
  overlay?: JSXElement;
  serverOrUser: ServerOrUserAvatar;
  size: number;
  type:
    | "founder"
    | "supporter"
    | "admin"
    | "palestine"
    | "mod"
    | "emo-supporter";
}) {
  return (
    <div
      class={classNames(
        styles.container,
        props.hovered && props.type !== "palestine" ? styles.hover : undefined
      )}
    >
      <Show when={props.type !== "palestine"}>
        <img
          src={`/borders/${props.type}-left-wing.png`}
          class={classNames(styles.wing, styles.leftWing)}
        />
      </Show>
      <img src={`/borders/${props.type}.png`} class={styles.border} />
      <RawAvatar {...props} />
      {props.overlay}
      <Show when={props.type !== "palestine"}>
        <img
          src={`/borders/${props.type}-right-wing.png`}
          class={classNames(styles.wing, styles.rightWing)}
        />
      </Show>
    </div>
  );
}

function RawAvatar(props: {
  children?: JSXElement;
  serverOrUser?: ServerOrUserAvatar;
  size: number;
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

          <Show when={props.url} fallback={<FirstLetterAvatar {...props} />}>
            <img
              src={props.url || "/assets/profile.png"}
              width="100%"
              height="100%"
              loading="lazy"
            />
          </Show>
        </Match>
        <Match when={props.children}>{props.children}</Match>
      </Switch>
    </div>
  );
}
