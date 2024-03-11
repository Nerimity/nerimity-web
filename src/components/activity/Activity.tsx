import styles from "./styles.module.scss";
import { ActivityStatus } from "@/chat-api/RawData";
import { calculateTimeElapsedForActivityStatus, millisecondsToHhMmSs } from "../../common/date";
import { createEffect, createSignal, on, onCleanup } from "solid-js";
import Text from "../ui/Text";

export const getActivityIconName = (activity: ActivityStatus) => {
  if (activity.action.startsWith("Listening")) return "music_note";
  if (activity.action.startsWith("Watching")) return "movie";
  return "games";
};

export const RichProgressBar = (props: { startedAt: number, endsAt: number }) => {
  const [playedFor, setPlayedFor] = createSignal("");

  const endsAt = () => {
    const diff = props.endsAt - props.startedAt;
    return millisecondsToHhMmSs(diff, true);
  };

  createEffect(() => {
    setPlayedFor(calculateTimeElapsedForActivityStatus(props.startedAt, true));
    const intervalId = setInterval(() => {
      setPlayedFor(calculateTimeElapsedForActivityStatus(props.startedAt, true));
    }, 1000);

    onCleanup(() => {
      clearInterval(intervalId);
    });
  });

  const percent = on(playedFor, () => {
    const now = Date.now();
    const start = now - props.startedAt;
    const end = props.endsAt - props.startedAt;

    return Math.round(start / end * 100);
  });


  return (
    <div class={styles.richProgressBar}>
      <div class={styles.progressDetails}>
        <Text size={13} opacity={0.6}>{playedFor()}</Text>
        <Text size={13} opacity={0.6}>{endsAt()}</Text>  
      </div>
      <div class={styles.progressBar}>
        <div class={styles.progress} style={{width: `${percent(undefined)}%`}} />
      </div>
    </div>
  );
};