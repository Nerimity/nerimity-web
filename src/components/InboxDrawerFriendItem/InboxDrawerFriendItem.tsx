import styles from "./styles.module.scss";
import { classNames, conditionalClass } from "../../common/classNames";
import Avatar from "../Avatar/Avatar";
import CustomButton from "../CustomButton/CustomButton";
import { Link, useNavigate, useParams } from "solid-app-router";
import { FriendStatus } from "../../chat-api/RawData";
import { Friend } from "../../chat-api/store/useFriends";
import { User } from "../../chat-api/store/useUsers";
import useStore from "../../chat-api/store/useStore";
import UserPresence from "../UserPresence";
import RouterEndpoints from "../../common/RouterEndpoints";
import { Show } from "solid-js";

export default function InboxDrawerFriendItem(props: { friend?: Friend, user?: User}) {
  const navigate = useNavigate();
  const params = useParams();
  const {inbox} = useStore();


  const user = () => {
    if (props.friend) {
      return props.friend.recipient;
    } else {
      return props.user!;
    }
  }

  const inboxItem = () => inbox.get(user()?.inboxChannelId!);



  const isFriendRequest = () => props.friend?.status === FriendStatus.PENDING || props.friend?.status === FriendStatus.SENT;
  const isSelected = () => inboxItem() && params.channelId === inboxItem().channelId;

  const showAccept = () => props.friend?.status === FriendStatus.PENDING;
  const showDecline = () => props.friend?.status === FriendStatus.PENDING || props.friend?.status === FriendStatus.SENT;

  const onAcceptClick = () => {
    props.friend?.acceptFriendRequest()
  }
  const onDeclineClick = () => {
    props.friend?.removeFriend()
  }


  const onFriendClick = async (e: any) => {
    if (e.target.closest(".link")) return;
    if (e.target.closest("." + styles.button)) return;
    user().openDM(navigate);
  }

  const mentionCount = () => user().mentionCount;



  return (
    <Show when={user()}>
      <div class={classNames(
        styles.friendItem, 
        conditionalClass(isFriendRequest(), styles.requestItem),
        conditionalClass(isSelected(), styles.selected),
        conditionalClass(mentionCount(), styles.hasNotifications),
        conditionalClass(showAccept(), styles.hasNotifications)
      )} onClick={onFriendClick}>

        <Link href={RouterEndpoints.PROFILE(user()._id)} class="link">
          <Avatar hexColor={user().hexColor} size={25} />
        </Link>
        <div class={styles.details}>
          <div class={styles.username}>{user().username}</div>
          <UserPresence userId={user()._id} showOffline={false} />
        </div>


        <Show when={showAccept() || showDecline()}>
          <div class={styles.requestButtons}>
            {showAccept() && <CustomButton class={styles.button} iconName="check" onClick={onAcceptClick} />}
            {showDecline() && <CustomButton class={styles.button} iconName="close" color="var(--alert-color)" onClick={onDeclineClick} />}
          </div>
        </Show>
        <Show when={mentionCount()}>
          <div class={styles.notificationCount}>{mentionCount()}</div>
        </Show>

      </div>
    </Show>
  )
}
