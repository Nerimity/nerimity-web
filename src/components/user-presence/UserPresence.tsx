import styles from './styles.module.scss';
import { Match, Show, Switch } from 'solid-js';
import { classNames } from '@/common/classNames';
import { userStatusDetail } from '@/common/userStatus';
import useStore from '@/chat-api/store/useStore';
import { Markup } from '../Markup';


const UserPresence = (props: { userId: string, showOffline: boolean, animate?: boolean }) => {
  const { users } = useStore();
  const user = () => users.get(props.userId);

  const statusDetails = () => userStatusDetail(user()?.presence?.status || 0)

  const show = () => {
    if (!props.showOffline && !user()?.presence?.status) {
      return false
    }

    if (!statusDetails()) {
      return false
    }
    return true;
  }

  const name = () => {
    return <Switch fallback={statusDetails()?.name}>
      <Match when={user()?.presence?.custom}><Markup animateEmoji={props.animate} inline text={user().presence?.custom!} /></Match>
    </Switch>;
  }

  return (
    <Show when={show()}>
      <div class={styles.userPresence}>
        <div title={statusDetails().name} class={classNames(styles.dot, styles[statusDetails()?.id])} />
        <div class={styles.value}>{name()}</div>
      </div>
    </Show>
  )

};

export default UserPresence;