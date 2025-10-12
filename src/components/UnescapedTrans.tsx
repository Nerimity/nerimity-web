import { Trans, TransProps } from "@nerimity/solid-i18lite";
import { createEffect, ParentComponent } from "solid-js";

const getUnescapeChildrenRef = (ref: HTMLSpanElement) => {
  createEffect(() => {
    Array.from(ref.childNodes).forEach((node) => {
      const nodeEl = node as HTMLDivElement;
      if (!nodeEl.innerText) {
        return node;
      }
      nodeEl.innerHTML = nodeEl?.textContent || "";
    });
  });
};

export const UnescapedTrans: ParentComponent<TransProps> = (
  props: TransProps & { style?: string }
) => (
  <span
    ref={getUnescapeChildrenRef}
    style={props.style}
    class="unescaped-trans"
  >
    <Trans
      {...props}
      options={{ interpolation: { escapeValue: true }, ...props.options }}
    />
  </span>
);
