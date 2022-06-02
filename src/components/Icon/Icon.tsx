import { JSX } from 'solid-js/jsx-runtime';
import styles from './styles.module.scss';

interface IconProps {
  name: string;
  color?: string;
  size?: number;
  className?: string
  onClick?: JSX.EventHandlerUnion<HTMLSpanElement, MouseEvent>;
}

export function Icon(props: IconProps) {
  return (
    <span
      class={"material-icons-round " + styles.icon +" " + props.className || "" }
      style={{color: props.color, fontSize: props.size + "px"}}
      onClick={props.onClick}>
        {props.name}
    </span>
  )
}