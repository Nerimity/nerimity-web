import { Title } from "@solidjs/meta";
import { children, JSXElement } from "solid-js";
import env from "./env";

export const MetaTitle = (props: { children: JSXElement }) => {
  const el = children(() => props.children);
  const text = () => el.toArray().join(" ");
  const full = () => `${text() || ""} - Nerimity ${env.DEV_MODE ? "DEV" : ""}`;

  return <Title>{full()}</Title>;
};
