import styles from './styles.module.scss';
import { createEffect, For, on, onCleanup, Show } from 'solid-js';
import { classNames, conditionalClass } from '@/common/classNames';
import Icon from '@/components/ui/icon';
import { Portal } from 'solid-js/web';


interface Item {
  label?: string;
  icon?: string;
  onClick?: () => void;
  separator?: boolean;
  alert?: boolean
  disabled?: boolean
}

export interface ContextMenuProps {
  items: Item[]
  onClose?: () => void,
  triggerClassName?: string,
  position?: {
    x: number;
    y: number;
  }
}

export default function ContextMenu(props: ContextMenuProps) {
  let contextMenuElement: HTMLDivElement | undefined;


  const handleOutsideClick = (e: any) => {
    if (props.triggerClassName) {
      if (e.target.closest("." + props.triggerClassName)) {return};
    }
    props.onClose?.()
  };
  
  const handleOutsideRightClick = (e: any) => {
    if (e.target.closest("."+styles.contextMenu)) {
      e.preventDefault();
      return;
    };
    props.onClose?.()
  };

  createEffect(on(() => props.position, () => {
    if (!props.position) return;
    window.addEventListener('contextmenu', handleOutsideRightClick, {capture: true});
    window.addEventListener('click', handleOutsideClick);

    onCleanup(() => {
      window.removeEventListener('contextmenu', handleOutsideRightClick);
      window.removeEventListener('click', handleOutsideClick);
    })
  }))



  const left = () => {
    if (!props.position) return;
    if (!contextMenuElement) return;
    // move the context menu to the left if it's off the screen.
    if (props.position.x + contextMenuElement.clientWidth > window.innerWidth) {
      return props.position.x - contextMenuElement.clientWidth + "px";
    }
    return props.position.x + "px";
  }

  const top = () => {
    if (!props.position) return;
    if (!contextMenuElement) return;
    // move the context menu to the top if it's off the screen.
    if (props.position.y + contextMenuElement.clientHeight > window.innerHeight) {
      return props.position.y - contextMenuElement.clientHeight + "px";
    }
    return props.position.y + "px";
  }

  const style = () => ({top: top(), left: left()});

 

  return (
    <Show when={props.position}>
      <Portal>
        <div ref={contextMenuElement} class={styles.contextMenu} style={style()}>
          <div class={styles.contextMenuInner}>
            <For each={props.items}>
              {item => (
                <>
                  {item.separator && <div class={styles.separator} />}
                  {!item.separator && <Item item={item} />}
                </>
              )}
          </For>
          </div>
        </div>
      </Portal>
    </Show>
  )
}

function Item(props: {item: Item}) {
  return (
    <div class={classNames(styles.item, conditionalClass(props.item.alert, styles.alert), conditionalClass(props.item.disabled, styles.disabled))} onClick={props.item.onClick}>
      <Icon name={props.item.icon!} size={18} color={props.item.alert ? 'var(--alert-color)' : undefined}  />
      <span class={styles.label} >{props.item.label}</span>
    </div>
  )
}