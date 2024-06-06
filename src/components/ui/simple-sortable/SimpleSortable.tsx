import { Accessor, For, JSXElement, Show, createEffect, createSignal, on, onCleanup, onMount } from "solid-js";
import styles from "./SimpleSortable.module.scss";
import { classNames } from "@/common/classNames";
import { captureRejectionSymbol } from "events";

interface SimpleSortableProps<T> {
  items: T[];
  idField: keyof T;
  gap?: number
  children: (item: T, i: Accessor<number>) => JSXElement;
  onDrop?: (event: { currentIndex: number, newIndex: number }) => void;

  allowDragOnTop?: boolean
  onDragOnTop?: (draggedIndex: number, targetIndex: number) => void
}


const DragHolder = (props: {last?: boolean, gap: number}) => (
  <div 
    style={{
      opacity: 0,
      ...(props.last ? {} : {
        "margin-top": `-${5 + (props.gap / 2)}px`
      })

    }}  
    class={classNames(styles.dragHolderContainer, "simpleSortableDragHolder")}>
    <div class={classNames(styles.dragHolder)} />
  </div>
);


export function SimpleSortable<T>(props: SimpleSortableProps<T>) {
  let containerRef: undefined | HTMLDivElement;
  const [pointerPos, setPointerPos] = createSignal<null | { x: number; y: number }>(null);
  const [down, setDown] = createSignal(false);

  const [draggingElementIndex, setDraggingElementIndex] = createSignal(-1);

  const [draggedOnTopIndex, setDraggedOnTopIndex] = createSignal(-1);



  const changeVisibleHolder = (el?: HTMLDivElement, show?: boolean) => {
    const holderElements = containerRef?.getElementsByClassName("simpleSortableDragHolder") || [];

    for (let i = 0; i < holderElements.length; i++) {
      const el = holderElements[i]! as HTMLElement;
      el.style.opacity = "0";
    }
    if (el && show) {
      el.style.opacity = "1";
    }
  };
  const findDragHolderIndex = (el: Element) => {
    const holderElements = containerRef?.getElementsByClassName("simpleSortableDragHolder");
    if (!holderElements) return -1;
    for (let i = 0; i < holderElements.length; i++) {
      if (holderElements[i] === el) return i;
    }
    return -1;
  };
  const findItemIndex = (el: Element) => {
    const elements = containerRef?.getElementsByClassName("simpleSortableItem");
    if (!elements) return -1;
    for (let i = 0; i < elements.length; i++) {
      if (elements[i] === el) return i;
    }
    return -1;
  };

  

  onMount(() => {
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("dragend", onPointerUp);
    onCleanup(() => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("dragend", onPointerUp);
    });
  });


  const onPointerDown = (event: MouseEvent, i: number) => {
    setDown(true);
    setPointerPos({ x: event.clientX, y: event.clientY });
    setDraggingElementIndex(i);

  };

  createEffect(on(draggedOnTopIndex, () => {
    props.onDragOnTop?.(draggingElementIndex(), draggedOnTopIndex());
  }));

  const onPointerMove = (event: MouseEvent) => {
    if (!down()) return;
    if (!pointerPos()) return;
    setPointerPos({ x: event.clientX, y: event.clientY });



    const dragHolderEl = document.elementsFromPoint(pointerPos()!.x, pointerPos()!.y).find(el => el.classList.contains("simpleSortableDragHolder"));
    if (dragHolderEl) {
      changeVisibleHolder(dragHolderEl as HTMLDivElement, true);
      setDraggedOnTopIndex(-1);
      return;
    }
    else {
      changeVisibleHolder();
    }





    if (props.allowDragOnTop && event.target instanceof HTMLElement) {
      const itemEl = document.elementsFromPoint(pointerPos()!.x, pointerPos()!.y).find(el => el.classList.contains("simpleSortableItem"));
      if (itemEl) {
        const index = findItemIndex(itemEl as HTMLDivElement);
        if (index === draggingElementIndex()) {
          setDraggedOnTopIndex(-1);
        }
        else {
          setDraggedOnTopIndex(index);
        }

      }
      else {
        setDraggedOnTopIndex(-1);
      }
    }





  };

  const onPointerUp = (event: MouseEvent) => {

    const dragHolderEl = document.elementsFromPoint(event.clientX, event.clientY).find(el => el.classList.contains("simpleSortableDragHolder"));

    if (dragHolderEl) {
      onDrop(findDragHolderIndex(dragHolderEl));
    }

    if (draggedOnTopIndex() !== -1) {
      onDrop(draggedOnTopIndex());
    }


    setDown(false);
    setPointerPos(null);
    changeVisibleHolder();
    setDraggingElementIndex(-1);
    setDraggedOnTopIndex(-1);
    
  };

  const onDrop = (index: number) => {
    props.onDrop?.({
      currentIndex: draggingElementIndex(),
      newIndex: index 
    });
  };





  const lastIndex = () => props.items.length - 1;

  return (
    <div ref={containerRef} style={{gap: (props.gap || 0) + "px"}} class={styles.container}>
      <For each={props.items}>
        {(item, i) => (
          <div onPointerDown={(e) => onPointerDown(e, i())} class={styles.itemOuterContainer}>
            <Show when={i() !== draggingElementIndex()}><DragHolder gap={props.gap || 0} /></Show>

            
            <div class="simpleSortableItem"  classList={{"simpleSortableDraggingItem": i() === draggingElementIndex(), simpleSortableDraggedOnTop: i() === draggedOnTopIndex()}}>{props.children(item, i)}</div>
            
            <Show when={i() === lastIndex() && i() !== draggingElementIndex()}><DragHolder gap={props.gap || 0}  last/></Show>
          </div>
        )}
      </For>
    </div>
  );
}

