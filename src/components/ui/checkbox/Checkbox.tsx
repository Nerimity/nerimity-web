import { createEffect, createSignal, on } from 'solid-js';
import Icon from '../icon/Icon';
import styles from './styles.module.scss';

interface CheckboxProps {
  checked: boolean
  onChange?: (checked: boolean) => void
  disableLocalUpdate?: boolean
}

export default function Checkbox (props: CheckboxProps) {
  const [checked, setChecked] = createSignal(props.checked || false);

  createEffect(on(() => props.checked, () => 
    setChecked(props.checked)
  ));

  const onClick = () => {
    const newState = !checked() 
    !props.disableLocalUpdate &&  setChecked(newState);
    props.onChange?.(newState);
  }

  return (
    <div class={styles.checkbox} classList={{[styles.selected]: checked()}} onClick={onClick}>
      <Icon class={styles.box} name="done" />
    </div>
  )
}
