import { createEffect, createSignal, For, on, onCleanup, onMount, Show } from 'solid-js';
import { classNames, conditionalClass } from '../../common/classNames';
import Icon from '../Icon';
import styles from './styles.module.scss';


interface Item {
  id: string;
  label?: string;
  icon?: string;
  onClick?: (item: Item) => void;
  separator?: boolean;
  circleColor?: string;
}

export interface DropDownProps {
  items: Item[]
  selectedId?: string
}


export default function DropDown (props: DropDownProps) {
  const [selectedId, setSelectedId] = createSignal<string | null>(props.selectedId || null);
  const [isOpen, setIsOpen] = createSignal(false);

  const selectedItem = () => props.items.find(item => item.id === selectedId());

  const onItemClick = (item: Item) => {
    if (item.id === selectedId()) return;
    setSelectedId(item.id);
    item.onClick?.(item);
  }

  createEffect(on(() => props.selectedId, () => {
    setSelectedId(props.selectedId || null);
  }))



  return (
    <div class={styles.dropDown}>
      <div class={styles.box} onclick={() => setIsOpen(true)}>
        <ItemTemplate item={selectedItem()} />
        <Icon name='expand_more' class={styles.expandIcon} />
      </div>
      <Show when={isOpen()}>
        <Popup selectedId={selectedId()}  items={props.items} onClose={() => setIsOpen(false)} onClick={onItemClick}  />
      </Show>
    </div>
  )
}

function ItemTemplate (props: {item?: Item}) {
  return (
    <div class={styles.itemTemplate}>
      <CircleColor color={props.item?.circleColor} />
      {props.item?.label || "Select Item"}
    </div>
  )
}

function CircleColor(props: {color?: string}) {
  return <Show when={props.color}>
    <div class={styles.circleColor} style={{background: props.color}}></div>
  </Show>
}



function Popup (props: {items: Item[], selectedId: string | null, onClose: () => void, onClick?: (item: Item) => void}) {

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

  const onItemClick = (item: Item) => {
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
