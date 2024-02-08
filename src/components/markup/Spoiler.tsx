import { classNames, conditionalClass } from "@/common/classNames";
import { createSignal } from "solid-js";
import { JSXElement } from "solid-js";

export default function Spoiler(props: {children: JSXElement}) {
  const [isSpoiled, setSpoiled] = createSignal(false);

  return (
    <span class={classNames("spoiler", conditionalClass(isSpoiled(), "spoiled"))} onClick={() => setSpoiled(true)}>
      {props.children}
    </span>
  );
}