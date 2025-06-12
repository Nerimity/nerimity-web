import useAccount from "./useAccount";
import useChannels from "./useChannels";
import useFriends from "./useFriends";
import useInbox from "./useInbox";
import useMention from "./useMention";
import useMessages from "./useMessages";
import useServerMembers from "./useServerMembers";
import useServerRoles from "./useServerRoles";
import useServers from "./useServers";
import useHeader from "./useHeader";
import useUsers from "./useUsers";
import useChannelProperties from "./useChannelProperties";
import { usePosts } from "./usePosts";
import useVoiceUsers from "./useVoiceUsers";
import useTicket from "./UseTicket";

interface Store {
  account: ReturnType<typeof useAccount>;
  serverMembers: ReturnType<typeof useServerMembers>;
  servers: ReturnType<typeof useServers>;
  users: ReturnType<typeof useUsers>;
  channels: ReturnType<typeof useChannels>;
  header: ReturnType<typeof useHeader>;
  messages: ReturnType<typeof useMessages>;
  friends: ReturnType<typeof useFriends>;
  inbox: ReturnType<typeof useInbox>;
  mentions: ReturnType<typeof useMention>;
  serverRoles: ReturnType<typeof useServerRoles>;
  channelProperties: ReturnType<typeof useChannelProperties>;
  posts: ReturnType<typeof usePosts>;
  voiceUsers: ReturnType<typeof useVoiceUsers>;
  tickets: ReturnType<typeof useTicket>;
}

let store: Store | null = null;

export default function useStore() {
  if (store) return store;
  const account = useAccount();
  const serverMembers = useServerMembers();
  const servers = useServers();
  const users = useUsers();
  const channels = useChannels();
  const header = useHeader();
  const messages = useMessages();
  const friends = useFriends();
  const inbox = useInbox();
  const mentions = useMention();
  const serverRoles = useServerRoles();
  const channelProperties = useChannelProperties();
  const posts = usePosts();
  const voiceUsers = useVoiceUsers();

  const tickets = useTicket();

  const obj = {
    account,
    servers,
    serverMembers,
    serverRoles,
    users,
    channels,
    header,
    messages,
    friends,
    inbox,
    mentions,
    channelProperties,
    posts,
    voiceUsers,
    tickets,
  } satisfies Store;

  store = obj;

  window.store = store;

  return obj;
}
