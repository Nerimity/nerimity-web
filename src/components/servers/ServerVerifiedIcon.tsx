import { css } from "solid-styled-components";
import Icon from "../ui/icon/Icon";

export function ServerVerifiedIcon () {
  return (
    <Icon 
      class={css`user-select: none;`}
      title='This server is verified.'
      name='verified'
      color='var(--primary-color)' size={16}
    />
  )
}