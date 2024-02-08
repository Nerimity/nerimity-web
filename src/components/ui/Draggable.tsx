import { JSX, createEffect, createSignal, For, onMount } from "solid-js";
import Sortable from "solid-sortablejs";

interface Props<T> { 
  class?: string
  items: T[]
  children: (item: T) => JSX.Element
  ref?: any
  onDrop?: (items: T[], revert:() =>  void) => void;
  onStart?: () => void;
}


export function Draggable<T>(props: Props<T>) {
  const [items, setItems] = createSignal<T[]>(props.items);

  createEffect(() => {
    setItems(props.items);
  });

  const onEnd = () => {
    props.onDrop?.(items(), revert);
  };

  const revert = () =>  {
    setItems(props.items);
  };

  props.ref?.({revert});

  return (
    <Sortable onStart={props.onStart} class={props.class} delay={200} delayOnTouchOnly idField="id" items={items()} onEnd={onEnd} setItems={setItems}>
      {item => props.children(item)}
    </Sortable>
  );
}