import { JSX } from "solid-js/jsx-runtime";
import styles from "./styles.module.scss";
import { classNames } from "@/common/classNames";
import { createEffect } from "solid-js";

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
  const cache = await caches.match(url, { cacheName: "icons" });
  if (cache) return cache;

  const res = await fetch(url);
  if (!res.ok) return res;
  await caches.open("icons").then((cache) => cache.put(url, res.clone()));
  return res;
};

const fetchIcon = async (name = "texture", el: HTMLSpanElement) => {
  const border = name.endsWith("_border");
  name = name.replace("_border", "");
  if (!border) {
    name += "-fill";
  }

  const fullUrl = url + name + ".svg";
  if (iconCache[fullUrl]) {
    el.innerHTML = iconCache[fullUrl]!;
    return;
  }
  const res = await fetchWithCache(fullUrl);
  if (res.status !== 200) {
    console.error(`Icon ${fullUrl} not found`);
    return;
  }
  const raw = await res.text();
  const transformed = raw.replace("width=\"48\" height=\"48\"", "fill=\"currentColor\"");
  iconCache[fullUrl] = transformed;

  el.innerHTML = transformed;

};
export default function Icon(props: IconProps) {
  let el: HTMLSpanElement | undefined;

  createEffect(() => {
    fetchIcon(props.name, el!);
  });

  return (
    <span
    ref={el}
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
