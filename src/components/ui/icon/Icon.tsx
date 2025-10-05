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

const fetchIcon = async (name = "texture", svgEl: SVGSVGElement) => {
  const border = name.endsWith("_border");
  name = name.replace("_border", "");
  if (!border) {
    name += "-fill";
  }
  const t = await fetch(url + name + ".svg", { cache: "force-cache" }).then((r) =>
    r.text()
  );
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
        width={props.size || 16}
        height={props.size || 16}
        fill="currentColor"
      />
    </span>
  );
}
