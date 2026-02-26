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
import { t } from "@nerimity/i18lite";
import { Delay } from "@/common/Delay";

export interface ContextMenuItem {
  id?: any;
  label?: string;
  icon?: string;
  onClick?: (e: MouseEvent) => void;
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
        label: t("general.copyLink"),
        icon: "content_copy",
        onClick: () => {
          navigator.clipboard.writeText(imageSrc || url || "");
        },
      });
    }

    const filterDuplicateSeparators = tempItems.filter((item, index, array) => {
      // 1. If it's not a separator, always keep it
      if (!item.separator) {
        return true;
      }

      // 2. Remove if it's the first item
      if (index === 0) {
        return false;
      }

      // 3. Remove if it's the last item
      if (index === array.length - 1) {
        return false;
      }

      // 4. Remove if the previous item was also a separator
      const previousItem = array[index - 1];
      if (previousItem && previousItem.separator) {
        return false;
      }

      return true;
    });

    return filterDuplicateSeparators;
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
    let x = props.position.x;
    // move the context menu to the left if it's off the screen.
    if (x + width() > window.innerWidth) {
      x = Math.max(x - width(), 0);
    }
    return x + "px";
  };

  const top = () => {
    if (!props.position) return;
    if (!contextMenuEl()) return;
    let y = props.position.y;
    // move the context menu to the top if it's off the screen.
    if (y + height() > window.innerHeight) {
      y = Math.max(y - height(), 0);
    }
    return y + "px";
  };

  createEffect(
    on([() => props.position, height, width], () => {
      setPos({ left: left() || "0", top: top() || "0" });
    })
  );

  const onItemClick = (item: ContextMenuItem, e: MouseEvent) => {
    if (item.disabled) return;
    e.preventDefault();
    e.stopPropagation();
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
                <Show
                  when={Object.keys(item || {}).length && item.show !== false}
                >
                  <Switch
                    fallback={
                      <Item
                        close={props.onClose}
                        hovered={i() === hoveredItemIndex()}
                        onEnter={() => onMouseEnter(item, i())}
                        onLeave={() => onMouseLeave(item, i())}
                        onClick={(e) => onItemClick(item, e)}
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
  onClick?(event: MouseEvent): void;
  onEnter?(): void;
  onLeave?(): void;
  hovered?: boolean;
}) {
  const { isMobileWidth } = useWindowProperties();
  const [showSubMenu, setShowSubMenu] = createSignal(false);
  let itemElement: HTMLDivElement | undefined;
  const { width } = useResizeObserver(() => itemElement);
  const onClick = (e: MouseEvent) => {
    if (props.item.disabled) return;
    if (props.item.sub && isMobileWidth()) {
      setShowSubMenu(!showSubMenu());
      return;
    }
    props.onClick?.(e);
    props.item.onClick?.(e);
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
      <Show
        when={
          props.item.sub && (isMobileWidth() ? showSubMenu() : props.hovered)
        }
      >
        <ContextMenu
          onClose={() => props.close?.()}
          items={props.item.sub!}
          position={getSubContextMenuPos()}
        />
      </Show>
    </>
  );
}
