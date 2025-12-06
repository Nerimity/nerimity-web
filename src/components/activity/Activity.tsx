import styles from "./styles.module.scss";
import { ActivityStatus } from "@/chat-api/RawData";
import {
  calculateTimeElapsedForActivityStatus,
  millisecondsToHhMmSs,
} from "../../common/date";
import { createEffect, createSignal, on, onCleanup } from "solid-js";
import Text from "../ui/Text";
import { t } from "@nerimity/i18lite"

export const getActivityIconName = (activity: ActivityStatus) => {
  if (activity.action.startsWith(t("activityNames.listening") || "Listening")) return "music_note";
  if (activity.action.startsWith(t("activityNames.watching") || "Watching")) return "movie";
  return "gamepad";
};

export const RichProgressBar = (props: {
  primaryColor?: string;
  startedAt: number;
  endsAt: number;
  speed?: number;
  updatedAt?: number;
}) => {
  const [playedFor, setPlayedFor] = createSignal("");

  const endsAt = () => {
    const diff = props.endsAt - props.startedAt;
    return millisecondsToHhMmSs(diff, true);
  };

  const updatePlayedFor = () => {
    setPlayedFor(
      calculateTimeElapsedForActivityStatus(
        props.startedAt,
        true,
        props.speed || 1,
        props.updatedAt
      )
    );
  };

  createEffect(() => {
    updatePlayedFor();
    const intervalId = setInterval(() => {
      updatePlayedFor();
    }, 1000);

    onCleanup(() => {
      clearInterval(intervalId);
    });
  });

  const percent = on(playedFor, () => {
    // const ms = Date.now() - timestamp;

    // let seconds = ms / 1000;

    // if (updatedAt) {
    //   const seekedSeconds = (updatedAt - timestamp) / 1000;
    //   const seekedSecondsWithSpeed = seekedSeconds * speed;
    //   const seekedSpeed = -(seekedSeconds - seekedSecondsWithSpeed);
    //   seconds = seconds * speed - seekedSpeed;
    // }

    // seconds = Math.floor(seconds);

    let start = Date.now() - props.startedAt;

    let speed = props.speed ? props.speed * 1 : 1;

    if (props.updatedAt) {
      const seeked = props.updatedAt - props.startedAt;
      const seekedWithSpeed = seeked * speed;
      const seekedSpeed = -(seeked - seekedWithSpeed);
      start = start * speed - seekedSpeed;
    }

    const end = props.endsAt - props.startedAt;

    return Math.round((start / end) * 100);
  });

  return (
    <div class={styles.richProgressBar}>
      <div class={styles.progressDetails}>
        <Text class={styles.playedFor} size={13} opacity={0.6}>
          {playedFor()}
        </Text>
        <Text class={styles.endsAt} size={13} opacity={0.6}>
          {endsAt()}
        </Text>
      </div>
      <div class={styles.progressBar}>
        <div
          class={styles.progress}
          style={{
            width: `${percent(undefined)}%`,
            ...(props.primaryColor
              ? { "background-color": props.primaryColor }
              : {}),
          }}
        />
      </div>
    </div>
  );
};
