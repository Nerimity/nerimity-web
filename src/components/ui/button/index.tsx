import styles from './styles.module.scss';
import Icon from '@/components/ui/icon';

interface Props {
  color?: string;
  class?: string;
  label?: string; 
  iconName?: string;
  onClick?: () => void;
}

export default function Button(props: Props) {
  const color = props.color || 'var(--primary-color)';
  return (
    <div class={props.class} classList={{[styles.button]: true}} onClick={props.onClick}>
      { props.iconName && <Icon name={props.iconName} class={styles.icon} color={color} /> }
      { props.label && <div class={styles.label} style={{color}}>{props.label}</div> }
    </div>
  )
}