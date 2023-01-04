export default function Spinner(props: {size?: number}) {
  props.size = 80;
  return <img height={props.size + "px"} width={props.size + "px"} src="/public/assets/spinner.svg"></img>
}
