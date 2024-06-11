import { Accessor, For, JSXElement, Show, createEffect, createSignal, createUniqueId, on, onCleanup, onMount } from "solid-js";
import styles from "./SimpleSortable.module.scss";
import { classNames, conditionalClass } from "@/common/classNames";

interface SimpleSortableProps<T> {
  items: T[];
  idField: keyof T;
  id?: string
  gap?: number
  handleClassName?: string
  ignoreClassName?: string

  group?: string

  dropClassName?: string

  children: (item: T, i: Accessor<number>) => JSXElement;
  hiddenItems?: (item: T, i: Accessor<number>) => boolean;
  onDrop?: (event: { currentIndex: number, newIndex: number }) => void;

  onAdd?: (event: { currentIndex: number, newIndex: number, id: string }) => void

  allowDragOnTop?: boolean
  onDragOnTop?: (draggedIndex: number, targetIndex: number) => void
}


const DragHolder = (props: {last?: boolean, gap: number, id: string}) => (
  <div 
    style={{
      opacity: 0,
      ...(props.last ? {} : {
        "margin-top": `-${5 + (props.gap / 2)}px`
      })

    }}  
    class={classNames(styles.dragHolderContainer, "simpleSortableDragHolder", "simpleSortableDragHolder" + props.id)}>
    <div class={classNames(styles.dragHolder)} />
  </div>
);


export function SimpleSortable<T>(props: SimpleSortableProps<T>) {

  const id = props.id || createUniqueId();

  let containerRef: undefined | HTMLDivElement;
  const [pointerPos, setPointerPos] = createSignal<null | { x: number; y: number }>(null);
  const [down, setDown] = createSignal(false);

  const [draggingElementIndex, setDraggingElementIndex] = createSignal(-1);

  const [draggedOnTopIndex, setDraggedOnTopIndex] = createSignal(-1);



  const changeVisibleHolder = (el?: HTMLDivElement, show?: boolean) => {
    const holderElements = document.querySelectorAll(".simpleSortableDragHolder") || [];

    for (let i = 0; i < holderElements.length; i++) {
      const el = holderElements[i]! as HTMLElement;
      el.style.opacity = "0";
    }
    if (el && show) {
      el.style.opacity = "1";
    }
  };

  const getContainerId = (containerEl?: Element) => containerEl?.id.split("simple-sortable-")[1];
  const findDragHolderIndex = (el: Element, containerEl?: Element) => {
    const holderElements = (containerEl || containerRef)?.getElementsByClassName("simpleSortableDragHolder" + (getContainerId(containerEl) || id));
    if (!holderElements) return -1;
    for (let i = 0; i < holderElements.length; i++) {
      if (holderElements[i] === el) return i;
    }
    return -1;
  };
  const findItemIndex = (el: Element) => {
    const elements = containerRef?.getElementsByClassName("simpleSortableItem" + id);
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
    if (event.target instanceof HTMLElement) {

      if (props.ignoreClassName) {
        if (event.target.closest("." + props.ignoreClassName)) return;
      }
      if (props.handleClassName) {
        if (!event.target.closest("." + props.handleClassName)) return;
      }

      if (event.currentTarget instanceof HTMLElement) {
        const parent = event.currentTarget.parentElement as HTMLDivElement;
        if (parent.id !== `simple-sortable-${id}`) return;
      }

    }
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

    const elements = document.elementsFromPoint(pointerPos()!.x, pointerPos()!.y);



    let dragHolderEl = elements.find(el => el.classList.contains("simpleSortableDragHolder"));
    
    
    
    if (dragHolderEl) {
      const containerEl = dragHolderEl?.closest("." + styles.container);
      if(containerEl !== containerRef) {
        if (!props.group) {
          dragHolderEl = undefined;
          return;
        }
        if (!containerEl?.classList.contains("simpleSortable-" + props.group)) {
          dragHolderEl = undefined;
          return;
        }
      }
    }

    if (dragHolderEl) {
      changeVisibleHolder(dragHolderEl as HTMLDivElement, true);
      setDraggedOnTopIndex(-1);
      return;
    }
    else {
      changeVisibleHolder();
    }





    if (props.allowDragOnTop && event.target instanceof HTMLElement) {
      const elements = document.elementsFromPoint(pointerPos()!.x, pointerPos()!.y);
      let itemEl = elements.find(el => el.classList.contains("simpleSortableItem" + id));

      

      if (itemEl) {

        if (props.dropClassName) {
          const dropClassEl = elements.find(el =>  el.classList.contains(props.dropClassName!));

          if (dropClassEl?.closest(".simpleSortableItem") !== itemEl) {
            itemEl = undefined;
          }

        }

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

    if (!down()) return;

    const elements = document.elementsFromPoint(event.clientX, event.clientY);

    let dragHolderEl = elements.find(el => el.classList.contains("simpleSortableDragHolder"));


    if (dragHolderEl) {
      const containerEl = dragHolderEl?.closest("." + styles.container);
      if(containerEl !== containerRef) {
        if (!props.group) {
          dragHolderEl = undefined;
          return;
        }
        if (!containerEl?.classList.contains("simpleSortable-" + props.group)) {
          dragHolderEl = undefined;
          return;
        }

        onAdd(findDragHolderIndex(dragHolderEl, containerEl), containerEl as HTMLDivElement);
        
      }
      else {
        onDrop(findDragHolderIndex(dragHolderEl));
      }
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
  const onAdd = (index: number, container: HTMLDivElement) => {
    props.onAdd?.({
      currentIndex: draggingElementIndex(),
      newIndex: index,
      id: container.id.split("simple-sortable-")[1]
    });
  };





  const lastIndex = () => props.items.length - 1;

  return (
    <div id={`simple-sortable-${id}`} ref={containerRef} style={{gap: (props.gap || 0) + "px"}} class={classNames(styles.container, conditionalClass(props.group, "simpleSortable-" + props.group))}>
      <For each={props.items}>
        {(item, i) => (
          <div style={lastIndex() !== i() && props.hiddenItems?.(item, i) ? {display: "none"} : {}} onPointerDown={(e) => onPointerDown(e, i())} class={styles.itemOuterContainer}>
            <Show when={ i() !== draggingElementIndex()}><DragHolder id={id} gap={props.gap || 0} /></Show>

            
            <div class={classNames("simpleSortableItem", "simpleSortableItem" + id)}  classList={{"simpleSortableDraggingItem": i() === draggingElementIndex(), simpleSortableDraggedOnTop: i() === draggedOnTopIndex()}}>{props.children(item, i)}</div>
            
            <Show when={!props.hiddenItems?.(item, i) && (i() === lastIndex() && i() !== draggingElementIndex())}><DragHolder id={id} gap={props.gap || 0}  last/></Show>
          </div>
        )}
      </For>
    </div>
  );
}

