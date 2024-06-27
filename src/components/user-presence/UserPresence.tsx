import styles from "./styles.module.scss";
import { Match, Show, Switch } from "solid-js";
import { classNames, conditionalClass } from "@/common/classNames";
import { userStatusDetail } from "@/common/userStatus";
import useStore from "@/chat-api/store/useStore";
import { Markup } from "../Markup";
import Icon from "../ui/icon/Icon";
import { getActivityIconName } from "@/components/activity/Activity";
import { Tooltip } from "../ui/Tooltip";



// show full will disable overflow eclipses
const UserPresence = (props: { showFull?: boolean; userId: string, showOffline: boolean, animate?: boolean, hideActivity?: boolean }) => {
  const { users } = useStore();
  const user = () => users.get(props.userId);

  const statusDetails = () => userStatusDetail(user()?.presence()?.status || 0);
  const activity = () => props.hideActivity ? undefined : user().presence()?.activity;

  const show = () => {
    if (!props.showOffline && !user()?.presence()?.status) {
      return false;
    }

    if (!statusDetails()) {
      return false;
    }
    return true;
  };

  const name = () => {
    return <Switch fallback={statusDetails()?.name}>
      <Match when={activity()}>
        <span class={styles.activity}>
          <span class={styles.activityAction}>{activity()?.action}</span>
          <span class={styles.activityName}> {activity()?.name}</span>
        </span>
      </Match>
      <Match when={user()?.presence()?.custom}><Markup animateEmoji={props.animate} inline text={user().presence()?.custom!} /></Match>
    </Switch>;
  };

  return (
    <Show when={show()}>
      <div class={classNames(styles.userPresence, conditionalClass(props.showFull, styles.full))}>
        <Show when={activity()} fallback={<div title={statusDetails().name} class={classNames(styles.dot, styles[statusDetails()?.id])} />}>
          <Icon name={getActivityIconName(activity()!)} size={14} color={statusDetails().color} />
        </Show>
        <Tooltip tooltip={<div class={styles.full}>{name()}</div>} anchor="left" class={styles.value}>
          {name()}
        </Tooltip>
      </div>
    </Show>
  );

};

export default UserPresence;