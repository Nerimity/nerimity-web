import {
  createEffect,
  createRenderEffect,
  createSignal,
  For,
  JSXElement,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { classNames, cn, conditionalClass } from "@/common/classNames";
import Icon from "@/components/ui/icon/Icon";
import styles from "./styles.module.scss";
import { Portal } from "solid-js/web";
import { useResizeObserver } from "@/common/useResizeObserver";
import { useWindowProperties } from "@/common/useWindowProperties";
import { t } from "@nerimity/i18lite";

export interface DropDownItem {
  id: string;
  label?: JSXElement;
  description?: string;
  icon?: string;
  onClick?: (item: DropDownItem) => void;
  data?: any;
  separator?: boolean;
  circleColor?: string;
  suffix?: string | JSXElement;
}

export interface DropDownProps {
  items: DropDownItem[];
  selectedId?: string;
  title?: string;
  onChange?: (item: DropDownItem) => void;
  class?: string;
  placeholder?: string;
  onClick?: (event: MouseEvent) => void;
}

export default function DropDown(props: DropDownProps) {
  const [selectedId, setSelectedId] = createSignal<string | null>(
    props.selectedId || null
  );
  const [popupLocation, setPopupLocation] = createSignal<null | {
    top: number;
    left: number;
    minWidth: number;
  }>(null);
  let element: undefined | HTMLDivElement;

  const selectedItem = () =>
    props.items.find((item) => item.id === selectedId());

  const onItemClick = (item: DropDownItem) => {
    if (item.id === selectedId()) return;
    setSelectedId(item.id);
    props.onChange?.(item);
    item.onClick?.(item);
  };

  createEffect(
    on(
      () => props.selectedId,
      () => {
        setSelectedId(props.selectedId || null);
      }
    )
  );

  const togglePopup = () => {
    if (popupLocation()) {
      return setPopupLocation(null);
    }
    if (!element) return;
    const rect = element.getBoundingClientRect();
    setPopupLocation({ top: rect.top, left: rect.left, minWidth: rect.width });
  };

  return (
    <div
      class={classNames(styles.dropDown, props.class)}
      onClick={props.onClick}
    >
      <Show when={props.title}>
        <div class={cn(styles.title, "title")}>{props.title}</div>
      </Show>
      <div class={cn(styles.box, "box")} ref={element} onClick={togglePopup}>
        <ItemTemplate item={selectedItem()} placeholder={props.placeholder} />
        <Icon name="keyboard_arrow_down" class={styles.expandIcon} />
      </div>
      <Show when={popupLocation()}>
        <Portal>
          <Popup
            selectedId={selectedId()}
            position={popupLocation()!}
            items={props.items}
            onClose={() => setPopupLocation(null)}
            onClick={onItemClick}
          />
        </Portal>
      </Show>
    </div>
  );
}

function ItemTemplate(props: { item?: DropDownItem; placeholder?: string }) {
  return (
    <div class={styles.itemTemplate}>
      <CircleColor color={props.item?.circleColor} />
      <div class={styles.details}>
        <div class={styles.label}>
          {props.item?.label || props.placeholder || t("dropDown.selectItem")}
          {props.item?.suffix}
        </div>
        <Show when={props.item?.description}>
          <div class={styles.description}>{props.item?.description}</div>
        </Show>
      </div>
    </div>
  );
}

function CircleColor(props: { color?: string }) {
  return (
    <Show when={props.color}>
      <div class={styles.circleColor} style={{ background: props.color }} />
    </Show>
  );
}

function Popup(props: {
  items: DropDownItem[];
  position: { top: number; left: number; minWidth: number };
  selectedId: string | null;
  onClose: () => void;
  onClick?: (item: DropDownItem) => void;
}) {
  let element: HTMLDivElement | undefined;
  const [selectedElement, setSelectedElement] = createSignal<
    HTMLDivElement | undefined
  >();
  const resizeObserver = useResizeObserver(() => element);
  const { width, height } = useWindowProperties();
  const [position, setPosition] = createSignal({
    top: "0px",
    left: "0px",
    "min-width": "0px",
  });

  const onDocumentClick = (event: any) => {
    if (event.target.closest("." + styles.popup)) return;
    props.onClose();
  };

  onMount(() => {
    document.addEventListener("click", onDocumentClick);

    onCleanup(() => {
      document.removeEventListener("click", onDocumentClick);
    });
  });

  const onItemClick = (item: DropDownItem) => {
    props.onClose();
    props.onClick?.(item);
  };

  createEffect(
    on(
      width,
      () => {
        props.onClose();
      },
      { defer: true }
    )
  );

  createEffect(() => {
    const elHeight = resizeObserver.height();
    const elWidth = resizeObserver.width();
    const winHeight = height();
    const winWidth = width();

    if (elHeight === 0) return;

    let top = props.position.top;
    let left = props.position.left;

    const selElement = selectedElement();
    if (selElement) {
      selElement.scrollIntoView({ behavior: "instant", block: "center" });
      top = top - selElement.offsetTop + element!.scrollTop;
    }

    if (left + elWidth > winWidth) {
      left = winWidth - elWidth - 10;
    }

    if (top + elHeight > winHeight) {
      top = winHeight - elHeight - 20;
    }

    if (top < 0) top = 10;

    setPosition({
      top: top + "px",
      left: left + "px",
      "min-width": props.position.minWidth + "px",
    });
  });

  return (
    <div
      class={cn(styles.popup, "dropdown-popup")}
      ref={element}
      style={position()}
    >
      <For each={props.items}>
        {(item) => (
          <div
            class={classNames(
              styles.item,
              conditionalClass(props.selectedId === item.id, styles.selected)
            )}
            onClick={() => onItemClick(item)}
            ref={(el) =>
              props.selectedId === item.id ? setSelectedElement(el) : undefined
            }
          >
            <ItemTemplate item={item} />
          </div>
        )}
      </For>
    </div>
  );
}
