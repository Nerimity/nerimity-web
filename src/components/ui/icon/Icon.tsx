import { JSX } from 'solid-js/jsx-runtime';
import styles from './styles.module.scss';

interface IconProps {
  name?: string;
  color?: string;
  size?: number;
  class?: string;
  style?: JSX.CSSProperties;
  title?: string
  onClick?: JSX.EventHandlerUnion<HTMLSpanElement, MouseEvent>;
}

export default function Icon(props: IconProps) {
  return (
    <span
      class={"icon " + "material-icons-round " + styles.icon +" " + props.class || "" }
      style={{color: props.color, "font-size": props.size + "px", ...props.style}}
      title={props.title}
      onClick={props.onClick}>
        {props.name || 'texture'} 
    </span>
  )
}