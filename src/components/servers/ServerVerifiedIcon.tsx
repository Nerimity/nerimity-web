import { css } from "solid-styled-components";
import Icon from "../ui/icon/Icon";
import { className } from "solid-js/web";
import { classNames } from "@/common/classNames";

export function ServerVerifiedIcon (props: {class?: string}) {
  return (
    <Icon 
      class={classNames(css`user-select: none;`, props.class)}
      title='This server is verified.'
      name='verified'
      color='var(--primary-color)' size={16}
    />
  )
}