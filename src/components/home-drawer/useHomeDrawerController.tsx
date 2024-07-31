import { FriendStatus } from "@/chat-api/RawData";
import useStore from "@/chat-api/store/useStore";
import { createContextProvider } from "@solid-primitives/context";
import { createContext, createMemo, JSXElement, useContext } from "solid-js";
import AddFriendModal from "../inbox/drawer/add-friend/AddFriendModal";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";

const [HomeDrawerControllerProvider, useHomeDrawerController] =
  createContextProvider(() => {
    const store = useStore();
    const { createPortal } = useCustomPortal();

    const onlineFriends = createMemo(() => {
      const online = store.friends.array().filter((friend) => {
        if (friend.status !== FriendStatus.FRIENDS) return;
        if (!friend.recipient()?.presence()?.status) return;
        return true;
      });
      const sorted = online.sort((x, y) =>
        x.recipient()!.username.localeCompare(y.recipient()!.username)
      );
      return sorted;
    });

    const areFriendsOnline = () => onlineFriends().length > 0;
    const topThreeFriends = () => onlineFriends().slice(0, 3);

    const showAddFriendModel = () => {
      createPortal?.((close) => <AddFriendModal close={close} />);
    };

    return {
      onlineFriends,
      areFriendsOnline,
      topThreeFriends,
      showAddFriendModel,
    };
  }, null!);

export { useHomeDrawerController, HomeDrawerControllerProvider };
