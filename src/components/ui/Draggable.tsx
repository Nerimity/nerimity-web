import { JSX, createEffect, createSignal, For, onMount } from "solid-js";
import {dndzone} from "solid-dnd-directive";

interface Props<T> { 
  class?: string
  items: T[]
  children: (item: T) => JSX.Element
  ref?: any
  onDrop?: (items: T[], revert:() =>  void) => void;
}

typeof dndzone;
export function Draggable<T>(props: Props<T>) {
  const [items, setItems] = createSignal<T[]>(props.items);

  createEffect(() => {
    setItems(props.items);
  })

  const handleDndEvent = (e, type: 'consider' | 'finalize') => {
    const {items: newItems} = e.detail;
    setItems(newItems);
    if (type === 'finalize') {
      props.onDrop(newItems, revert);
    }
  }

  const revert = () =>  {
    setItems(props.items);
  }

  props.ref?.({revert});

  return (
    <div class={props.class} use:dndzone={{items}} on:consider={(e) => handleDndEvent(e, 'consider')} on:finalize={(e) => handleDndEvent(e, 'finalize')}>
      <For each={items()}>
        {item => props.children(item)}
      </For>
    </div>
  )
}