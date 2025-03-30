import { css } from "solid-styled-components";
import Icon from "../ui/icon/Icon";
import { className } from "solid-js/web";
import { classNames } from "@/common/classNames";
import { t } from "i18next";

export function ServerVerifiedIcon (props: {class?: string}) {
  return (
    <Icon 
      class={classNames(css`user-select: none;`, props.class)}
      title={t("servers.isVerified")}
      name='verified'
      color='var(--primary-color)' size={16}
    />
  );
}