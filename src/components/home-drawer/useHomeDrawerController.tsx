import { FriendStatus } from "@/chat-api/RawData";
import useStore from "@/chat-api/store/useStore";
import { createContextProvider } from "@solid-primitives/context";
import { createMemo, createSignal, lazy } from "solid-js";
import AddFriendModal from "./add-friend/AddFriendModal";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { useParams } from "solid-navigator";
import { BlockedUsersModal } from "./BlockedUsersModal";
import { emitDrawerGoToMain } from "@/common/GlobalEvents";
const RemindersModal = lazy(() => import("../reminders-modal/RemindersModal"));

const useFriendsController = () => {
  const store = useStore();

  const [viewAllFriends, setViewAllFriends] = createSignal(false);

  const toggleViewAllFriends = () => {
    setViewAllFriends(!viewAllFriends());
  };

  const { createPortal } = useCustomPortal();

  const friendRequests = createMemo(() => {
    return store.friends
      .array()
      .filter((friend) =>
        [FriendStatus.PENDING, FriendStatus.SENT].includes(friend.status),
      );
  });
  const hasFriendRequests = () => friendRequests().length > 0;

  const onlineFriends = createMemo(() => {
    const online = store.friends.array().filter((friend) => {
      if (friend.status !== FriendStatus.FRIENDS) return;
      if (!friend.recipient()?.presence()?.status) return;
      return true;
    });
    const sorted = online.sort((x, y) =>
      x.recipient()!.username.localeCompare(y.recipient()!.username),
    );
    return sorted;
  });

  const offlineFriends = createMemo(() => {
    return store.friends.array().filter((friend) => {
      if (friend.status !== FriendStatus.FRIENDS) return;
      return !friend.recipient()?.presence()?.status;
    });
  });
  const hasOfflineFriends = () => offlineFriends().length > 0;

  const areFriendsOnline = () => onlineFriends().length > 0;
  const topThreeFriends = () => onlineFriends().slice(0, 3);

  const blockedUsers = createMemo(() => {
    const blockedFriends = store.friends
      .array()
      .filter((friend) => friend.status === FriendStatus.BLOCKED);
    const sorted = blockedFriends.sort((x, y) => y.createdAt - x.createdAt);

    return sorted;
  });

  const showAddFriendModel = () => {
    createPortal?.((close) => <AddFriendModal close={close} />);
  };

  const showBlockedUsersModal = () => {
    createPortal?.((close) => (
      <HomeDrawerControllerProvider>
        <BlockedUsersModal close={close} />{" "}
      </HomeDrawerControllerProvider>
    ));
  };

  return {
    onlineFriends,
    areFriendsOnline,
    topThreeFriends,
    showAddFriendModel,
    hasFriendRequests,
    friendRequests,
    offlineFriends,
    hasOfflineFriends,
    viewAllFriends,
    toggleViewAllFriends,
    blockedUsers,
    showBlockedUsersModal,
  };
};

const useInboxController = () => {
  const store = useStore();
  const params = useParams<{ channelId?: string }>();

  const getMentionUsers = createMemo(() =>
    store.mentions
      .array()
      .filter((m) => {
        const channel = store.channels.get(m?.channelId!);
        return !channel?.serverId;
      })
      .map((m) => store.users.get(m?.userId!)!),
  );

  const inboxUsers = createMemo(() => {
    const mentionUsers = [...getMentionUsers()];

    const inboxArray = store.inbox.array().sort((a, b) => {
      const aTime = a.channel().lastMessagedAt!;
      const bTime = b.channel().lastMessagedAt!;
      return bTime - aTime;
    });

    for (let i = 0; i < inboxArray.length; i++) {
      const inboxItem = inboxArray[i];
      const alreadyExists = mentionUsers.find(
        (u) => u?.id === inboxItem?.channel().recipient()?.id,
      );
      if (!alreadyExists) {
        mentionUsers.push(inboxItem?.channel().recipient()!);
      }
    }
    return mentionUsers;
  });

  const openSavedNotes = () => {
    const id = store.account.user()?.id;
    if (!id) return;
    const user = store.users.get(id);
    user?.openDM();
    emitDrawerGoToMain();
  };
  const isSavedNotesOpened = () => {
    const id = store.account.user()?.id;
    if (!id) return false;
    const user = store.users.get(id);
    if (!user?.inboxChannelId) return;
    return user.inboxChannelId === params.channelId;
  };

  return {
    inboxUsers,
    getMentionUsers,
    openSavedNotes,
    isSavedNotesOpened,
  };
};

const [HomeDrawerControllerProvider, useHomeDrawerController] =
  createContextProvider(() => {
    const store = useStore();
    const { createPortal } = useCustomPortal();
    const friendsController = useFriendsController();
    const inboxController = useInboxController();

    const hasReminders = () => store.account.reminders().length;

    const openReminders = () => {
      createPortal(
        (close) => <RemindersModal close={close} />,
        "reminders-modal",
      );
    };

    return {
      friends: friendsController,
      inbox: inboxController,
      hasReminders,
      openReminders,
    };
  });

export { useHomeDrawerController, HomeDrawerControllerProvider };
