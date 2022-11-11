import styles from './styles.module.scss';
import { JSX, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
export default function Modal(props: {title: string, children: JSX.Element, close?: () => void}) {
  let mouseDownTarget: HTMLDivElement | null = null;

  const onBackgroundClick = (event: MouseEvent) => {
    if(mouseDownTarget?.closest("." +styles.container)) return; 
    props.close?.()
  }
  return (
      <Portal>
        <div class={styles.background} onclick={onBackgroundClick} onMouseDown={e => mouseDownTarget = e.target as any}>
          <div class={styles.container}>
            <div class={styles.topBar}>
              <div class={styles.title}>{props.title}</div>
            </div>
            <div class={styles.innerContainer}>{props.children}</div>
          </div>
        </div>
      </Portal>
  )
}