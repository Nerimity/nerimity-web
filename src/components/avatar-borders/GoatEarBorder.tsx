import { JSXElement, Match, Show, Switch } from "solid-js";

export function GoatEarsBorder(props: {
  children?: JSXElement;
  hovered?: boolean;
  size: number;
  offset?: number;
  color: "white";
  scale?: number;
}) {
  return (
    <img
      class="goat-ears"
      style={{
        position: "absolute",
        transform: props.scale ? `scale(${props.scale}) ` : "",
        width: "100%",
        "margin-top": (props.offset || 0) * props.size + "px",
        "z-index": "1111",
      }}
      src={`/borders/goat-ears-${props.color}.png`}
    />
  );
}
