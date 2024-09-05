import {
  createEffect,
  createSignal,
  For,
  JSXElement,
  on,
  Show,
} from "solid-js";
import Input from "../ui/input/Input";
import { Modal } from "../ui/modal";
import style from "./QuickTravel.module.scss";
import { matchSorter, defaultBaseSortFn } from "match-sorter";
import useStore from "@/chat-api/store/useStore";
import { createStore, reconcile } from "solid-js/store";
import Avatar from "../ui/Avatar";
import { Server } from "@/chat-api/store/useServers";
import { User } from "@/chat-api/store/useUsers";
import { A, useNavigate } from "solid-navigator";
import RouterEndpoints from "@/common/RouterEndpoints";
import settings from "@/common/Settings";
import { t } from "i18next";
import { CustomLink } from "../ui/CustomLink";
import Icon from "../ui/icon/Icon";
import { ChannelIcon } from "../ChannelIcon";
import { Inbox } from "@/chat-api/store/useInbox";
import { ChannelType } from "@/chat-api/RawData";

interface SearchItem {
  id?: string;
  name: string;
  user?: User;
  server?: Server;
  path?: string;
  icon?: string | (() => JSXElement);
  subText?: string;
  inbox?: Inbox;
}

export function QuickTravel(props: { close: () => void }) {
  const store = useStore();
  const [inputRef, setInputRef] = createSignal<HTMLInputElement>();
  const [inputValue, setInputValue] = createSignal("");

  const [items, setItems] = createStore<SearchItem[]>([]);

  createEffect(
    on(inputRef, () => {
      inputRef()?.focus();
    })
  );

  createEffect(
    on(inputValue, () => {
      const users = store.users.array();
      const channels = store.channels.array();

      const mappedUsers = users.map((user) => {
        const friend = store.friends.get(user.id);
        const inbox = user.inboxChannelId
          ? store.inbox.get(user.inboxChannelId)
          : undefined;
        return {
          id: user.id,
          name: user.username,
          inbox,
          user,
          subText: friend ? "Friend" : inbox ? "Inbox" : "User",
          path: user.inboxChannelId
            ? RouterEndpoints.INBOX_MESSAGES(user.inboxChannelId!)
            : undefined,
        } as SearchItem;
      });

      const mappedChannels: SearchItem[] = channels
        .filter((c) => c.type === ChannelType.SERVER_TEXT)
        .map((channel) => ({
          id: channel.id,
          name: channel.name,
          subText: store.servers.get(channel.serverId!)?.name,
          path: RouterEndpoints.SERVER_MESSAGES(channel.serverId!, channel.id),
          icon: () => <ChannelIcon icon={channel.icon} type={channel.type} />,
        }));

      const mappedSettings: SearchItem[] = settings
        .filter((s) => !s.hide)
        .map((setting) => ({
          icon: setting.icon,
          name: t(setting.name),
          path: `/app/settings/${setting.path}`,
          subText: "Settings",
        }));

      const searched = matchSorter(
        [...mappedUsers, ...mappedChannels, ...mappedSettings],
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

  return (
    <Modal.Root close={props.close} class={style.quickTravelRoot}>
      <Modal.Body class={style.quickTravelBody}>
        <Input
          class={style.quickTravelInput}
          placeholder="Search for servers, channels, users and more!"
          ref={setInputRef}
          onText={setInputValue}
        />

        <div class={style.items}>
          <For each={items}>
            {(item) => <Item close={props.close} item={item} />}
          </For>
        </div>
      </Modal.Body>
    </Modal.Root>
  );
}

const Item = (props: { item: SearchItem; close: () => void }) => {
  return (
    <CustomLink
      onClick={props.close}
      class={style.quickTravelItem}
      href={props.item.path || RouterEndpoints.PROFILE(props.item.id!)}
    >
      <div class={style.icon}>
        <Show when={props.item.user || props.item.server}>
          <Avatar
            resize={40}
            server={props.item.server}
            user={props.item.user}
            size={24}
          />
        </Show>
        <Show when={typeof props.item.icon === "string"}>
          <Icon name={props.item.icon as string} size={24} />
        </Show>
        <Show when={typeof props.item.icon === "function"}>
          {(props.item.icon as () => JSXElement)()}
        </Show>
      </div>
      <div class={style.label}>{props.item.name}</div>
      <div class={style.subText}>{props.item.subText}</div>
    </CustomLink>
  );
};
