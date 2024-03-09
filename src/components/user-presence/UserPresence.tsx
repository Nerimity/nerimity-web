import styles from "./styles.module.scss";
import { Match, Show, Switch } from "solid-js";
import { classNames } from "@/common/classNames";
import { userStatusDetail } from "@/common/userStatus";
import useStore from "@/chat-api/store/useStore";
import { Markup } from "../Markup";
import Icon from "../ui/icon/Icon";


const UserPresence = (props: { userId: string, showOffline: boolean, animate?: boolean, hideActivity?: boolean }) => {
  const { users } = useStore();
  const user = () => users.get(props.userId);

  const statusDetails = () => userStatusDetail(user()?.presence?.status || 0);
  const activity = () => props.hideActivity ? undefined : user().presence?.activity;

  const show = () => {
    if (!props.showOffline && !user()?.presence?.status) {
      return false;
    }

    if (!statusDetails()) {
      return false;
    }
    return true;
  };

  const icon = () => {
    if (activity()?.action.startsWith("Listening")) return "music_note";
    if (activity()?.action.startsWith("Watching")) return "movie";
    return "games";
  };

  const name = () => {
    return <Switch fallback={statusDetails()?.name}>
      <Match when={activity()}>
        <div class={styles.activity}>
          <div class={styles.activityAction}>{activity()?.action}</div>
          <div class={styles.activityName}>{activity()?.name}</div>
        </div>
      </Match>
      <Match when={user()?.presence?.custom}><Markup animateEmoji={props.animate} inline text={user().presence?.custom!} /></Match>
    </Switch>;
  };

  return (
    <Show when={show()}>
      <div class={styles.userPresence}>
        <Show when={activity()} fallback={<div title={statusDetails().name} class={classNames(styles.dot, styles[statusDetails()?.id])} />}>
          <Icon name={icon()} size={14} color={statusDetails().color} />
        </Show>
        <div class={styles.value}>{name()}</div>
      </div>
    </Show>
  );

};

export default UserPresence;