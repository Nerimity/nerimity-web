import { JSXElement, Match, Show, Switch } from "solid-js";

export function DeerEarsBorder(props: {
  children?: JSXElement;
  hovered?: boolean;
  size: number;
  offset?: number;
  color: "horns";
  scale?: number;
}) {
  return (
    <img
      class="goat-ears"
      style={{
        "pointer-events": "none",
        position: "absolute",
        transform: props.scale ? `scale(${props.scale}) ` : "",
        width: "100%",
        "margin-top": (props.offset || 0) * props.size + "px",
        "z-index": "1111",
      }}
      src={`/borders/deer-ears-${props.color}.png`}
    />
  );
}
