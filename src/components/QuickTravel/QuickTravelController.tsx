import { ChannelType } from "@/chat-api/RawData";
import useStore from "@/chat-api/store/useStore";
import { createContextProvider } from "@solid-primitives/context";
import {
  createEffect,
  createMemo,
  createSignal,
  JSXElement,
  on,
  onCleanup,
  onMount,
} from "solid-js";
import { User } from "@/chat-api/store/useUsers";
import { Server } from "@/chat-api/store/useServers";
import { Inbox } from "@/chat-api/store/useInbox";
import { createStore, reconcile } from "solid-js/store";
import { matchSorter } from "match-sorter";
import RouterEndpoints from "@/common/RouterEndpoints";
import { ChannelIcon } from "../ChannelIcon";
import { t } from "i18next";
import { isExperimentEnabled } from "@/common/experiments";
import settings from "@/common/Settings";

export interface SearchItem {
  id?: string;
  name: string;
  user?: User;
  server?: Server;
  path?: string;
  icon?: string | (() => JSXElement);
  subText?: string;
  inbox?: Inbox;
}

const [QuickTravelControllerProvider, useQuickTravelController] =
  createContextProvider(() => {
    const store = useStore();
    const [inputRef, setInputRef] = createSignal<HTMLInputElement>();
    const [inputValue, setInputValue] = createSignal("");
    const [selectedIndex, setSelectedIndex] = createSignal(0);
    const [items, setItems] = createStore<SearchItem[]>([]);

    createEffect(
      on(inputRef, () => {
        inputRef()?.focus();
      })
    );

    const mappedUsers = createMemo(() => {
      const users = store.users.array();

      return users.map((user) => {
        const friend = store.friends.get(user.id);
        const inbox = user.inboxChannelId
          ? store.inbox.get(user.inboxChannelId)
          : undefined;
        return {
          id: user.id,
          name: user.username,
          inbox,
          user,
          subText: friend ? t("inbox.drawer.searchResults.friend") : inbox ? t("inbox.drawer.searchResults.inbox") : t("inbox.drawer.searchResults.user"),
          path: user.inboxChannelId
            ? RouterEndpoints.INBOX_MESSAGES(user.inboxChannelId!)
            : undefined,
        } as SearchItem;
      });
    });

    const mappedChannels = createMemo(() => {
      const channels = store.channels.serverChannelsWithPerm();

      return channels
        .filter((c) => c.type === ChannelType.SERVER_TEXT)
        .map((channel) => ({
          id: channel.id,
          name: channel.name,
          subText: store.servers.get(channel.serverId!)?.name,
          path: RouterEndpoints.SERVER_MESSAGES(channel.serverId!, channel.id),
          icon: () => <ChannelIcon icon={channel.icon} type={channel.type} />,
        }));
    });

    createEffect(
      on([inputValue, mappedChannels, mappedUsers], () => {
        setSelectedIndex(0);
        const mappedSettings: SearchItem[] = settings
          .filter((s) => !s.hide)
          .filter((s) =>
            !s.experimentId ? true : isExperimentEnabled(s.experimentId)
          )
          .map((setting) => ({
            icon: setting.icon,
            name: t(setting.name),
            path: `/app/settings/${setting.path}`,
            subText: t("inbox.drawer.searchResults.settings"),
          }));

        const searched = matchSorter(
          [...mappedUsers(), ...mappedChannels(), ...mappedSettings],
          inputValue(),
          {
            keys: ["name"],
          }
        )
          .sort((a, b) => {
            const inboxA = "inbox" in a && !!a.inbox;
            const inboxB = "inbox" in b && !!b.inbox;

            const friendA = "id" in a && !!store.friends.get(a.id!);
            const friendB = "id" in b && !!store.friends.get(b.id!);

            if (inboxA && !inboxB) return -1;
            if (!inboxA && inboxB) return 1;

            if (friendA && !friendB) return -1;
            if (!friendA && friendB) return 1;

            return 0;
          })
          .slice(0, 20);

        setItems(reconcile(searched));
      })
    );

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (selectedIndex() < items.length - 1) {
          setSelectedIndex(selectedIndex() + 1);
        } else {
          setSelectedIndex(0);
        }
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (selectedIndex() > 0) {
          setSelectedIndex(selectedIndex() - 1);
        } else {
          setSelectedIndex(items.length - 1);
        }
      }
    };

    onMount(() => {
      document.addEventListener("keydown", onKeyDown);
      onCleanup(() => {
        document.removeEventListener("keydown", onKeyDown);
      });
    });

    return {
      setInputRef,
      inputValue,
      setInputValue,
      items,
      selectedIndex,
      setSelectedIndex,
    };
  });

export { useQuickTravelController, QuickTravelControllerProvider };
