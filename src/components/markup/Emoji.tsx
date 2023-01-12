import { classNames } from "@/common/classNames"

export function Emoji(props: { class?: string, name: string, url: string}) {
  return (
    <img loading="lazy" class={classNames(props.class, "emoji")} src={props.url} alt={props.name} title={props.name} />
  )
}