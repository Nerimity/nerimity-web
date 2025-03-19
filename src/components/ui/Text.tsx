import { JSX } from "solid-js";
import { Dynamic } from "solid-js/web";
import { CustomLink } from "./CustomLink";

interface TextProps {
  color?: string;
  opacity?: number;
  size?: number;
  bold?: boolean;
  children: JSX.Element;
  class?: string;
  href?: string;
  newTab?: boolean;
  isDangerousLink?: boolean;
}

const Text = (props: TextProps & JSX.HTMLAttributes<HTMLSpanElement>) => {
  const style = () =>
    ({
      ...(props.style as JSX.CSSProperties),
      color: props.color || "var(--text-color)",
      "font-size": `${props.size || "16"}px`,
      opacity: props.opacity || "1",
      ...(props.bold ? { "font-weight": "bold" } : {}),
    } as JSX.CSSProperties);
  return (
    <Dynamic
      component={props.href ? CustomLink : "span"}
      isDangerous={props.isDangerousLink}
      onClick={props.onClick}
      title={props.title}
      {...(props.newTab
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      href={props.href}
      style={style()}
      class={props.class}
    >
      {props.children}
    </Dynamic>
  );
};

export default Text;
