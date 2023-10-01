import styles from './styles.module.scss';
import { JSX, Show } from 'solid-js';
import Icon from '@/components/ui/icon/Icon';
import { classNames, conditionalClass } from '@/common/classNames';
import { css } from 'solid-styled-components';

interface BlockProps {
  label: string;
  icon?: string;
  iconSrc?: string;
  description?: string;
  children?: JSX.Element | undefined;
  header?: boolean;
  class?: string;
  borderTopRadius?: boolean
  borderBottomRadius?: boolean
}


export default function SettingsBlock(props: BlockProps) {
  return (
    <div class={
      classNames(
        styles.block,
        conditionalClass(props.header, styles.header),
        conditionalClass(props.borderTopRadius === false, css`&& {border-top-left-radius: 0; border-top-right-radius: 0; margin-top: 0;}`),
        conditionalClass(props.borderBottomRadius === false, css`&& {border-bottom-left-radius: 0; border-bottom-right-radius: 0; margin-bottom: 0;}`),
        conditionalClass(props.borderBottomRadius === false && props.borderTopRadius === false, css`&& {margin-bottom: 1px;}`),
        props.class
      )}>
      <div class={styles.outerContainer}>
        <Show when={props.iconSrc} fallback={<Icon name={props.icon || "texture"} />}>
          <img class={styles.icon} src={props.iconSrc} alt="" />
        </Show>
        <div class={styles.details}>
          <div class={styles.label}>{props.label}</div>
          <Show when={props.description}><div class={styles.description}>{props.description}</div></Show>
        </div>
      </div>
      {props.children}
    </div>
  )
}


