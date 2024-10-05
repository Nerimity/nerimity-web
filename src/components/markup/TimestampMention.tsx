import { formatTimestamp, timeSinceMentions } from "@/common/date";
import { createEffect, createSignal, on, onCleanup, onMount } from "solid-js";
import Icon from "../ui/icon/Icon";

export enum TimestampType {
  RELATIVE = "tr",
}

export function TimestampMention(props: {
  type: TimestampType;
  timestamp: number;
}) {
  const [formattedTime, setFormattedTime] = createSignal("...");

  const updateTime = () => {
    if (props.type === TimestampType.RELATIVE) {
      return setFormattedTime(timeSinceMentions(props.timestamp));
    }
  };

  createEffect(
    on([() => props.timestamp, () => props.type], () => {
      updateTime();
      const timeoutId = setInterval(updateTime, 1000);

      onCleanup(() => {
        clearInterval(timeoutId);
      });
    })
  );

  return (
    <div class="mention timestamp" title={formatTimestamp(props.timestamp)}>
      <Icon
        name="schedule"
        size={14}
        color="var(--primary-color)"
        class="icon"
      />
      {formattedTime()}
    </div>
  );
}
