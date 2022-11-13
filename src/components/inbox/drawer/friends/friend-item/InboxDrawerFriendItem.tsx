import styles from "./styles.module.scss";
import { classNames, conditionalClass } from "@/common/classNames";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { Link, useParams } from "@nerimity/solid-router";
import { FriendStatus } from "@/chat-api/RawData";
import { Friend } from "@/chat-api/store/useFriends";
import { User } from "@/chat-api/store/useUsers";
import useStore from "@/chat-api/store/useStore";
import UserPresence from "@/components/user-presence/UserPresence";
import RouterEndpoints from "@/common/RouterEndpoints";
import { Show } from "solid-js";
import ItemContainer from "@/components/ui/Item";
import { styled } from "solid-styled-components";
import Text from "@/components/ui/Text";

export default function InboxDrawerFriendItem(props: { friend?: Friend, user?: User}) {
  const params = useParams();
  const {inbox, mentions} = useStore();


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
    user().openDM();
  }

  const mentionCount = () => mentions.getDmCount(user()!.id);

  const FriendContainer = styled(ItemContainer)`
    padding-left: 10px;
    height: 35px;
    margin-left: 3px;
    margin-right: 3px;

    .username {
      opacity: ${props => props.selected ? 1 : 0.6};
      transition: 0.2s;
    }
  
    &:hover .username {
      opacity: 1;
    }

  `;

  return (
    <Show when={user()}>
      <FriendContainer selected={isSelected()} alert={mentionCount() || showAccept()} onClick={onFriendClick}>

        <Link href={RouterEndpoints.PROFILE(user().id)} class="link">
          <Avatar hexColor={user().hexColor} size={25} />
        </Link>
        <div class={styles.details}>
          <Text class="username">{user().username}</Text>
          <UserPresence userId={user().id} showOffline={false} />
        </div>


        <Show when={showAccept() || showDecline()}>
          <div class={styles.requestButtons}>
            {showAccept() && <Button class={styles.button} iconName="check" onClick={onAcceptClick} />}
            {showDecline() && <Button class={styles.button} iconName="close" color="var(--alert-color)" onClick={onDeclineClick} />}
          </div>
        </Show>
        <Show when={mentionCount()}>
          <div class={styles.notificationCount}>{mentionCount()}</div>
        </Show>

      </FriendContainer>
    </Show>
  )
}
