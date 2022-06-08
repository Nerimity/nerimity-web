import styles from "./styles.module.scss";




import FriendItem from "../InboxDrawerFriendItem/InboxDrawerFriendItem";
import { createEffect, createSignal, For, Show, useTransition } from "solid-js";
import { Friend } from "../../chat-api/store/useFriends";
import { FriendStatus } from "../../chat-api/RawData";
import useStore from "../../chat-api/store/useStore";
import { UserStatus } from "../../chat-api/store/useUsers";

const InboxDrawerFriends = () => {
  const [separatedFriends, setSeparatedFriends] = createSignal<ReturnType<typeof separateFriends>>();
  const [pending, startTransition] = useTransition();
  const {friends} = useStore();

  createEffect(() => {
    startTransition(() => {
      setSeparatedFriends(separateFriends(friends.array()));
    })
  });
1

  return (
    <Show when={separatedFriends()} >
      <div class={styles.inboxDrawerFriends}>
        <div class={styles.title}>Requests ({separatedFriends()?.requests.length})</div>
        <For each={separatedFriends()?.requests}>
          {friend => <FriendItem friend={friend} />}
        </For>

        <div class={styles.title}>Online ({separatedFriends()?.onlineFriends.length})</div>
        <For each={separatedFriends()?.onlineFriends}>
          {friend => <FriendItem friend={friend} />}
        </For>
        <div class={styles.title}>Offline ({separatedFriends()?.offlineFriends.length})</div>
        <For each={separatedFriends()?.offlineFriends}>
          {friend => <FriendItem friend={friend} />}
        </For>
      </div>
    </Show>
  )
};

export default InboxDrawerFriends;


function separateFriends(friends: Friend[]) {
  const requests = [];
  const onlineFriends = [];
  const offlineFriends = [];


  for (let i = 0; i < friends.length; i++) {
    const friend = friends[i];
    const user = friend.recipient
    if (friend.status === FriendStatus.PENDING || friend.status === FriendStatus.SENT) {
      requests.push(friend);
      continue;
    }
    if (user.presence?.status !== UserStatus.OFFLINE) {
      onlineFriends.push(friend);
      continue;
    }
    offlineFriends.push(friend);
  }
  return { requests, onlineFriends, offlineFriends };
}