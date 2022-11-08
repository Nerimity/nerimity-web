import { JSX } from 'solid-js/jsx-runtime';
import styles from './styles.module.scss';

interface IconProps {
  name?: string;
  color?: string;
  size?: number;
  class?: string
  title?: string
  onClick?: JSX.EventHandlerUnion<HTMLSpanElement, MouseEvent>;
}

export default function Icon(props: IconProps) {
  return (
    <span
      class={"material-icons-round " + styles.icon +" " + props.class || "" }
      style={{color: props.color, "font-size": props.size + "px"}}
      title={props.title}
      onClick={props.onClick}>
        {props.name || 'texture'} 
    </span>
  )
}