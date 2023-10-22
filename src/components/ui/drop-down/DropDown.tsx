import { createEffect, createSignal, For, on, onCleanup, onMount, Show } from 'solid-js';
import { classNames, conditionalClass } from '@/common/classNames';
import Icon from '@/components/ui/icon/Icon';
import styles from './styles.module.scss';


export interface DropDownItem {
  id: string;
  label?: string;
  description?: string;
  icon?: string;
  onClick?: (item: DropDownItem) => void;
  data?: any;
  separator?: boolean;
  circleColor?: string;
}

export interface DropDownProps {
  items: DropDownItem[]
  selectedId?: string
  title?: string
  onChange?: (item: DropDownItem) => void;
  class?: string;
}


export default function DropDown(props: DropDownProps) {
  const [selectedId, setSelectedId] = createSignal<string | null>(props.selectedId || null);
  const [isOpen, setIsOpen] = createSignal(false);

  const selectedItem = () => props.items.find(item => item.id === selectedId());

  const onItemClick = (item: DropDownItem) => {
    if (item.id === selectedId()) return;
    setSelectedId(item.id);
    props.onChange?.(item);
    item.onClick?.(item);
  }

  createEffect(on(() => props.selectedId, () => {
    setSelectedId(props.selectedId || null);
  }))



  return (
    <div class={classNames(styles.dropDown, props.class)} >
      <Show when={props.title}>
        <div class={styles.title}>{props.title}</div>
      </Show>
      <div class={styles.box} onclick={() => setIsOpen(true)}>
        <ItemTemplate item={selectedItem()} />
        <Icon name='expand_more' class={styles.expandIcon} />
        <Show when={isOpen()}>
          <Popup selectedId={selectedId()} items={props.items} onClose={() => setIsOpen(false)} onClick={onItemClick} />
        </Show>
      </div>
    </div>
  )
}

function ItemTemplate(props: { item?: DropDownItem }) {
  return (
    <div class={styles.itemTemplate}>
      <CircleColor color={props.item?.circleColor} />
      <div class={styles.details}>
        <div>{props.item?.label || "Select Item"}</div>
        <Show when={props.item?.description}><div class={styles.description}>{props.item?.description}</div></Show>
      </div>
    </div>
  )
}

function CircleColor(props: { color?: string }) {
  return <Show when={props.color}>
    <div class={styles.circleColor} style={{ background: props.color }}></div>
  </Show>
}



function Popup(props: { items: DropDownItem[], selectedId: string | null, onClose: () => void, onClick?: (item: DropDownItem) => void }) {

  const onDocumentClick = (event: any) => {
    if (event.target.closest("." + styles.popup)) return;
    props.onClose();
  }

  onMount(() => {
    document.addEventListener('click', onDocumentClick);

    onCleanup(() => {
      document.removeEventListener('click', onDocumentClick);
    })
  })

  const onItemClick = (item: DropDownItem) => {
    props.onClose();
    props.onClick?.(item);
  }


  return (
    <div class={styles.popup}>
      <For each={props.items}>
        {item => (
          <div class={
            classNames(styles.item, conditionalClass(props.selectedId === item.id, styles.selected))}
            onclick={() => onItemClick(item)}
          >
            <ItemTemplate item={item} />
          </div>
        )}
      </For>
    </div>
  )
}
