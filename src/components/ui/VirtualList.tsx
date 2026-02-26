import {
  createEffect,
  createMemo,
  onCleanup,
  For,
  createSignal,
  untrack
} from "solid-js";
import { JSX } from "solid-js/jsx-runtime";

interface Item {
  height: number;
  element: (style: JSX.CSSProperties) => JSX.Element;
}

interface VirtualListProps {
  scrollContainer: HTMLElement;
  items: Item[];
  overscan?: number;
}

export const VirtualList = (props: VirtualListProps) => {
  let listRef: HTMLDivElement | undefined;
  const overscan = props.overscan ?? 5;

  const [range, setRange] = createSignal({ start: 0, end: overscan * 2 });

  const totalSize = createMemo(() =>
    props.items.reduce((acc, item) => acc + (item?.height ?? 0), 0)
  );

  const offsets = createMemo(() => {
    let current = 0;
    const items = props.items;
    const len = items.length;
    const result = new Float64Array(len);
    for (let i = 0; i < len; i++) {
      result[i] = current;
      current += items[i]?.height ?? 0;
    }
    return result;
  });

  const updateRange = () => {
    const container = props.scrollContainer;
    const list = listRef;

    if (!container || !list) return;

    const containerRect = container.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();

    const isOutOfView =
      listRect.bottom < containerRect.top ||
      listRect.top > containerRect.bottom;

    if (isOutOfView) {
      if (untrack(range).start !== -1) {
        setRange({ start: -1, end: -1 });
      }
      return;
    }

    const listStartOffset =
      listRect.top - containerRect.top + container.scrollTop;

    const relativeScrollTop = Math.max(
      0,
      container.scrollTop - listStartOffset
    );
    const viewportHeight = container.clientHeight;
    const relativeScrollBottom = relativeScrollTop + viewportHeight;

    const _offsets = offsets();
    const items = props.items;
    const itemCount = items.length;

    if (itemCount === 0) {
      setRange({ start: 0, end: 0 });
      return;
    }

    let low = 0;
    let high = itemCount - 1;
    let startIdx = 0;

    while (low <= high) {
      const mid = (low + high) >>> 1;
      const item = items[mid];
      if (!item) break;

      const itemTop = _offsets[mid]!;
      const itemHeight = item.height;

      if (itemTop + itemHeight <= relativeScrollTop) {
        low = mid + 1;
      } else {
        startIdx = mid;
        high = mid - 1;
      }
    }

    let endIdx = startIdx;
    for (let i = startIdx; i < itemCount; i++) {
      endIdx = i;
      if ((_offsets[i] ?? 0) > relativeScrollBottom) break;
    }

    const newStart = Math.max(0, startIdx - overscan);
    const newEnd = Math.min(itemCount - 1, endIdx + overscan);

    const currentRange = untrack(range);
    if (newStart !== currentRange.start || newEnd !== currentRange.end) {
      setRange({ start: newStart, end: newEnd });
    }
  };

  createEffect(() => {
    const container = props.scrollContainer;
    if (!container) return;

    const handleUpdate = () => updateRange();

    container.addEventListener("scroll", handleUpdate, { passive: true });
    const resizeObserver = new ResizeObserver(handleUpdate);

    resizeObserver.observe(container);
    if (listRef) resizeObserver.observe(listRef);

    updateRange();

    onCleanup(() => {
      container.removeEventListener("scroll", handleUpdate);
      resizeObserver.disconnect();
    });
  });

  createEffect(() => {
    offsets();
    updateRange();
  });

  const visibleIndices = createMemo(() => {
    const { start, end } = range();
    if (start === -1) return [];

    const result: number[] = [];
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    return result;
  });

  return (
    <div
      ref={listRef}
      style={{
        height: `${totalSize()}px`,
        position: "relative",
        width: "100%",
        contain: "layout size"
      }}
    >
      <For each={visibleIndices()}>
        {(index) => {
          const item = () => props.items[index];
          const offset = () => offsets()[index];

          return (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                transform: `translate3d(0, ${offset() ?? 0}px, 0)`,
                width: "100%",
                height: `${item()?.height ?? 0}px`,
                "will-change": "transform"
              }}
            >
              {item()?.element({})}
            </div>
          );
        }}
      </For>
    </div>
  );
};
