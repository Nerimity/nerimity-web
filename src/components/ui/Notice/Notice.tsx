import styles from "./Notice.module.css";

import { JSX, Match, Show, Switch, For } from "solid-js";
import { classNames } from "@/common/classNames";
import Icon from "../icon/Icon";

const noticeType = {
  warn: {
    single: "Warning",
    plural: "Warnings",
    borderColor: "var(--warn-color)",
    icon: "warning",
  },
  error: {
    single: "Error",
    plural: "Errors",
    borderColor: "var(--alert-color)",
    icon: "error",
  },
  info: {
    single: "Info",
    plural: "Infos",
    borderColor: "var(--primary-color)",
    icon: "info",
  },
  caution: {
    single: "Caution",
    plural: "Caution",
    borderColor: "var(--alert-color)",
    icon: "error",
  },
  success: {
    single: "Success",
    plural: "Success",
    borderColor: "var(--success-color)",
    icon: "check_circle",
  },
};

interface NoticeProps {
  class?: string;
  description?: string | string[];
  type: keyof typeof noticeType;
  children?: JSX.Element;
  style?: JSX.CSSProperties;
  title?: string;
  icon?: string;
}

export function Notice(props: NoticeProps) {
  const typeMeta = noticeType[props.type];

  return (
    <div
      class={classNames(styles.noticeContainer, props.class)}
      style={props.style}
    >
      <div class={styles.noticeHeader}>
        <Icon
          color={typeMeta.borderColor}
          size={18}
          name={props.icon || typeMeta.icon}
        />
        <div style={{ color: typeMeta.borderColor }} class={styles.noticeTitle}>
          {props.title ||
            (Array.isArray(props.description) && props.description.length > 1
              ? typeMeta.plural
              : typeMeta.single)}
        </div>
      </div>
      <Show when={props.description}>
        <Switch>
          <Match when={Array.isArray(props.description)}>
            <ul class={styles.noticeList}>
              <For each={props.description as string[]}>
                {(item) => <li>{item}</li>}
              </For>
            </ul>
          </Match>
          <Match when={!Array.isArray(props.description)}>
            <div class={styles.noticeDescription}>{props.description}</div>
          </Match>
        </Switch>
      </Show>
      <Show when={props.children}>
        <div class={styles.noticeContent}>{props.children}</div>
      </Show>
    </div>
  );
}
