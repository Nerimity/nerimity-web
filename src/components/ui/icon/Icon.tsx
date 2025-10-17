import { JSX } from "solid-js/jsx-runtime";
import styles from "./styles.module.scss";
import { classNames } from "@/common/classNames";
import { createEffect } from "solid-js";
import env from "@/common/env";

interface IconProps {
  name?: string;
  color?: string;
  size?: number;
  class?: string;
  style?: JSX.CSSProperties;
  title?: string;
  onClick?: JSX.EventHandlerUnion<HTMLSpanElement, MouseEvent>;
}

const url = "https://nerimity.com/msr/";
const iconCache: Record<string, string> = {};

const fetchWithCache = async (url: string) => {
  const cache = await window.caches?.match(url, { cacheName: "icons" });
  if (cache) return cache.text();

  const res = await fetch(url);
  if (!res.ok) return false;
  await window.caches
    ?.open("icons")
    .then((cache) => cache.put(url, res.clone()));
  return res.text();
};

const fetchIcon = async (name = "texture", el: HTMLSpanElement, size = 24) => {
  const border = name.endsWith("_border");
  name = name.replace("_border", "");
  if (!border) {
    name += "-fill";
  }

  const fullUrl = url + name + ".svg";

  const res = iconCache[fullUrl] || (await fetchWithCache(fullUrl));
  if (!res) {
    console.error(`Icon ${fullUrl} not found`);
    return;
  }
  iconCache[fullUrl] = res;

  const strSize = size + "px";

  const transformed = res.replace(
    'width="48" height="48"',
    `width="${strSize}" height="${strSize}" fill="currentColor"`
  );

  el.innerHTML = transformed;
};
export default function Icon(props: IconProps) {
  let el: HTMLSpanElement | undefined;

  createEffect(() => {
    fetchIcon(props.name, el!, props.size);
  });

  return (
    <span
      ref={el}
      {...(env.DEV_MODE ? { "data-icon": props.name } : undefined)}
      class={classNames("icon", styles.icon, props.class)}
      style={{
        color: props.color,
        ...props.style,
        width: (props.size || 24) + "px",
        height: (props.size || 24) + "px",
      }}
      title={props.title}
      onClick={props.onClick}
    />
  );
}
