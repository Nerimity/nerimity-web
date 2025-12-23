import style from "./styles.module.scss";

import { useParams } from "solid-navigator";
import { createSignal, For, onMount, Show } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import { Table, TableSort } from "@/components/ui/table/Table";
import { formatTimestamp } from "@/common/date";
import { ServerMember } from "@/chat-api/store/useServerMembers";
import Avatar from "@/components/ui/Avatar";
import MemberContextMenu from "@/components/member-context-menu/MemberContextMenu";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import Input from "@/components/ui/input/Input";
import { Item } from "@/components/ui/Item";
import { t } from "@nerimity/i18lite";

export default function Pane() {
  const params = useParams<{ serverId: string }>();
  const { header, serverMembers } = useStore();
  const { createRegisteredPortal, openedPortals, closePortalById } =
    useCustomPortal();
  const [filter, setFilter] = createSignal<"ALL" | "24H">("24H");
  const [contextMenu, setContextMenu] = createSignal<{
    position: { x: number; y: number };
    serverId: string;
    userId: string;
  } | null>(null);

  const [search, setSearch] = createSignal("");

  const [sort, setSort] = createSignal<TableSort>({
    headerId: "joined",
    mode: "desc",
  });

  const members = () =>
    (serverMembers.array(params.serverId!) as ServerMember[])
      .sort((a, b) => {
        if (sort().headerId === "member") {
          const aNick = a?.nickname || a?.user().username;
          const bNick = b?.nickname || b?.user().username;
          if (sort().mode === "desc") return bNick?.localeCompare(aNick);
          if (sort().mode === "asc") return aNick?.localeCompare(bNick);
        }
        if (sort().headerId === "joined") {
          if (sort().mode === "desc") return b?.joinedAt - a?.joinedAt;
          if (sort().mode === "asc") return a?.joinedAt - b?.joinedAt;
        }
        if (sort().headerId === "joinedNerimity") {
          const userA = a?.user()!;
          const userB = b?.user()!;
          if (sort().mode === "desc") return userB.joinedAt! - userA.joinedAt!;
          if (sort().mode === "asc") return userA.joinedAt! - userB.joinedAt!;
        }
        return 0;
      })
      .filter((m) => {
        if (filter() === "24H") {
          if (m?.joinedAt < Date.now() - 86400000) return false;
        }
        if (!search().trim()) return true;
        const nickname = m?.nickname;
        const username = m?.user().username;
        const val = search().toLowerCase().trim();
        if (nickname?.toLowerCase().includes(val.toLowerCase())) {
          return true;
        }
        if (username?.toLowerCase().includes(val.toLowerCase())) {
          return true;
        }
        return false;
      });

  onMount(() => {
    document.querySelector(".main-pane-container")?.scrollTo(0, 0);
    header.updateHeader({
      title: t("informationDrawer.members"),
      serverId: params.serverId!,
      iconName: "group",
    });
  });

  const onHeaderClick = (sort: TableSort) => {
    setSort(sort);
  };

  const onClick = (e: MouseEvent, member: ServerMember) => {
    const openedPortal = openedPortals().find((p) =>
      p.id?.startsWith("profile-pane-flyout-")
    )?.id;
    if (openedPortal && !openedPortal.endsWith(member.userId)) {
      closePortalById(openedPortal);
    }

    createRegisteredPortal(
      "ProfileFlyout",
      {
        triggerEl: e.target as HTMLElement,
        position: { left: e.clientX, top: e.clientY },
        serverId: member.serverId,
        close: close,
        userId: member.userId,
      },
      "profile-pane-flyout-" + member.userId,
      true
    );
  };

  return (
    <>
      <Show when={contextMenu()}>
        <MemberContextMenu
          {...contextMenu()!}
          onClose={() => setContextMenu(null)}
        />
      </Show>
      <div class={style.pane}>
        <Input
          placeholder={t("explore.search")}
          class={style.search}
          onText={setSearch}
          value={search()}
        />
        <div>{t("channelDrawer.members.filter.header")}</div>
        <div class={style.filter}>
          <Item.Root
            handlePosition="bottom"
            selected={filter() === "ALL"}
            onClick={() => setFilter("ALL")}
          >
            <Item.Icon>group</Item.Icon>
            <Item.Label>{t("explore.servers.filterAll")}</Item.Label>
          </Item.Root>
          <Item.Root
            handlePosition="bottom"
            selected={filter() === "24H"}
            onClick={() => setFilter("24H")}
          >
            <Item.Icon>schedule</Item.Icon>
            <Item.Label>{t("channelDrawer.members.filter.24hours")}</Item.Label>
          </Item.Root>
        </div>
        <Table.Root
          // "Member", "Joined", "Joined Nerimity"
          headers={[
            { title: t("channelDrawer.members.sort.member"), id: "member" },
            { title: t("channelDrawer.members.sort.joined"), id: "joined" },
            { title: t("channelDrawer.members.sort.joinedNerimity"), id: "joinedNerimity" },
          ]}
          sortableHeaderIds={["member", "joined", "joinedNerimity"]}
          onHeaderClick={onHeaderClick}
          sort={sort()}
        >
          <For each={members()}>
            {(member) => (
              <Table.Item
                class="trigger-profile-flyout"
                onClick={(e) => onClick(e, member!)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({
                    position: { x: e.clientX, y: e.clientY },
                    serverId: params.serverId!,
                    userId: member.userId,
                  });
                }}
              >
                <MemberField member={member!} />
                <Table.Field mobileTitle={t("channelDrawer.members.sort.joined")}>
                  {formatTimestamp(member?.joinedAt!)}
                </Table.Field>
                <Table.Field mobileTitle={t("channelDrawer.members.sort.joinedNerimity")}>
                  {formatTimestamp(member?.user().joinedAt!)}
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
      <div class={style.memberField}>
        <Avatar user={user()} size={38} />
        <div>
          <div class={style.nickname}>
            {props.member.nickname || user().username}
          </div>
          <div class={style.usernameAndTag}>
            <span>{user().username}</span>:<span>{user().tag}</span>
          </div>
        </div>
      </div>
    </Table.Field>
  );
}
