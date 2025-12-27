import style from "./styles.module.scss";
import { useParams } from "solid-navigator";
import { createSignal, For, onMount, Show } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import { Table, TableSort } from "@/components/ui/table/Table";
import { formatTimestamp } from "@/common/date";
import { ServerMember } from "@/chat-api/store/useServerMembers";
import Avatar from "@/components/ui/Avatar";
import MemberContextMenu, { ServerMemberRoleModal } from "@/components/member-context-menu/MemberContextMenu";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import Input from "@/components/ui/input/Input";
import { Item } from "@/components/ui/Item";
import { t } from "@nerimity/i18lite";
import { Emoji } from "@/components/ui/Emoji";
import Icon from "@/components/ui/icon/Icon";
import { ROLE_PERMISSIONS } from "@/chat-api/Bitwise";

export default function Pane() {
  const params = useParams<{ serverId: string }>();
  const { header, serverMembers, account } = useStore();
  const { createRegisteredPortal, openedPortals, closePortalById, createPortal, } = 
    useCustomPortal();
  const [filter, setFilter] = createSignal<"ALL" | "24H">("ALL");
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

  const accountMember = () =>
    params.serverId
      ? serverMembers.get(params.serverId, account.user()?.id!)
      : undefined;

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

  const showRoleModal = (member: ServerMember) => {
    createPortal?.((close) => (
      <ServerMemberRoleModal
        close={close}
        userId={member.userId}
        serverId={member.serverId}
      />
    ));
  };

  const onMemberClick = (e: MouseEvent, member: ServerMember) => {
    if ((e.target as HTMLElement).closest(`.${style.roleAddButton}`)) return;

    const openedPortal = openedPortals().find((p) =>
      p.id?.startsWith("profile-pane-flyout-")
    )?.id;
    if (openedPortal && !openedPortal.endsWith(member.userId))
      closePortalById(openedPortal);

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
        <div class={style.actionBar}>
          <div class={style.searchContainer}>
            <span class={style.filterLabel}>{t("explore.search")}</span>
            <Input
              placeholder={t("explore.search")}
              class={style.search}
              onText={setSearch}
              value={search()}
            />
          </div>

          <div class={style.filterSection}>
            <span class={style.filterLabel}>
              {t("channelDrawer.members.filter.header")}
            </span>
            <div class={style.filterContainer}>
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
                <Item.Label>
                  {t("channelDrawer.members.filter.24hours")}
                </Item.Label>
              </Item.Root>
            </div>
          </div>
        </div>

        <Table.Root
          headers={[
            { title: t("channelDrawer.members.sort.member"), id: "member" },
            { title: t("channelDrawer.members.sort.joined"), id: "joined" },
            { title: t("channelDrawer.members.sort.joinedNerimity"), id: "joinedNerimity" },
            { title: t("servers.settings.drawer.roles"), id: "roles" },
          ]}
          sortableHeaderIds={["member", "joined", "joinedNerimity"]}
          onHeaderClick={(s) => setSort(s)}
          sort={sort()}
        >
          <For each={members()}>
            {(member) => {
              const roles = () => member?.roles(true) || [];

              return (
                <Table.Item
                  onClick={(e) => onMemberClick(e, member!)}
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
                  <Table.Field>
                    {formatTimestamp(member?.joinedAt!)}
                  </Table.Field>
                  <Table.Field>
                    {formatTimestamp(member?.user().joinedAt!)}
                  </Table.Field>

                  <Table.Field>
                    <div class={style.rolesList}>
                      <For each={roles().slice(0, 3)}>
                        {(role) => (
                          <div class={style.nerimityRoleBadge}>
                            <Show when={role?.icon}>
                              <Emoji size={14} icon={role.icon} hovered />
                            </Show>
                            <span
                              class={style.roleCircle}
                              style={{
                                background:
                                  role.gradient || role.hexColor || "#fff",
                              }}
                            />
                            <span style={{ color: role.hexColor || "inherit" }}>
                              {role.name}
                            </span>
                          </div>
                        )}
                      </For>

                      <Show when={roles().length > 3}>
                        <div
                          class={style.nerimityRoleBadge}
                          style={{ opacity: 0.6 }}
                        >
                          +{roles().length - 3}
                        </div>
                      </Show>

                      <Show
                        when={accountMember()?.hasPermission(
                          ROLE_PERMISSIONS.MANAGE_ROLES
                        )}
                      >
                        <div
                          class={style.roleAddButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            showRoleModal(member);
                          }}
                        >
                          <Icon name="add" size={14} />
                        </div>
                      </Show>
                    </div>
                  </Table.Field>
                </Table.Item>
              );
            }}
          </For>
        </Table.Root>
      </div>
    </>
  );
}

function MemberField(props: { member: ServerMember }) {
  const user = () => props.member.user();
  const topRole = () => {
    const r = props.member.roles(true);
    return r.length > 0 ? r[0] : undefined;
  };

  const nameStyle = () => {
    const role = topRole();
    if (!role) return {};
    if (role.gradient)
      return {
        background: role.gradient,
        "-webkit-background-clip": "text",
        "-webkit-text-fill-color": "transparent",
        "background-clip": "text",
      };
    return { color: role.hexColor || "inherit" };
  };

  return (
    <Table.Field>
      <div class={style.memberField}>
        <Avatar user={user()} size={34} />
        <div class={style.nameStack}>
          <div class={style.nickname} style={nameStyle()}>
            {props.member.nickname || user().username}
          </div>
          <div class={style.usernameAndTag}>
            {user().username}
            <span class={style.dimmed}>:{user().tag}</span>
          </div>
        </div>
      </div>
    </Table.Field>
  );
}
