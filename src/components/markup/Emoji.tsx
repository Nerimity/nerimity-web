export function Emoji(props: {name: string, url: string}) {
  return (
    <img loading="lazy" class="emoji" src={props.url} alt={props.name} title={props.name} />
  )
}