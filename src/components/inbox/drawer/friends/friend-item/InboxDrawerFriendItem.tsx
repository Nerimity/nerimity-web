import styles from "./styles.module.scss";
import { classNames, conditionalClass } from "@/common/classNames";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { A, useNavigate, useParams } from "solid-navigator";
import { FriendStatus } from "@/chat-api/RawData";
import { Friend } from "@/chat-api/store/useFriends";
import { User } from "@/chat-api/store/useUsers";
import useStore from "@/chat-api/store/useStore";
import UserPresence from "@/components/user-presence/UserPresence";
import RouterEndpoints from "@/common/RouterEndpoints";
import { createSignal, Show } from "solid-js";
import ItemContainer from "@/components/ui/Item";
import { styled } from "solid-styled-components";
import Text from "@/components/ui/Text";
import { useWindowProperties } from "@/common/useWindowProperties";
import { emitDrawerGoToMain } from "@/common/GlobalEvents";

export default function InboxDrawerFriendItem(props: {
  friend?: Friend;
  user?: User;
  isInboxTab?: boolean;
}) {
  const params = useParams();
  const { inbox, mentions, channels } = useStore();
  const navigate = useNavigate();
  const [hovered, setHovered] = createSignal(false);
  const { isMobileAgent } = useWindowProperties();

  const user = () => {
    if (props.friend) {
      return props.friend.recipient();
    } else {
      return props.user!;
    }
  };

  const inboxItem = () => inbox.get(user()?.inboxChannelId!);

  const isFriendRequest = () =>
    props.friend?.status === FriendStatus.PENDING ||
    props.friend?.status === FriendStatus.SENT;
  const isSelected = () =>
    inboxItem() && params.channelId === inboxItem().channelId;

  const showAccept = () => props.friend?.status === FriendStatus.PENDING;
  const showDecline = () =>
    props.friend?.status === FriendStatus.PENDING ||
    props.friend?.status === FriendStatus.SENT;

  const onAcceptClick = () => {
    props.friend?.accept();
  };
  const onDeclineClick = () => {
    props.friend?.remove();
  };

  const onCloseDMClick = async () => {
    const channel = channels.get(user()?.inboxChannelId!);
    channel?.dismissNotification();
    user()?.closeDM();
    if (params.channelId === user()?.inboxChannelId) {
      navigate("/app");
    }
  };

  const onFriendClick = async (e: any) => {
    if (e.target.closest(".link")) return;
    if (e.target.closest("." + styles.button)) return;
    user()?.openDM();
    emitDrawerGoToMain();
  };

  const mentionCount = () => mentions.getDmCount(user()!.id);

  const FriendContainer = styled(ItemContainer)`
    padding-left: 10px;
    height: 45px;
    margin-left: 3px;
    margin-right: 3px;

    .username {
      opacity: ${(props) => (props.selected ? 1 : 0.6)};
      transition: 0.2s;
      font-size: 16px;
    }

    &:hover .username {
      opacity: 1;
    }
  `;

  const showCloseButton = () => {
    if (!props.isInboxTab) return false;
    if (isMobileAgent()) {
      if (isSelected()) return true;
      return false;
    }
    return props.user?.inboxChannelId && hovered();
  };

  return (
    <Show when={user()}>
      <FriendContainer
        onmouseenter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        selected={isSelected()}
        alert={mentionCount() || showAccept()}
        onClick={onFriendClick}
      >
        <A href={RouterEndpoints.PROFILE(user().id)} class="link">
          <Avatar animate={hovered()} user={user()} size={25} />
        </A>
        <div class={styles.details}>
          <div class="username">{user().username}</div>
          <UserPresence
            userId={user().id}
            showOffline={false}
            animate={hovered()}
          />
        </div>

        <Show when={showAccept() || showDecline()}>
          <div class={styles.requestButtons}>
            {showAccept() && (
              <Button
                class={styles.button}
                iconName="check"
                onClick={onAcceptClick}
              />
            )}
            {showDecline() && (
              <Button
                class={styles.button}
                iconName="close"
                color="var(--alert-color)"
                onClick={onDeclineClick}
              />
            )}
          </div>
        </Show>
        <Show when={mentionCount()}>
          <div class={styles.notificationCount}>{mentionCount()}</div>
        </Show>

        <Show when={showCloseButton()}>
          <Button
            class={styles.button}
            iconSize={12}
            color="var(--alert-color)"
            iconName="close"
            onClick={onCloseDMClick}
          />
        </Show>
      </FriendContainer>
    </Show>
  );
}
