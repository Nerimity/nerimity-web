import { JSX } from "solid-js";

interface TextProps {
  color?: string;
  opacity?: number;
  size?: number;
  bold?: boolean;
  children: JSX.Element;
  class?: string;
}

const Text = (props: TextProps & JSX.HTMLAttributes<HTMLSpanElement>) => {
  
  const style = () => ({
    ...props.style as JSX.CSSProperties,
    color: props.color || "white",
    "font-size": `${props.size || "16"}px`,
    opacity: props.opacity || "1",
    ...(props.bold ? { "font-weight": "bold" } : {}),
  } as JSX.CSSProperties)
  return (
    <span style={style()} class={props.class}>
      {props.children}
    </span>
  );
}




export default Text;