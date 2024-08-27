import { Title } from "@solidjs/meta";
import { JSXElement } from "solid-js";
import env from "./env";

export const MetaTitle = (props: { children: JSXElement }) => {
  return (
    <Title>
      {props.children} - Nerimity {env.DEV_MODE ? "DEV" : ""}
    </Title>
  );
};
