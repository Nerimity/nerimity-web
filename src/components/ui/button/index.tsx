import styles from './styles.module.scss';
import Icon from '@/components/ui/icon';
import { conditionalClass } from '@/common/classNames';

interface Props {
  color?: string;
  class?: string;
  label?: string; 
  iconName?: string;
  onClick?: () => void;
  primary?: boolean;
}

export default function Button(props: Props) {
  const color = props.color || 'var(--primary-color)';
  return (
    <div class={props.class} style={{background: props.primary ? color : undefined}} classList={{[styles.button]: true}} onClick={props.onClick} >
      { props.iconName && <Icon name={props.iconName} class={styles.icon} color={props.primary ? 'white' : color} /> }
      { props.label && <div class={styles.label} style={{color: props.primary ? 'white' : color}}>{props.label}</div> }
    </div>
  )
}