import { ActivityStatus } from "@/chat-api/RawData";
import useStore from "@/chat-api/store/useStore";
import {
  calculateTimeElapsedForActivityStatus,
  formatTimestamp,
} from "@/common/date";
import { emojiToUrl } from "@/common/emojiToUrl";
import env from "@/common/env";
import {
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  Show,
} from "solid-js";
import { getActivityIconName, RichProgressBar } from "../activity/Activity";
import Icon from "../ui/icon/Icon";
import Text from "../ui/Text";
import { t } from "@nerimity/i18lite";

import style from "./UserActivity.module.css";
import { getActivityType } from "@/common/activityType";
import { cn } from "@/common/classNames";

export const UserActivity = (props: {
  primaryColor?: string;
  userId?: string;
  exampleActivity?: ActivityStatus;
}) => {
  const { users, account } = useStore();
  const user = () => users.get(props.userId! || account.user()?.id!);
  const activity = () => props.exampleActivity || user()?.presence()?.activity;
  const [playedFor, setPlayedFor] = createSignal("");

  const activityType = () => getActivityType(activity());

  const isMusic = () =>
    !!activityType().isMusic && !!activity()?.startedAt && !!activity()?.endsAt;
  const isVideo = () =>
    !!activityType().isVideo && !!activity()?.startedAt && !!activity()?.endsAt;

  const isLiveStream = () => !!activityType().isVideo && !activity()?.endsAt;

  createEffect(
    on(activity, () => {
      if (!activity()) return;

      setPlayedFor(
        calculateTimeElapsedForActivityStatus(activity()?.startedAt!, isMusic())
      );
      const intervalId = setInterval(() => {
        setPlayedFor(
          calculateTimeElapsedForActivityStatus(
            activity()?.startedAt!,
            isMusic()
          )
        );
      }, 1000);

      onCleanup(() => {
        clearInterval(intervalId);
      });
    })
  );

  const imgSrc = createMemo(() => {
    if (activity()?.emoji) {
      return emojiToUrl(activity()?.emoji!, false);
    }
    if (!activity()?.imgSrc) return;
    return `${env.NERIMITY_CDN}proxy/${encodeURIComponent(
      activity()?.imgSrc!
    )}/a`;
  });

  return (
    <Show when={activity()}>
      <div class={style.userActivityContainer}>
        <Icon
          class={style.icon}
          name={getActivityIconName(activity()!)}
          size={14}
          color={props.primaryColor || "var(--primary-color)"}
        />

        <div class={style.activityInfo}>
          <div class={style.activityInfoRow}>
            <Text size={13}>{activity()?.action}</Text>
            <Text size={13} opacity={0.6}>
              {activity()?.name}
            </Text>
          </div>
          <div class={cn(style.richPresence, imgSrc() && style.hasImage)}>
            <Show when={imgSrc()}>
              <div
                class={style.backgroundImage}
                style={{
                  "background-image": `url(${imgSrc()})`,
                }}
              />
              <img
                src={imgSrc()}
                class={style.activityImg + " activityImage"}
                classList={{
                  [style.videoActivityImg!]: isVideo() || isLiveStream(),
                }}
              />
            </Show>
            <div class={style.richInfo}>
              <Show when={activity()?.title || (activity()?.name && imgSrc())}>
                <Text
                  href={activity()?.link}
                  isDangerousLink
                  newTab
                  size={13}
                  opacity={0.9}
                >
                  {activity()?.title || activity()?.name}
                </Text>
              </Show>
              <Show when={activity()?.subtitle}>
                <Text size={13} opacity={0.6}>
                  {activity()?.subtitle}
                </Text>
              </Show>
              <Show when={!isMusic() && !isVideo()}>
                <Text
                  class={style.playedFor}
                  size={13}
                  opacity={0.6}
                  title={formatTimestamp(activity()?.startedAt || 0)}
                >
                  For {playedFor()}
                </Text>
              </Show>
              <Show when={isMusic() || isVideo()}>
                <RichProgressBar
                  updatedAt={activity()?.updatedAt}
                  primaryColor={props.primaryColor}
                  speed={activity()?.speed}
                  startedAt={activity()?.startedAt!}
                  endsAt={activity()?.endsAt!}
                />
              </Show>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};
