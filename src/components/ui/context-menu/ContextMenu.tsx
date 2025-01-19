import styles from "./styles.module.scss";
import {
  createEffect,
  createSignal,
  For,
  JSXElement,
  Match,
  on,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { classNames, conditionalClass } from "@/common/classNames";
import Icon from "@/components/ui/icon/Icon";
import { Portal } from "solid-js/web";
import { useWindowProperties } from "@/common/useWindowProperties";
import { useResizeObserver } from "@/common/useResizeObserver";
import { createStore, reconcile } from "solid-js/store";

export interface ContextMenuItem {
  id?: any;
  label?: string;
  icon?: string;
  onClick?: () => void;
  separator?: boolean;
  title?: string;
  alert?: boolean;
  disabled?: boolean;
  show?: boolean;
  prefix?: JSXElement;
  sub?: ContextMenuItem[];
  closeOnClick?: boolean;
}

export interface ContextMenuProps {
  items: ContextMenuItem[];
  onClose?: () => void;
  triggerClassName?: string;
  onClick?(item: ContextMenuItem): void;
  position?: {
    x: number;
    y: number;
  } | null;
  header?: JSXElement;
  clickEvent?: MouseEvent;
}

export default function ContextMenu(props: ContextMenuProps) {
  const [contextMenuEl, setContextMenuEl] = createSignal<HTMLDivElement | null>(
    null
  );
  const [pos, setPos] = createSignal({ top: "0", left: "0" });
  const { isMobileWidth, hasFocus } = useWindowProperties();

  const [items, setItems] = createStore<ContextMenuItem[]>([]);

  const { height, width } = useResizeObserver(contextMenuEl);

  const itemsWithExtra = () => {
    if (!props.clickEvent) return props.items;
    const tempItems = [...props.items];
    const target = props.clickEvent.target as HTMLElement;
    const imageSrc = target.getAttribute("data-contextmenu-src");
    const url = target.getAttribute("href");
    if (url || imageSrc) {
      if (!tempItems[0]?.separator) tempItems.unshift({ separator: true });
      tempItems.unshift({
        label: "Copy Link",
        icon: "content_copy",
        onClick: () => {
          navigator.clipboard.writeText(imageSrc || url || "");
        },
      });
    }

    return tempItems;
  };

  createEffect(() => {
    if (props.position) {
      setItems(reconcile(itemsWithExtra()));
    } else {
      setItems([]);
    }
  });

  const handleOutsideClick = (e: any) => {
    if (props.triggerClassName) {
      if (e.target.closest("." + props.triggerClassName)) {
        return;
      }
    }
    if (e.target.closest("." + styles.contextMenu)) {
      return;
    }
    props.onClose?.();
  };

  const handleOutsideRightClick = (e: any) => {
    if (e.target.closest("." + styles.contextMenu)) {
      e.preventDefault();
      return;
    }
    props.onClose?.();
  };

  const [hoveredItemIndex, setHoveredItemIndex] = createSignal<number | null>(
    null
  );

  const onMouseEnter = (item: ContextMenuItem, index: number) => {
    setHoveredItemIndex(index);
  };
  const onMouseLeave = (item: ContextMenuItem, index: number) => {
    // setHoveredItemIndex(null);
  };

  createEffect(
    on(
      () => props.position,
      () => {
        if (!props.position) {
          setHoveredItemIndex(null);

          return;
        }
        window.addEventListener("contextmenu", handleOutsideRightClick, {
          capture: true,
        });
        window.addEventListener("click", handleOutsideClick);

        onCleanup(() => {
          window.removeEventListener("contextmenu", handleOutsideRightClick, {
            capture: true,
          });
          window.removeEventListener("click", handleOutsideClick);
        });
      }
    )
  );

  createEffect(() => {
    if (!hasFocus()) props.onClose?.();
  });

  const left = () => {
    if (!props.position) return;
    if (!contextMenuEl()) return;
    // move the context menu to the left if it's off the screen.
    if (props.position.x + width() > window.innerWidth) {
      return props.position.x - width() + "px";
    }

    return props.position.x + "px";
  };

  const top = () => {
    if (!props.position) return;
    if (!contextMenuEl()) return;

    let y = props.position.y;
    // move the context menu to the top if it's off the screen.
    if (props.position.y + height() > window.innerHeight) {
      y = props.position.y - height();
    }

    // move the context menu to the bottom if it's off the screen.
    if (props.position.y + height() > window.innerHeight) {
      y = props.position.y - height();
    }

    return y + "px";
  };

  createEffect(
    on([() => props.position, height, width], () => {
      setPos({ left: left() || "0", top: top() || "0" });
    })
  );

  const onItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;
    props.onClick?.(item);
    setTimeout(() => item.closeOnClick !== false && props.onClose?.(), 10);
  };

  return (
    <Show when={props.position}>
      <Portal>
        <Show when={isMobileWidth()}>
          <div class={styles.darkBackground} />
        </Show>
        <div
          ref={setContextMenuEl}
          class={classNames(
            styles.contextMenu,
            conditionalClass(isMobileWidth(), styles.mobile)
          )}
          style={isMobileWidth() ? {} : pos()}
        >
          <div class={styles.contextMenuInner}>
            {props.header}
            <For each={items}>
              {(item, i) => (
                <Show when={item.show !== false}>
                  <Switch
                    fallback={
                      <Item
                        close={props.onClose}
                        hovered={i() === hoveredItemIndex()}
                        onEnter={() => onMouseEnter(item, i())}
                        onLeave={() => onMouseLeave(item, i())}
                        onClick={() => onItemClick(item)}
                        item={item}
                      />
                    }
                  >
                    <Match when={item.separator}>
                      <div class={styles.separator} />
                    </Match>
                    <Match when={item.title}>
                      <div class={styles.title}>{item.title}</div>
                    </Match>
                  </Switch>
                </Show>
              )}
            </For>
          </div>
        </div>
      </Portal>
    </Show>
  );
}

function Item(props: {
  close?: () => void;
  item: ContextMenuItem;
  onClick?(): void;
  onEnter?(): void;
  onLeave?(): void;
  hovered?: boolean;
}) {
  let itemElement: HTMLDivElement | undefined;
  const { width } = useResizeObserver(() => itemElement);
  const onClick = () => {
    if (props.item.disabled) return;
    props.onClick?.();
    props.item.onClick?.();
  };

  const getSubContextMenuPos = () => {
    if (!width()) return;
    if (!itemElement) return;
    const rect = itemElement.getBoundingClientRect();
    return {
      x: rect.x + rect.width + 10,
      y: rect.y,
    };
  };

  return (
    <>
      <div
        ref={itemElement}
        onMouseEnter={props.onEnter}
        onMouseLeave={props.onLeave}
        class={classNames(
          styles.item,
          conditionalClass(props.item.alert, styles.alert),
          conditionalClass(props.item.disabled, styles.disabled)
        )}
        onClick={onClick}
      >
        <Show when={props.item.prefix}>{props.item.prefix}</Show>
        <Show when={props.item.icon}>
          <Icon
            name={props.item.icon}
            size={18}
            color={
              props.item.alert ? "var(--alert-color)" : "var(--primary-color)"
            }
          />
        </Show>
        <span class={styles.label}>{props.item.label}</span>
        <Show when={props.item.sub}>
          <Icon class={styles.arrow} name="keyboard_arrow_right" size={16} />
        </Show>
      </div>
      <Show when={props.item.sub && props.hovered}>
        <ContextMenu
          onClose={() => props.close?.()}
          items={props.item.sub!}
          position={getSubContextMenuPos()}
        />
      </Show>
    </>
  );
}
