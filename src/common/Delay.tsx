import { JSXElement, Show, createSignal, onCleanup } from "solid-js";

export function Delay(props: {ms?: number, children: JSXElement}) {
  const [show, setShow] = createSignal(false);
  const interval = setTimeout(() => {
    setShow(true);
  }, props.ms || 100)

  onCleanup(() => {
    clearInterval(interval)
  })

  return (
    <Show when={show()}>{props.children}</Show>
  )
}