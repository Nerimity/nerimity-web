import styles from './styles.module.scss';
import { JSX, Show } from 'solid-js';
import Icon from '@/components/ui/icon/Icon';
import { classNames, conditionalClass } from '@/common/classNames';

interface BlockProps {
  label: string;
  icon?: string;
  description?: string;
  children?: JSX.Element | undefined;
  header?: boolean;
  class?: string;
}


export default function SettingsBlock(props: BlockProps) {
  return (
    <div class={classNames(styles.block, conditionalClass(props.header, styles.header), props.class)}>
      <Icon name={props.icon || "texture"} />
      <div class={styles.details}>
        <div class={styles.label}>{props.label}</div>
        <Show when={props.description}><div class={styles.description}>{props.description}</div></Show>
      </div>
      {props.children}
    </div>
  )
}


