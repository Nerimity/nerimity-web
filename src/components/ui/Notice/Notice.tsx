import styles from "./Notice.module.css";

import { JSX, Match, Show, Switch, For } from "solid-js";
import { classNames } from "@/common/classNames";
import Icon from "../icon/Icon";

export type NoticeLink = {
  label: string;
  href: string;
  target?: "_blank" | "_self";
};

type NoticeDescription = string | NoticeLink;

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
  description?: NoticeDescription | NoticeDescription[];
  links?: Record<string, NoticeLink>;
  type: keyof typeof noticeType;
  children?: JSX.Element;
  style?: JSX.CSSProperties;
  title?: string;
  icon?: string;
}

function isNoticeLink(value: unknown): value is NoticeLink {
  return (
    typeof value === "object" &&
    value !== null &&
    "label" in value &&
    "href" in value &&
    typeof value.label === "string" &&
    typeof value.href === "string" &&
    (!("target" in value) ||
      value.target === "_blank" ||
      value.target === "_self")
  );
}

function renderLink(link: NoticeLink) {
  return (
    <a
      href={link.href}
      target={link.target ?? "_self"}
      rel={link.target === "_blank" ? "noopener noreferrer" : undefined}
      class={styles.noticeLink}
    >
      {link.label}
    </a>
  );
}

function renderWithTokens(
  text: string,
  links?: Record<string, NoticeLink>
): JSX.Element {
  if (!links) return text;

  const parts: JSX.Element[] = [];
  const regex = /{{(.*?)}}/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text))) {
    const key = match[1];
    const link = links[key];

    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (link) {
      parts.push(renderLink(link));
    } else {
      parts.push(match[0]);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

function renderDescription(
  item: NoticeDescription,
  links?: Record<string, NoticeLink>
) {
  if (isNoticeLink(item)) return renderLink(item);
  return renderWithTokens(item, links);
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
              <For each={props.description as NoticeDescription[]}>
                {(item) => <li>{renderDescription(item, props.links)}</li>}
              </For>
            </ul>
          </Match>

          <Match when={!Array.isArray(props.description)}>
            <div class={styles.noticeDescription}>
              {renderDescription(
                props.description as NoticeDescription,
                props.links
              )}
            </div>
          </Match>
        </Switch>
      </Show>

      <Show when={props.children}>
        <div class={styles.noticeContent}>{props.children}</div>
      </Show>
    </div>
  );
}
