import { JSX, Show } from 'solid-js';
import Icon from '../Icon';
import styles from './styles.module.scss';

interface BlockProps {
  label: string;
  icon: string;
  description?: string;
  children?: JSX.Element | undefined;
}


export function SettingsBlock(props: BlockProps) {
  return (
    <div class={styles.block}>
      <Icon name={props.icon} />
      <div class={styles.details}>
        <div class={styles.label}>{props.label}</div>
        <Show when={props.description}><div class={styles.description}>{props.description}</div></Show>
      </div>
      {props.children}
    </div>
  )
}


