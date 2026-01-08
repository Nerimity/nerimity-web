import { JSXElement } from "solid-js";

export function BunnyEarsBorder(props: {
  children?: JSXElement;
  hovered?: boolean;
  size: number;
  offset?: number;
  color: "black" | "maid";
}) {
  return (
    <img
      class="bunny-ears"
      style={{
        position: "absolute",
        width: "100%",
        "margin-top": (props.offset || 0) * props.size + "px",
        "z-index": "1111",
      }}
      src={`/borders/bunny-ears-${props.color}.png`}
    />
  );
}
