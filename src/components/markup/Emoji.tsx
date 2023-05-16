import { classNames } from "@/common/classNames"
import { useWindowProperties } from "@/common/useWindowProperties"

export function Emoji(props: { class?: string, name: string, url: string, animated?: boolean}) {
  const {hasFocus} = useWindowProperties();
  return (
    <img loading="lazy" class={classNames(props.class, "emoji")} src={props.url + (props.animated && !hasFocus() ? '?type=webp' : '')} alt={props.name} title={props.name} />
  )
}