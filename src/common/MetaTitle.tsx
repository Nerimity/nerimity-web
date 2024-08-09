import { Title } from "@solidjs/meta";
import { JSXElement } from "solid-js";

export const MetaTitle = (props: { children: JSXElement }) => {
  return <Title>{props.children} - Nerimity</Title>;
};
