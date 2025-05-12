import { createStore, reconcile } from "solid-js/store";
import { ActivityStatus, FriendStatus, RawUser } from "../RawData";
import useInbox from "./useInbox";
import {
  closeDMChannelRequest,
  openDMChannelRequest,
} from "../services/UserService";
import useChannels from "./useChannels";
import RouterEndpoints from "../../common/RouterEndpoints";
import { useNavigate } from "solid-navigator";
import { runWithContext } from "@/common/runWithContext";
import env from "@/common/env";
import useAccount from "./useAccount";
import { LastOnlineStatus } from "../events/connectionEventTypes";
import useFriends from "./useFriends";

export enum UserStatus {
  OFFLINE = 0,
  ONLINE = 1,
  LTP = 2, // Looking To Play
  AFK = 3, // Away from keyboard
  DND = 4, // Do not disturb
}

export interface Presence {
  userId: string;
  custom?: string | null;
  status: UserStatus;
  activity?: ActivityStatus;
}

export const avatarUrl = (item: { avatar?: string }): string | null =>
  item?.avatar ? env.NERIMITY_CDN + item?.avatar : null;

export const bannerUrl = (item: { banner?: string }): string | null =>
  item?.banner ? env.NERIMITY_CDN + item?.banner : null;

export type User = {
  presence: () => Presence | undefined;
  inboxChannelId?: string;
  voiceChannelId?: string;
  setInboxChannelId: (this: User, channelId: string | undefined) => void;
  setVoiceChannelId: (this: User, channelId: string | undefined) => void;
  openDM: (this: User) => Promise<void>;
  closeDM: (this: User) => Promise<void>;
  avatarUrl(this: User): string | null;
  update(this: User, update: Partial<RawUser>): void;
} & RawUser;

const [users, setUsers] = createStore<Record<string, User>>({});
const [userPresences, setUserPresences] = createStore<Record<string, Presence>>(
  {}
);

const set = (user: RawUser) =>
  runWithContext(() => {
    const newUser: User = {
      ...user,
      presence: getPresence,
      setInboxChannelId,
      setVoiceChannelId,
      openDM: openDMScoped,
      closeDM,
      avatarUrl: function () {
        return avatarUrl(this);
      },
      update,
    };

    setUsers(user.id, newUser);
  });

function getPresence(this: User) {
  return userPresences[this.id];
}

function setVoiceChannelId(this: User, channelId: string | undefined) {
  setUsers(this.id, "voiceChannelId", channelId);
}
function setInboxChannelId(this: User, channelId: string | undefined) {
  setUsers(this.id, "inboxChannelId", channelId);
}

function update(this: User, update: Partial<RawUser>) {
  setUsers(this.id, update);
}
function openDMScoped(this: User) {
  return openDM(this.id);
}

const openDM = async (userId: string, messageId?: string) =>
  runWithContext(async () => {
    const navigate = useNavigate();
    const inbox = useInbox();
    const channels = useChannels();
    const user = () => get(userId);
    const inboxItem = () => inbox.get(user()?.inboxChannelId!);
    // check if dm already exists
    if (!inboxItem()) {
      const rawInbox = await openDMChannelRequest(userId);
      channels.set(rawInbox.channel);
      inbox.set({ ...rawInbox, channelId: rawInbox.channel.id });
      user()?.setInboxChannelId(rawInbox.channel.id);
    }
    navigate(RouterEndpoints.INBOX_MESSAGES(inboxItem()?.channelId!) + (messageId ?"?messageId=" + messageId : ""));
  });

async function closeDM(this: User) {
  await closeDMChannelRequest(this.inboxChannelId!);
}

const get = (userId: string) => users[userId];

const array = () => Object.values(users);

const setPresence = (userId: string, presence: Partial<Presence>) => {
  const account = useAccount();

  const isSelf = account.user()?.id === userId;

  if (isSelf) {
    account.setUser({
      ...(presence.custom !== undefined
        ? {
          customStatus: presence.custom || undefined,
        }
        : undefined),
    });
  }
  const isOffline =
    presence.status !== undefined && presence.status === UserStatus.OFFLINE;
  if (isOffline && !isSelf) {
    setUserPresences(userId, undefined!);
    return;
  }
  if (presence.custom === null) presence.custom = undefined;
  if (presence.activity === null) presence.activity = undefined;
  setUserPresences(userId, { ...presence, userId });
};

const removePresence = (userId: string) => {
  setPresence(userId, { status: UserStatus.OFFLINE });
};

const reset = () => {
  setUserPresences(reconcile({}));
  setUsers(reconcile({}));
};

const presencesArray = () => Object.values(userPresences);

const updateLastOnlineAt = (userId: string) => {
  const account = useAccount();
  const friends = useFriends();
  const user = get(userId);
  if (!user) return;
  if (
    account.user()?.id === userId &&
    user.lastOnlineStatus !== LastOnlineStatus.HIDDEN
  ) {
    setUsers(userId, "lastOnlineAt", Date.now());
    return;
  }
  if (user.lastOnlineStatus === LastOnlineStatus.FRIENDS_AND_SERVERS) {
    setUsers(userId, "lastOnlineAt", Date.now());
    return;
  }
  if (user.lastOnlineStatus === LastOnlineStatus.FRIENDS) {
    const isFriends = friends.get(userId)?.status === FriendStatus.FRIENDS;
    if (isFriends) {
      setUsers(userId, "lastOnlineAt", Date.now());
      return;
    }
  }
  setUsers(userId, "lastOnlineAt", undefined);
};

export default function useUsers() {
  return {
    array,
    get,
    set,
    setPresence,
    removePresence,
    openDM,
    reset,
    presencesArray,
    updateLastOnlineAt,
  };
}
