import { Trans, TransProps } from "@nerimity/solid-i18lite";
import { ParentComponent } from "solid-js";

/**
 *
 * @deprecated use Trans directly instead.
 */
export const UnescapedTrans: ParentComponent<TransProps> = (
  props: TransProps & { style?: string }
) => (
  <span style={props.style} class="unescaped-trans">
    <Trans {...props} />
  </span>
);
