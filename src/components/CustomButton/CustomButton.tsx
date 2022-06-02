import styles from './styles.module.scss';
import Icon from '../Icon';

interface Props {
  color?: string;
  class?: string;
  label?: string; 
  iconName?: string;
  onClick?: () => void;
}

export default function CustomButton(props: Props) {
  const color = props.color || 'var(--primary-color)';
  return (
    <div classList={{[styles.button]: true}} class={props.class} onClick={props.onClick}>
      { props.iconName && <Icon name={props.iconName} className={styles.icon} color={color} /> }
      { props.label && <div class={styles.label} style={{color}}>{props.label}</div> }
    </div>
  )
}