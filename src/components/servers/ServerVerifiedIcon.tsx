import { css } from "solid-styled-components";
import Icon from "../ui/icon/Icon";

import { classNames } from "@/common/classNames";
import { t } from "@nerimity/i18lite";

export function ServerVerifiedIcon(props: { class?: string }) {
  return (
    <Icon
      class={classNames(
        css`
          user-select: none;
        `,
        props.class
      )}
      title={t("channelDrawer.verified")}
      name="verified"
      color="var(--primary-color)"
      size={16}
    />
  );
}
