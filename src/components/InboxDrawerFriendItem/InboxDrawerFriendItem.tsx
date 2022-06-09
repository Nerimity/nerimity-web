import styles from "./styles.module.scss";
import { classNames, conditionalClass } from "../../common/classNames";
import Avatar from "../Avatar/Avatar";
import CustomButton from "../CustomButton/CustomButton";
import RouterEndpoints from "../../common/RouterEndpoints";
import { useNavigate, useParams } from "solid-app-router";
import { FriendStatus } from "../../chat-api/RawData";
import { Friend } from "../../chat-api/store/useFriends";
import { User } from "../../chat-api/store/useUsers";
import useStore from "../../chat-api/store/useStore";

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


  const onFriendClick = async () => {
    if (!inboxItem()) {
      await user().openDM();
      if (!inboxItem()) return;
    }

    navigate(RouterEndpoints.INBOX_MESSAGES(inboxItem().channelId));
  }
  


  return (
    <div class={classNames(styles.friendItem, conditionalClass(isFriendRequest(), styles.requestItem), conditionalClass(isSelected(), styles.selected))} onClick={onFriendClick}>
      <Avatar hexColor={user().hexColor} size={25} />
      <div class={styles.username}>{user().username}</div>
      <div class={styles.requestButtons}>
        {showAccept() && <CustomButton class={styles.button} iconName="check" onClick={onAcceptClick} />}
        {showDecline() && <CustomButton class={styles.button} iconName="close" color="var(--alert-color)" onClick={onDeclineClick} />}
      </div>
      
    </div>
  )
}
