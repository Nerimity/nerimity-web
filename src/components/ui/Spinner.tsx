import { JSX } from "solid-js";

export default function Spinner(props: { style?: JSX.CSSProperties, size?: number}) {
  props.size = 80;
  return <img style={props.style} height={props.size + "px"} width={props.size + "px"} src="/assets/spinner.svg"></img>
}
