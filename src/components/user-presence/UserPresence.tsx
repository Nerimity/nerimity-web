import styles from "./styles.module.scss";
import { Match, Show, Switch } from "solid-js";
import { classNames, conditionalClass } from "@/common/classNames";
import { userStatusDetail } from "@/common/userStatus";
import useStore from "@/chat-api/store/useStore";
import { Markup } from "../Markup";
import Icon from "../ui/icon/Icon";
import { getActivityIconName } from "@/components/activity/Activity";
import { Tooltip } from "../ui/Tooltip";
import { formatTimestamp } from "@/common/date";
import { t } from "@nerimity/i18lite";
import { getActivityType } from "@/common/activityType";

// show full will disable overflow eclipses
const UserPresence = (props: {
  tooltipAnchor?: "left" | "right";
  showFull?: boolean;
  userId: string;
  showOffline: boolean;
  animate?: boolean;
  hideActivity?: boolean;
  hideAction?: boolean;
  useTitle?: boolean;
  class?: string;
  customStatusOverride?: string;
}) => {
  const { users } = useStore();
  const user = () => users.get(props.userId);

  const statusDetails = () => userStatusDetail(user()?.presence()?.status || 0);
  const activity = () =>
    props.hideActivity ? undefined : user()?.presence()?.activity;

  const lastOnlineAt = () => {
    return user()?.lastOnlineAt;
  };

  const show = () => {
    if (!props.showOffline && !user()?.presence()?.status) {
      if (lastOnlineAt()) {
        return true;
      }
      return false;
    }

    if (!statusDetails()) {
      return false;
    }
    return true;
  };

  const action = () => {
    if (props.hideAction) {
      return "";
    }
    return activity()?.action;
  };

  const activityType = () => getActivityType(activity());

  const activityName = () => {
    const title = activity()?.title;
    if (props.useTitle && title) {
      const action = activity()?.action;
      const subtitle = activity()?.subtitle;

      if (activityType().isMusic || activityType().isVideo) {
        return title + (subtitle ? ` - ${subtitle}` : "");
      }
    }
    return activity()?.name;
  };

  const name = () => {
    return (
      <Switch fallback={statusDetails()?.name()}>
        <Match when={lastOnlineAt() && !user()?.presence()?.status}>
          <div class={styles.lastOnline}>
            Last online {formatTimestamp(lastOnlineAt()!)}
          </div>
        </Match>
        <Match when={activity()}>
          <span class={styles.activity}>
            <span class={styles.activityAction}>{action()}</span>
            <span class={styles.activityName}> {activityName()}</span>
          </span>
        </Match>
        <Match when={props.customStatusOverride || user()?.presence()?.custom}>
          <Markup
            animateEmoji={props.animate}
            inline
            text={props.customStatusOverride || user()?.presence()?.custom!}
          />
        </Match>
      </Switch>
    );
  };

  const onBeforeShow = (e: HTMLElement) => {
    const child = e.children.item(0) as HTMLDivElement | null;
    if (child) {
      if (child.offsetWidth >= child.scrollWidth) {
        return false;
      }
      return true;
    }
    if (e.offsetWidth >= e.scrollWidth) {
      return false;
    }
    return true;
  };
  return (
    <Show when={show()}>
      <div
        class={classNames(
          styles.userPresence,
          conditionalClass(props.showFull, styles.full),
          props.class
        )}
      >
        <Show when={user()?.presence()?.status}>
          <Show
            when={activity()}
            fallback={
              <div
                title={statusDetails().name()}
                class={classNames(styles.dot, styles[statusDetails()?.id])}
              />
            }
          >
            <Icon
              name={getActivityIconName(activity()!)}
              size={14}
              color={statusDetails().color}
            />
          </Show>
        </Show>
        <Tooltip
          tooltip={<div class={styles.full}>{name()}</div>}
          onBeforeShow={onBeforeShow}
          anchor={props.tooltipAnchor}
          class={styles.value}
        >
          {name()}
        </Tooltip>
      </div>
    </Show>
  );
};

export default UserPresence;
