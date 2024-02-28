import { createEffect, createSignal, For, on, onCleanup, onMount, Show } from "solid-js";
import { classNames, conditionalClass } from "@/common/classNames";
import Icon from "@/components/ui/icon/Icon";
import styles from "./styles.module.scss";


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
  const [isOpen, setIsOpen] = createSignal(false);

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



  return (
    <div class={classNames(styles.dropDown, props.class)} >
      <Show when={props.title}>
        <div class={styles.title}>{props.title}</div>
      </Show>
      <div class={styles.box} onClick={() => setIsOpen(true)}>
        <ItemTemplate items={selectedItems()} />
        <Icon name='expand_more' class={styles.expandIcon} />
        <Show when={isOpen()}>
          <Popup selectedIds={selectedIds()} items={props.items} onClose={() => setIsOpen(false)} onClick={onItemClick} />
        </Show>
      </div>
    </div>
  );
}

function ItemTemplate(props: { items?: MultiSelectDropDownItem[], item?: MultiSelectDropDownItem }) {
  return (
    <div class={styles.itemTemplate}>
      <div class={styles.details}>
        <div>
          <Show when={props.items}>{props.items ? `${props.items.length} item(s) selected` :"Select Item(s)"}</Show>
          <Show when={props.item}>{props.item?.label}</Show>
        </div>
      </div>
    </div>
  );
}


function Popup(props: { items: MultiSelectDropDownItem[], selectedIds: string[], onClose: () => void, onClick?: (item: MultiSelectDropDownItem) => void }) {

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

  const onItemClick = (item: MultiSelectDropDownItem) => {
    props.onClose();
    props.onClick?.(item);
  };


  return (
    <div class={styles.popup}>
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
