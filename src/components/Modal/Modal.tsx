import styles from './styles.module.scss';
import { JSX, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
export default function Modal(props: {show: boolean, component: () => JSX.Element}) {
  return (
    <Show when={props.show}>
      <Portal>
        <div class={styles.background}>
          <div class={styles.container}>{props.component()}</div>
        </div>
      </Portal>
    </Show>
  )
}