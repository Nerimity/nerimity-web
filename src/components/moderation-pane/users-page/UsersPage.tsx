import style from "./UserPage.module.scss";
import { RawUser } from "@/chat-api/RawData";
import {
  getUsers,
  ModerationUser,
} from "@/chat-api/services/ModerationService";
import { formatTimestamp } from "@/common/date";
import { usePromise } from "@/common/usePromise";
import Avatar from "@/components/ui/Avatar";
import { Item } from "@/components/ui/Item";
import { Table, TableSort } from "@/components/ui/table/Table";
import { createSignal, For } from "solid-js";

const NameField = (props: { user: RawUser }) => {
  return (
    <div class={style.nameField}>
      <Avatar user={props.user} size={28} />
      {props.user.username}:{props.user.tag}
    </div>
  );
};

const Tag = (props: { tag: string; color: string }) => (
  <span class={style.tag} style={{ "--color": props.color }}>
    {props.tag}
  </span>
);

const TagsField = (props: { user: ModerationUser }) => {
  const isBot = props.user.bot;
  const isSuspended = props.user.suspension;
  const shadowBanned = props.user.shadowBan;

  if (!isBot && !isSuspended && !shadowBanned) return null;

  return (
    <div class={style.tagsField}>
      {isBot ? <Tag tag="Bot" color="var(--primary-color)" /> : ""}
      {isSuspended ? <Tag tag="Suspended" color="var(--alert-color)" /> : ""}
      {shadowBanned ? (
        <Tag tag="Shadow Banned" color="var(--alert-color)" />
      ) : (
        ""
      )}
    </div>
  );
};

export default function UsersPage() {
  const [sort, setSort] = createSignal<TableSort>({
    headerId: "joined",
    mode: "desc",
  });
  const [selectedFilter, setSelectedFilter] = createSignal<string>("all");

  const headerIdToOrderBy = (id: string) => {
    switch (id) {
      case "name":
        return "username";
      case "joined":
        return "joinedAt";
    }
  };
  const users = usePromise(() =>
    getUsers(50, undefined, {
      orderBy: headerIdToOrderBy(sort().headerId),
      order: sort().mode,
      filters: selectedFilter(),
    })
  );

  return (
    <div class={style.usersPage}>
      <h1>Users</h1>

      <div class={style.filtersContainer}>
        <div>Filter By</div>
        <div class={style.filters}>
          <Item.Root
            handlePosition="bottom"
            onClick={() => setSelectedFilter("all")}
            selected={selectedFilter() === "all"}
          >
            <Item.Label>All</Item.Label>
          </Item.Root>
          <Item.Root
            handlePosition="bottom"
            onClick={() => setSelectedFilter("suspension")}
            selected={selectedFilter() === "suspension"}
          >
            <Item.Label>Suspended</Item.Label>
          </Item.Root>
          <Item.Root
            handlePosition="bottom"
            onClick={() => setSelectedFilter("shadowBan")}
            selected={selectedFilter() === "shadowBan"}
          >
            <Item.Label>Shadow Banned</Item.Label>
          </Item.Root>
          <Item.Root
            onClick={() => setSelectedFilter("bot")}
            handlePosition="bottom"
            selected={selectedFilter() === "bot"}
          >
            <Item.Label>Bots</Item.Label>
          </Item.Root>
        </div>
      </div>

      <Table.Root
        // "Name", "Joined", "Tags"
        headers={[
          {
            id: "name",
            title: "Name",
          },
          {
            id: "joined",
            title: "Joined",
          },
          {
            id: "tags",
            title: "Tags",
          },
        ]}
        sort={sort()}
        sortableHeaderIds={["name", "joined"]}
        onHeaderClick={setSort}
      >
        <For each={users.data() || []}>
          {(user) => (
            <Table.Item href={`./${user.id}`}>
              <Table.Field>
                <NameField user={user} />
              </Table.Field>
              <Table.Field mobileTitle="Joined">
                <div>{formatTimestamp(user.joinedAt)}</div>
              </Table.Field>
              <Table.Field>
                <TagsField user={user} />
              </Table.Field>
            </Table.Item>
          )}
        </For>
      </Table.Root>
    </div>
  );
}
