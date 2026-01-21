import { RawUser } from "@/chat-api/RawData";
import { createEffect, createSignal, For, on, Show } from "solid-js";
import { selectedUsers } from "./selectedUsers";
import { User, UserPaneContainer } from "./UserComponents";
import { useModerationUserSuspendedListener } from "@/common/GlobalEvents";
import { getUsers, searchUsers } from "@/chat-api/services/ModerationService";
import Input from "../ui/input/Input";
import Button from "../ui/Button";
import { FlexRow } from "../ui/Flexbox";
import Text from "../ui/Text";
import { styled } from "solid-styled-components";
import { A } from "solid-navigator";

const ListContainer = styled("div")`
  display: flex;
  flex-direction: column;

  margin-top: 10px;
  overflow: auto;
`;

export function UsersPane(props: {
  search?: string;
  hideSearchBar?: boolean;
  title?: string;
  noMargin?: boolean;
}) {
  const LIMIT = 30;
  const [users, setUsers] = createSignal<RawUser[]>([]);
  const [afterId, setAfterId] = createSignal<string | undefined>(undefined);
  const [loadMoreClicked, setLoadMoreClicked] = createSignal(false);
  const [search, setSearch] = createSignal(props.search || "");

  const [showAll, setShowAll] = createSignal(false);

  const moderationUserSuspendedListener = useModerationUserSuspendedListener();

  moderationUserSuspendedListener((suspension) => {
    setUsers(
      users().map((u) => {
        const wasSuspended = selectedUsers().find((su) => su.id === u.id);
        if (!wasSuspended) return u;
        return { ...u, suspension };
      }),
    );
  });

  createEffect(
    on(afterId, async () => {
      if (search()) {
        return fetchSearch();
      }
      fetchUsers();
    }),
  );

  const onLoadMoreClick = () => {
    const user = users()[users().length - 1];
    setAfterId(user?.id);
  };

  const firstFive = () => users().slice(0, 5);

  let timeout: number | null = null;
  const onSearchText = (text: string) => {
    setSearch(text);
    timeout && clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      setAfterId(undefined);
      setUsers([]);
      if (!search().trim()) {
        fetchUsers();
        return;
      }
      setShowAll(true);
      fetchSearch();
    }, 1000);
  };

  const fetchSearch = () => {
    setLoadMoreClicked(true);
    searchUsers(search(), LIMIT, afterId())
      .then((newUsers) => {
        setUsers([...users(), ...newUsers]);
        if (newUsers.length >= LIMIT) setLoadMoreClicked(false);
      })
      .catch(() => setLoadMoreClicked(false));
  };

  const fetchUsers = () => {
    setLoadMoreClicked(true);
    getUsers(LIMIT, afterId())
      .then((newUsers) => {
        setUsers([...users(), ...newUsers]);
        if (newUsers.length >= LIMIT) setLoadMoreClicked(false);
      })
      .catch(() => setLoadMoreClicked(false));
  };

  return (
    <UserPaneContainer
      class="pane users"
      expanded={showAll()}
      style={{
        ...(!showAll() ? { height: "initial" } : undefined),
        ...(props.noMargin ? { margin: 0 } : {}),
      }}
    >
      <Show when={!props.hideSearchBar}>
        <Input
          placeholder="Search"
          margin={[10, 10, 10, 30]}
          onText={onSearchText}
          value={search()}
        />
      </Show>
      <Show when={props.hideSearchBar}>
        <div style={{ height: "10px" }} />
      </Show>
      <FlexRow gap={5} itemsCenter style={{ "padding-left": "10px" }}>
        <Button
          iconName="add"
          iconSize={14}
          padding={4}
          onClick={() => setShowAll(!showAll())}
        />
        <A href="/app/moderation/users">
          <Text>{props.title || "Registered Users"}</Text>
        </A>
      </FlexRow>
      <ListContainer class="list">
        <For each={!showAll() ? firstFive() : users()}>
          {(user) => <User user={user} />}
        </For>
        <Show when={showAll() && !loadMoreClicked()}>
          <Button
            iconName="refresh"
            label="Load More"
            onClick={onLoadMoreClick}
          />
        </Show>
      </ListContainer>
    </UserPaneContainer>
  );
}
