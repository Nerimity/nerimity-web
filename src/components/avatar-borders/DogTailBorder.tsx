import { JSXElement } from "solid-js";

export function DogTailBorder(props: {
  children?: JSXElement;
  hovered?: boolean;
  size?: number;
  offset?: number;
  offsetLeft?: number;
  color: "shiba";
}) {
  return (
    <img
      class="dog-tail"
      style={{
        position: "absolute",
        width: "100%",
        "margin-left": (props.offsetLeft || 0) * props.size + "px",
        "margin-top": (props.offset || 0) * props.size + "px",
        "z-index": "1",
      }}
      src={`/borders/dog-tail-${props.color}.png`}
    />
  );
}
