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

const fetchWithCache = async (url: string) => {
  const cache = await caches.match(url, { cacheName: "icons" });
  if (cache) return cache;

  const res = await fetch(url);
  if (!res.ok) return res;
  await caches.open("icons").then((cache) => cache.put(url, res.clone()));
  return res;
};

const fetchIcon = async (name = "texture", svgEl: SVGSVGElement) => {
  const border = name.endsWith("_border");
  name = name.replace("_border", "");
  if (!border) {
    name += "-fill";
  }

  const fullUrl = url + name + ".svg";
  const res = await fetchWithCache(fullUrl);
  if (res.status !== 200) {
    console.error(`Icon ${fullUrl} not found`);
    return;
  }
  const t = await res.text();

  const _svgEl = document.createElement("div");
  _svgEl.innerHTML = t;
  svgEl?.replaceChildren(_svgEl.firstChild?.firstChild!);
  svgEl?.setAttribute(
    "viewBox",
    _svgEl.firstElementChild?.getAttribute("viewBox")!
  );
};
export default function Icon(props: IconProps) {
  let svgEl: SVGSVGElement | undefined;

  createEffect(() => {
    fetchIcon(props.name, svgEl!);
  });

  return (
    <span
      class={classNames("icon", styles.icon, props.class)}
      style={{
        color: props.color,
        ...props.style,
      }}
      title={props.title}
      onClick={props.onClick}
    >
      <svg
        ref={svgEl}
        width={props.size || 24}
        height={props.size || 24}
        fill="currentColor"
      />
    </span>
  );
}
