import { JSXElement } from "solid-js";

export function DogEarsBorder(props: {
  children?: JSXElement;
  hovered?: boolean;
  size: number;
  scale?: number;
  offset?: number;
  color: "brown" | "shiba";
}) {
  return (
    <img
      class="dog-ears"
      style={{
        transform: props.scale ? `scale(${props.scale}) ` : "",
        position: "absolute",
        width: "100%",
        "margin-top": (props.offset || 0) * props.size + "px",
        "z-index": "1111",
      }}
      src={`/borders/dog-ears-${props.color}.png`}
    />
  );
}
