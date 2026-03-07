import { children, createEffect, JSXElement } from "solid-js";
import env from "./env";

export const MetaTitle = (props: { children: JSXElement }) => {
  const el = children(() => props.children);
  const text = () => el.toArray().join(" ");
  const full = () => `${text() || ""} - Nerimity ${env.DEV_MODE ? "DEV" : ""}`;

  createEffect(() => {
    document.title = full();
  });
  return <></>;
};
