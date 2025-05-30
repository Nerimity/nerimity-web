import style from "./NestedDraggable.module.css";
import {
  Accessor,
  createContext,
  createSignal,
  For,
  JSXElement,
  Setter,
  useContext,
  Show,
  createMemo,
} from "solid-js";

interface NestedDraggableContext {
  parentContext: NestedDraggableContext | null;
  draggingItemIndex: Accessor<number | null>;
}

const DraggableContext = createContext<NestedDraggableContext>({
  parentContext: null as null,
  draggingItemIndex: () => null,
});

interface NestedDraggableProps<T> {
  items: T[];
  setItems: (items: T[]) => void;
  children: (item: T) => JSXElement;
  hoverItem?: (item: T) => JSXElement | void;
  onDroppedOnItem?: (item: T, droppedOnItem: T) => void | boolean;
}

export function NestedDraggable<T>(props: NestedDraggableProps<T>) {
  let ghostEl: HTMLDivElement | null = null;
  const parentContext = useContext(DraggableContext);

  const [draggingItemIndex, setDraggingItemIndex] = createSignal<number | null>(
    null
  );

  const [dropZoneIndex, setDropZoneIndex] = createSignal<number | null>(null);

  const [isItemHovered, setIsItemHovered] = createSignal(false);

  const hoveredItem = createMemo(() => {
    if (!isItemHovered()) return;
    if (dropZoneIndex() === null) return;
    const Element = props.hoverItem?.(props.items[dropZoneIndex()!]!);
    if (!Element) return;
    return Element;
  });

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'; 
    }
  }

  const handleDragMove = (event: DragEvent) => {

    const itemEl = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest("." + style.item) as HTMLDivElement;

    const dropZoneEl = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest("." + style.dropZone) as HTMLDivElement;

    if (dropZoneEl) {
      const index = dropZoneEl.dataset.dropIndex;
      if (index !== undefined) {
        setIsItemHovered(false);
        setDropZoneIndex(parseInt(index));
      }
    }

    if (itemEl) {
      const rect = itemEl.getBoundingClientRect();

      const itemTriggerHeight = rect.height / 4;

      const top = rect.top;
      const bottom = rect.bottom;

      const isTopTriggered = event.clientY >= top + itemTriggerHeight;
      const isBottomTriggered = event.clientY <= bottom - itemTriggerHeight;

      const isItemHovered = isTopTriggered && isBottomTriggered;

      const itemIndex = itemEl.dataset.index;
      if (itemIndex !== undefined) {
        if (itemIndex === draggingItemIndex()?.toString()) return;
        setIsItemHovered(isItemHovered);
        setDropZoneIndex(
          isItemHovered
            ? parseInt(itemIndex)
            : parseInt(itemIndex) + (isTopTriggered ? 1 : 0)
        );
      }
    }
  };

  const handleDragStart = (event: DragEvent) => {
    document.addEventListener("dragend", handleDocDragEnd, { once: true });
    const target = event.currentTarget as HTMLDivElement;
    const itemIndex = parseInt(target.dataset.index!);
    setDraggingItemIndex(itemIndex);


    const rect = target.getBoundingClientRect();



    ghostEl = target.cloneNode(true) as HTMLDivElement;
    ghostEl.classList.add('dragging');
    ghostEl.style.width = rect.width + "px";    
    

    document.body.appendChild(ghostEl);

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
  
      event.dataTransfer?.setDragImage(
        ghostEl,
        event.clientX - rect.left,
        event.clientY - rect.top
      );
    }
  };

  const handleDocDragEnd = () => {
    ghostEl?.remove();
    const newItems = [...props.items];
    const draggingItemIndexValue = draggingItemIndex();
    const dropZoneIndexValue = dropZoneIndex();
    const isItemHoveredValue = isItemHovered();

    setDraggingItemIndex(null);
    setDropZoneIndex(null);
    setIsItemHovered(false);

    if (draggingItemIndexValue === null || dropZoneIndexValue === null) {
      return;
    }

    if (draggingItemIndexValue === dropZoneIndexValue) {
      return;
    }

    if (!isItemHoveredValue) {
      if (draggingItemIndexValue - dropZoneIndexValue < 0) {
        const [draggingItem] = newItems.splice(draggingItemIndexValue, 1);
        newItems.splice(dropZoneIndexValue - 1, 0, draggingItem!);
      } else {
        const [draggingItem] = newItems.splice(draggingItemIndexValue, 1);
        newItems.splice(dropZoneIndexValue, 0, draggingItem!);
      }
      props.setItems(newItems);
    }

    if (isItemHoveredValue) {
      props.onDroppedOnItem?.(
        props.items[draggingItemIndexValue]!,
        props.items[dropZoneIndexValue]!
      );
    }
  };

  return (
    <DraggableContext.Provider
      value={{
        parentContext: parentContext,
        draggingItemIndex: draggingItemIndex,
      }}
    >
      <div class={style.container}>
        <For each={props.items}>
          {(item, i) => (
            <>
              <div
                data-drop-index={i()}
                class={style.dropZone}
                ondragover={handleDragOver}

                classList={{
                  [style.show!]:
                    dropZoneIndex() === i() &&
                    draggingItemIndex() !== i() &&
                    draggingItemIndex()! + 1 !== i() &&
                    !isItemHovered(),
                }}
              />

              <div
                class={style.item}
                classList={{
                  [style.dragging!]: draggingItemIndex() === i(),
                }}
                data-index={i()}
                draggable="true"
                onDragStart={handleDragStart}
                onDrag={handleDragMove}
                ondragover={handleDragOver}
              >
                <Show
                  when={
                    hoveredItem() && dropZoneIndex() === i() && isItemHovered()
                  }
                >
                  {hoveredItem()}
                </Show>
                <div
                ondragover={handleDragOver}

                  style={{
                    display:
                      hoveredItem() &&
                      dropZoneIndex() === i() &&
                      isItemHovered()
                        ? "none"
                        : "block",
                  }}
                >
                  {props.children(item)}
                </div>
              </div>
            </>
          )}
        </For>
      </div>
    </DraggableContext.Provider>
  );
}
