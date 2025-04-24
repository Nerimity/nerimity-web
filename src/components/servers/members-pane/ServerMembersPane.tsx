import styles from "./styles.module.scss";

import { useParams } from "solid-navigator";
import { createSignal, For, onMount } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import { Table, TableSort, TableSortMode } from "@/components/ui/table/Table";
import { formatTimestamp, fullDateTime } from "@/common/date";
import { ServerMember } from "@/chat-api/store/useServerMembers";
import Avatar from "@/components/ui/Avatar";

export default function Pane() {
  const params = useParams<{ serverId: string }>();
  const { header, serverMembers } = useStore();

  const [sort, setSort] = createSignal<TableSort>({ index: 1, mode: "desc" });

  const members = () =>
    serverMembers.array(params.serverId!).sort((a, b) => {
      if (sort().index === 0) {
        const aNick = a?.nickname || a?.user().username;
        const bNick = b?.nickname || b?.user().username;
        if (sort().mode === "desc") return bNick?.localeCompare(aNick);
        if (sort().mode === "asc") return aNick?.localeCompare(bNick);
      }
      if (sort().index === 1) {
        if (sort().mode === "desc") return b?.joinedAt - a?.joinedAt;
        if (sort().mode === "asc") return a?.joinedAt - b?.joinedAt;
      }
      if (sort().index === 2) {
        const userA = a?.user()!;
        const userB = b?.user()!;
        if (sort().mode === "desc") return userB.joinedAt - userA.joinedAt;
        if (sort().mode === "asc") return userA.joinedAt - userB.joinedAt;
      }
    });

  onMount(() => {
    document.querySelector(".main-pane-container")?.scrollTo(0, 0);
    header.updateHeader({
      title: "Members",
      serverId: params.serverId!,
      iconName: "group",
    });
  });

  const onHeaderClick = (sort: TableSort) => {
    setSort(sort);
  };

  return (
    <>
      <div class={styles.pane}>
        <Table.Root
          headers={["Member", "Joined", "Joined Nerimity"]}
          sortableHeaderIndexes={[0, 1, 2]}
          onHeaderClick={onHeaderClick}
          sort={sort()}
        >
          <For each={members()}>
            {(member) => (
              <Table.Item>
                <MemberField member={member!} />
                <Table.Field mobileTitle="Joined">
                  {formatTimestamp(member?.joinedAt)}
                </Table.Field>
                <Table.Field mobileTitle="Joined Nerimity">
                  {formatTimestamp(member?.user().joinedAt)}
                </Table.Field>
              </Table.Item>
            )}
          </For>
        </Table.Root>
      </div>
    </>
  );
}

function MemberField(props: { member: ServerMember }) {
  const user = () => props.member.user();
  return (
    <Table.Field>
      <div class={styles.memberField}>
        <Avatar user={user()} size={38} />
        <div>
          <div class={styles.nickname}>
            {props.member.nickname || user().username}
          </div>
          <div class={styles.usernameAndTag}>
            <span>{user().username}</span>:<span>{user().tag}</span>
          </div>
        </div>
      </div>
    </Table.Field>
  );
}
