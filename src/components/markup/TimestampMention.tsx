import { formatTimestamp } from "@/common/date";
import { createEffect, createSignal, on, onCleanup, onMount } from "solid-js";
import Icon from "../ui/icon/Icon";

export enum TimestampType {
  RELATIVE = "tr"
}

export function TimestampMention(props: { type: TimestampType; timestamp: number }) {
  const [formattedTime, setFormattedTime] = createSignal("...");

  const updateTime = () => {
    if (props.type === TimestampType.RELATIVE) {
      return setFormattedTime(timeSince(props.timestamp));
    }
  };
  
  createEffect(on([() => props.timestamp, () => props.type] ,() => {
    updateTime();
    const timeoutId = setInterval(updateTime, 1000);

    onCleanup(() => {
      clearInterval(timeoutId);
    });
  }));

  return (
    <div class="mention">
      <Icon name="schedule" size={14} color="var(--primary-color)" class="icon"  />
      {formattedTime()}
    </div>
  );
}


function timeSince(timestamp: number) {
  const now = new Date();
  const rawSecondsPast = (now.getTime() - timestamp) / 1000;
  const secondsPast = Math.abs(rawSecondsPast);

  const text = (value: string) => rawSecondsPast < 0 ? `In ${value}` : `${value} ago`; 


  if (secondsPast < 60) {
    return text(Math.round(secondsPast) + " seconds");
  }
  if (secondsPast < 3600) {
    return text(Math.round(secondsPast / 60) + " minutes");
  }
  if (secondsPast <= 86400) {
    return text(Math.round(secondsPast / 3600) + " hours " + (Math.round(secondsPast / 60) % 60 )  + " minutes");
  }
  if (secondsPast <= 604800) {
    return text(Math.round(secondsPast / 86400) + " days " + (Math.round(secondsPast / 3600) % 24 )  + " hours");
  }
  if (secondsPast <= 2629743) {
    return text(Math.round(secondsPast / 604800) + " weeks " + (Math.round(secondsPast / 86400) % 7 )  + " days");
  }
  if (secondsPast <= 31556926) {
    return text(Math.round(secondsPast / 2629743) + " months " + (Math.round(secondsPast / 604800) % 4 )  + " weeks");
  }

  return text(Math.round(secondsPast / 31556926) + " years");
  
}