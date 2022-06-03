import { JSX } from 'solid-js/jsx-runtime';
import styles from './styles.module.scss';

interface IconProps {
  name: string;
  color?: string;
  size?: number;
  class?: string
  onClick?: JSX.EventHandlerUnion<HTMLSpanElement, MouseEvent>;
}

export function Icon(props: IconProps) {
  return (
    <span
      class={"material-icons-round " + styles.icon +" " + props.class || "" }
      style={{color: props.color, "font-size": props.size + "px"}}
      onClick={props.onClick}>
        {props.name}
    </span>
  )
}