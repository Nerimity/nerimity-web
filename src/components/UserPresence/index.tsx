import styles from './styles.module.scss';
import { Show } from 'solid-js';
import { User } from '../../chat-api/store/useUsers';
import { classNames } from '../../common/classNames';
import { userStatusDetail } from '../../common/userStatus';
import useStore from '../../chat-api/store/useStore';


const UserPresence = (props: {userId: string, showOffline: boolean}) => {
  const {users} = useStore();
  const user = () => users.get(props.userId);
  
  const statusDetails = () => userStatusDetail(user()?.presence?.status || 0)

  const show = () => {
    if (!props.showOffline && !user().presence?.status) {
      return false
    }
  
    if (!statusDetails()) {
      return false
    }
    return true;
  }


  

  return (
    <Show when={show()}>
    <div class={styles.userPresence}>
      <div class={classNames(styles.dot, styles[statusDetails()?.id])} />
      <div class={styles.value}>{statusDetails()?.name}</div>
    </div>
    </Show>
  )

};

export default UserPresence;