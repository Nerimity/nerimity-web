import { createEffect, createSignal, For, on, Show } from "solid-js";
import Input from "../ui/input/Input";
import { Modal } from "../ui/modal";
import style from "./QuickTravel.module.scss";
import { matchSorter, defaultBaseSortFn } from "match-sorter";
import useStore from "@/chat-api/store/useStore";
import { createStore, reconcile } from "solid-js/store";
import Avatar from "../ui/Avatar";
import { Server } from "@/chat-api/store/useServers";
import { User } from "@/chat-api/store/useUsers";
import { useNavigate } from "solid-navigator";
import RouterEndpoints from "@/common/RouterEndpoints";

interface SearchItem {
  id: string;
  name: string;
  user?: User;
  server?: Server;
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

      const mappedUsers = users.map(
        (user) =>
          ({
            id: user.id,
            name: user.username,
            user,
          } as SearchItem)
      );

      const mappedChannels: SearchItem[] = channels.map((channel) => ({
        id: channel.id,
        name: channel.name,
      }));

      const searched = matchSorter(
        [...mappedUsers, ...mappedChannels],
        inputValue(),
        {
          keys: ["username", "name"],
        }
      ).sort((a, b) => {
        const inboxA = !!store.inbox.get(a.id);
        const inboxB = !!store.inbox.get(b.id);

        const friendA = !!store.friends.get(a.id);
        const friendB = !!store.friends.get(b.id);

        if (inboxA && !inboxB) return -1;
        if (!inboxA && inboxB) return 1;

        if (friendA && !friendB) return -1;
        if (!friendA && friendB) return 1;

        return 0;
      });

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
          <For each={items}>{(item) => <Item item={item} />}</For>
        </div>
      </Modal.Body>
    </Modal.Root>
  );
}

const Item = (props: { item: SearchItem }) => {
  const navigate = useNavigate();
  return (
    <div
      class={style.quickTravelItem}
      onClick={() => navigate(RouterEndpoints.PROFILE(props.item.id))}
    >
      <Show when={props.item.user || props.item.server}>
        <Avatar
          resize={40}
          server={props.item.server}
          user={props.item.user}
          size={24}
        />
      </Show>
      <div class={style.label}>{props.item.name}</div>
    </div>
  );
};
