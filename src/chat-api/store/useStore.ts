import useAccount from "./useAccount";
import useChannels from "./useChannels";
import useFriends from "./useFriends";
import useInbox from "./useInbox";
import useMention from "./useMention";
import useMessages from "./useMessages";
import useServerMembers from "./useServerMembers";
import useServerRoles from "./useServerRoles";
import useServers from "./useServers";
import useTabs from "./useTabs";
import useUsers from "./useUsers";

export default function useStore() {
  const account = useAccount();
  const serverMembers = useServerMembers();
  const servers = useServers();
  const users = useUsers();
  const channels = useChannels();
  const tabs = useTabs();
  const messages = useMessages();
  const friends = useFriends();
  const inbox = useInbox();
  const mentions = useMention();
  const serverRoles = useServerRoles();

  return {
    account,
    servers,
    serverMembers,
    serverRoles,
    users,
    channels,
    tabs,
    messages,
    friends,
    inbox,
    mentions
  }
}