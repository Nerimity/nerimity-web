import style from "./NotificationCountBadge.module.css";
import { Show } from "solid-js";
export function NotificationCountBadge(props: {
  count: number | string;
  top: number;
  right: number;
}) {
  return (
    <Show when={props.count}>
      <div
        class={style.notificationCount}
        style={{
          top: `${props.top}px`,
          right: `${props.right}px`,
        }}
      >
        {props.count}
      </div>
    </Show>
  );
}
