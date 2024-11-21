import { JSXElement, Match, Show, Switch } from "solid-js";

export function CatEarsBorder(props: {
  children?: JSXElement;
  hovered?: boolean;
  size: number;
}) {
  return (
    <img
      class="cat-ears"
      style={{
        position: "absolute",
        width: "100%",
        "margin-bottom": props.size / 1 + "px",
      }}
      src="/borders/cat-ears.png"
    />
  );
}
