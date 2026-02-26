import styles from "./styles.module.scss";
import { ActivityStatus } from "@/chat-api/RawData";
import {
  calculateTimeElapsedForActivityStatus,
  formatMillisElapsedDigital,
} from "../../common/date";
import { createEffect, createSignal, on, onCleanup } from "solid-js";
import Text from "../ui/Text";

import { getActivityType } from "@/common/activityType";

export const getActivityIconName = (activity: ActivityStatus) => {
  return getActivityType(activity).icon;
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
    return formatMillisElapsedDigital(diff);
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

    const speed = props.speed ? props.speed * 1 : 1;

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
