import { createEffect, createRenderEffect, createSignal, For, on, onCleanup, onMount, Show } from "solid-js";
import { classNames, conditionalClass } from "@/common/classNames";
import Icon from "@/components/ui/icon/Icon";
import styles from "./styles.module.scss";
import { Portal } from "solid-js/web";
import { useResizeObserver } from "@/common/useResizeObserver";
import { useWindowProperties } from "@/common/useWindowProperties";
import { t } from "@nerimity/i18lite";


export interface MultiSelectDropDownItem {
  id: string;
  label?: string;
  description?: string;
  icon?: string;
  onClick?: (item: MultiSelectDropDownItem) => void;
  data?: any;
  separator?: boolean;
  circleColor?: string;
}

export interface MultiSelectDropDownProps {
  items: MultiSelectDropDownItem[]
  selectedIds?: string[]
  title?: string
  onChange?: (item: MultiSelectDropDownItem[]) => void;
  class?: string;
}


export default function MultiSelectDropDown(props: MultiSelectDropDownProps) {
  const [selectedIds, setSelectedIds] = createSignal<string[]>(props.selectedIds || []);
  const [popupLocation, setPopupLocation] = createSignal<null | {top: number, left: number, minWidth: number, indicatorHeight: number}>(null);
  let element: undefined | HTMLDivElement;

  const selectedItems = () => props.items.filter(item => selectedIds().includes(item.id));

  const onItemClick = (item: MultiSelectDropDownItem) => {
    if (selectedIds().includes(item.id)){
      setSelectedIds(selectedIds().filter(id => id !== item.id));
    }
    else {
      setSelectedIds([...selectedIds(), item.id]);
    }
    
    props.onChange?.(selectedItems());
    item.onClick?.(item);
  };

  createEffect(on(() => props.selectedIds, () => {
    setSelectedIds(props.selectedIds || []);
  }));

  const togglePopup = () => {
    if (popupLocation()) {
      return setPopupLocation(null);
    }
    if (!element) return;
    const rect = element.getBoundingClientRect();
    setPopupLocation({top: rect.top, left: rect.left, minWidth: rect.width, indicatorHeight: rect.height});
  };

  return (
    <div class={classNames(styles.dropDown, props.class)} >
      <Show when={props.title}>
        <div class={styles.title}>{props.title}</div>
      </Show>
      <div class={styles.box} onClick={togglePopup} ref={element}>
        <ItemTemplate items={selectedItems()} />
        <Icon name='keyboard_arrow_down' class={styles.expandIcon} />
      </div>
      <Show when={popupLocation()}>
        <Portal><Popup selectedIds={selectedIds()} position={popupLocation()!} items={props.items} onClose={() => setPopupLocation(null)} onClick={onItemClick} /></Portal>
      </Show>
    </div>
  );
}

function ItemTemplate(props: { items?: MultiSelectDropDownItem[], item?: MultiSelectDropDownItem }) {
  return (
    <div class={styles.itemTemplate}>
      <div class={styles.details}>
        <div>
          <Show when={props.items}>{props.items ? t("dropDown.itemsSelected", { count: props.items.length }) : t("dropDown.selectItemMultiple")}</Show>
          <Show when={props.item}>{props.item?.label}</Show>
        </div>
      </div>
    </div>
  );
}


function Popup(props: { items: MultiSelectDropDownItem[], position: {top: number, left: number, minWidth: number, indicatorHeight: number}, selectedIds: string[], onClose: () => void, onClick?: (item: MultiSelectDropDownItem) => void }) {
  let element: HTMLDivElement | undefined;
  const resizeObserver = useResizeObserver(() => element);
  const {width, height} = useWindowProperties();
  const [position, setPosition] = createSignal({top: "0px", left: "0px", "min-width": "0px"});

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


  createEffect(on(width, () => {
    props.onClose();
  }, {defer: true}));


  createRenderEffect(() => {
    let top = props.position.top + props.position.indicatorHeight + 2;
    let left = props.position.left;


    const elWidth = resizeObserver.width();
    const right = left + elWidth;
    if (right > width()) {
      left = (width() - elWidth) - 10;
    }

    const elHeight = resizeObserver.height();
    const bottom = top + elHeight;
    if (bottom > height()) {
      top = top - elHeight - props.position.indicatorHeight - 20;
    }

    setPosition({
      top: top + "px",
      left: left + "px",
      "min-width": props.position.minWidth + "px"
    });
  });



  const onItemClick = (item: MultiSelectDropDownItem) => {
    props.onClick?.(item);
  };


  return (
    <div class={styles.popup} ref={element} style={position()}>
      <For each={props.items}>
        {item => (
          <div class={
            classNames(styles.item, conditionalClass(props.selectedIds?.includes(item.id), styles.selected))}
          onClick={() => onItemClick(item)}
          >
            <ItemTemplate item={item} />
          </div>
        )}
      </For>
    </div>
  );
}
