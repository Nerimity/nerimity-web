import { RawExploreItem } from "@/chat-api/RawData";

import { bannerUrl } from "@/chat-api/store/useServers";
import useStore from "@/chat-api/store/useStore";
import RouterEndpoints from "@/common/RouterEndpoints";
import { useTransContext } from "@nerimity/solid-i18lite";
import { A, useNavigate } from "solid-navigator";
import { batch, createSignal, For, on, Show } from "solid-js";
import { createEffect } from "solid-js";
import { css, styled } from "solid-styled-components";
import { ServerVerifiedIcon } from "../servers/ServerVerifiedIcon";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import DropDown, { DropDownItem } from "../ui/drop-down/DropDown";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import Icon from "../ui/icon/Icon";
import { Notice } from "../ui/Notice/Notice";
import Text from "../ui/Text";
import { Banner } from "../ui/Banner";
import { timeSince } from "@/common/date";
import { toast, useCustomPortal } from "../ui/custom-portal/CustomPortal";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import { Turnstile, TurnstileRef } from "@nerimity/solid-turnstile";
import env from "@/common/env";
import { Skeleton } from "../ui/skeleton/Skeleton";
import { classNames, cn } from "@/common/classNames";
import { MetaTitle } from "@/common/MetaTitle";
import Input from "../ui/input/Input";
import { useJoinServer } from "@/chat-api/useJoinServer";
import { CustomLink } from "../ui/CustomLink";
import { deepMerge } from "@/common/deepMerge";
import {
  BumpExploreItem,
  getExploreItems,
  PublicServerFilter,
  PublicServerSort,
} from "@/chat-api/services/ExploreService";
import { ToastModal } from "@/components/ui/toasts/ToastModal";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

const GridLayout = styled("div")`
  display: grid;
  grid-gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
`;

const defaultQuery = {
  sort: "recently_bumped",
  filter: "all",
  search: "",
} as const;

export default function ExploreServers() {
  const MAX_LIMIT = 30;
  const [t] = useTransContext();
  const { header } = useStore();
  const [publicServers, setPublicServers] = createSignal<
    null | RawExploreItem[]
  >(null);

  const [query, setQuery] = createSignal<{
    sort: PublicServerSort;
    filter: PublicServerFilter;
    search: string;
  }>(defaultQuery);

  const isDefaultQuery = () =>
    query().sort === defaultQuery.sort &&
    query().filter === defaultQuery.filter &&
    query().search.trim() === defaultQuery.search;

  const [afterId, setAfterId] = createSignal<string | null>(null);
  const [showSkeleton, setShowSkeleton] = createSignal(true);

  const [pinnedServers, setPinnedServers] = createSignal<
    RawExploreItem[] | null
  >(null);

  createEffect(() => {
    header.updateHeader({
      title: t("explore.servers.title"),
      iconName: "explore",
    });

    getExploreItems({ filter: "pinned", sort: "pinned_at" })
      .then((servers) => setPinnedServers(servers))
      .catch(() => {});
  });

  createEffect(
    on(query, () => {
      batch(() => {
        setPublicServers(null);
        setAfterId(null);
        setShowSkeleton(true);
      });
    }),
  );

  let timerId = 0;
  createEffect(() => {
    clearTimeout(timerId);
    const _afterId = afterId();
    const search = query().search.trim();
    const opts = {
      sort: query().sort,
      filter: query().filter,
      limit: MAX_LIMIT,
      ...(_afterId ? { afterId: _afterId } : {}),
      ...(search ? { search } : {}),
    };
    timerId = window.setTimeout(() => {
      getExploreItems(opts).then((servers) => {
        batch(() => {
          setPublicServers([...(publicServers() || []), ...servers]);
          setShowSkeleton(servers.length >= MAX_LIMIT);
        });
      });
    }, 500);
  });

  const sortOpts: DropDownItem[] = [
    { id: "most_bumps", label: t("explore.servers.sortMostBumps") },
    { id: "most_members", label: t("explore.servers.sortMostMembers") },
    { id: "recently_added", label: t("explore.servers.sortRecentlyAdded") },
    { id: "recently_bumped", label: t("explore.servers.sortRecentlyBumped") },
    { id: "most_active", label: t("explore.servers.sortMostActive") },
  ];

  const filterOpts: DropDownItem[] = [
    { id: "all", label: t("explore.servers.filterAll") },
    { id: "verified", label: t("explore.servers.filterVerified") },
  ];

  const update = (newPublicServer: RawExploreItem, index: number) => {
    const current = [...publicServers()!];
    current[index] = { ...current[index], ...newPublicServer };
    setPublicServers(current);
  };

  return (
    <Container>
      <MetaTitle>Explore Servers</MetaTitle>
      <div
        class={css`
          display: flex;
        `}
      >
        <Button
          margin={0}
          href="/app"
          label={t("general.backButton")}
          iconName="arrow_back"
        />
      </div>
      <FlexRow
        gap={10}
        wrap
        class={css`
          flex: 1;
          margin-bottom: 10px;
          margin-top: 10px;
        `}
      >
        <Input
          label={t("general.searchPlaceholder")}
          value={query().search}
          onText={(text) => setQuery({ ...query(), search: text })}
          class={css`
            flex: 1;
            min-width: 200px;
            span {
              margin-bottom: 2px;
            }
          `}
        />
        <DropDown
          title={t("explore.sort")}
          items={sortOpts}
          selectedId={query().sort}
          onChange={(i) =>
            setQuery({ ...query(), sort: i.id as PublicServerSort })
          }
        />
        <DropDown
          title={t("explore.filter")}
          items={filterOpts}
          selectedId={query().filter}
          onChange={(i) =>
            setQuery({ ...query(), filter: i.id as PublicServerFilter })
          }
        />
      </FlexRow>

      <Notice
        type="info"
        description={t("explore.servers.noticeMessage", {
          hours: "3",
          date: "Monday at 0:00 UTC",
        })}
      />
      <Notice
        class={css`
          margin-bottom: 10px;
        `}
        type="warn"
        description={t("explore.servers.moderationNotice")}
      />

      <Show when={isDefaultQuery()}>
        <Text>{t("explore.servers.pinnedServers")}</Text>
        <GridLayout
          class="servers-list-grid"
          style={{ "margin-bottom": "10px" }}
        >
          <For each={pinnedServers()}>
            {(server, i) => (
              <PublicServerItem
                update={(newServer) => update(newServer, i())}
                publicServer={server}
              />
            )}
          </For>
          <Show when={pinnedServers() === null}>
            <For each={Array(4).fill(null)}>
              {() => (
                <Skeleton.Item
                  height="334px"
                  width="100%"
                  onInView={() => {
                    const servers = publicServers();
                    if (!servers?.length) return;
                    setAfterId(servers[servers.length - 1]?.id || null);
                  }}
                />
              )}
            </For>
          </Show>
        </GridLayout>
        <Text style={{ "margin-bottom": "10px" }}>
          {t("explore.servers.recentlyBumped")}
        </Text>
      </Show>

      <GridLayout class="servers-list-grid">
        <For each={publicServers()}>
          {(server, i) => (
            <PublicServerItem
              update={(newServer) => update(newServer, i())}
              publicServer={server}
            />
          )}
        </For>
        <Show when={showSkeleton()}>
          <For each={Array(20).fill(null)}>
            {() => (
              <Skeleton.Item
                height="334px"
                width="100%"
                onInView={() => {
                  const servers = publicServers();
                  if (!servers?.length) return;
                  setAfterId(servers[servers.length - 1]?.id || null);
                }}
              />
            )}
          </For>
        </Show>
      </GridLayout>
    </Container>
  );
}

const ServerItemContainer = styled(FlexColumn)`
  background: var(--background-color);
  border: solid 1px rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  user-select: none;
  position: relative;
  overflow: hidden;
  &.display {
    max-height: initial;
    margin-bottom: 10px;
    .banner {
      max-height: 160px;
    }
  }
`;
const DetailsContainer = styled(FlexColumn)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 8px;
  margin-left: 5px;
  margin-right: 5px;
  margin-bottom: 0;
  padding-left: 6px;
  padding-right: 6px;
  flex-shrink: 0;
  z-index: 1111;
`;

const MemberContainer = styled(FlexRow)`
  align-items: center;
  flex-shrink: 0;
  flex-wrap: wrap;
  margin-top: 12px;
  margin-left: 10px;
  margin-right: 10px;
  opacity: 0.8;
`;

const serverNameStyles = css`
  word-break: break-word;
  white-space: pre-line;

  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;
const avatarStyles = css`
  margin-top: -40px;
  margin-left: 12px;
`;

const descriptionStyles = css`
  margin-top: 12px;
  margin-bottom: 6px;
  word-break: break-word;
  white-space: pre-line;
  flex-shrink: 0;
  margin-bottom: auto;

  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  margin-left: 11px;
  margin-right: 11px;
`;

const ButtonsContainer = styled(FlexRow)`
  margin-top: 2px;
  margin-left: 8px;
  margin-right: 8px;
  margin-bottom: 8px;
  padding-top: 10px;
  flex-shrink: 0;
  z-index: 1111;
`;

function PublicServerItem(props: {
  class?: string;
  publicServer: RawExploreItem;
  update: (newServer: RawExploreItem) => void;
  display?: boolean;
}) {
  const [t] = useTransContext();
  const server = props.publicServer.server!;
  const { joinPublicById, joining: joinClicked } = useJoinServer();
  const [hovered, setHovered] = createSignal(false);
  const store = useStore();

  const { createPortal } = useCustomPortal();

  const { servers } = useStore();

  const cacheServer = () => servers.get(server.id);

  const joinServerClick = async () => {
    if (joinClicked()) return;
    await joinPublicById(props.publicServer.serverId);
  };

  const bumpClick = () => {
    const bumpAfter = 3 * 60 * 60 * 1000; // 3 hours in ms

    const millisecondsSinceLastBump =
      new Date().getTime() - props.publicServer.bumpedAt;
    const timeLeftMilliseconds = bumpAfter - millisecondsSinceLastBump;
    const timeLeft = new Date(timeLeftMilliseconds);

    if (timeLeftMilliseconds > 0) {
      toast(
        t("servers.settings.publishServer.bumpCooldown", {
          hours: timeLeft.getUTCHours(),
          minutes: timeLeft.getUTCMinutes(),
          seconds: timeLeft.getUTCSeconds(),
        }),
        t("servers.settings.publishServer.bumpServer"),
        "arrow_upward",
      );
      return;
    }

    return createPortal((close) => (
      <ServerBumpModal
        update={props.update}
        publicServer={props.publicServer}
        close={close}
      />
    ));
  };

  return (
    <ServerItemContainer
      class={classNames(
        "serverItemContainer",
        props.class,
        props.display && "display",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Banner
        margin={0}
        radius={6}
        animate={hovered()}
        class={cn(
          css`
            width: 100%;
          `,
          "banner",
        )}
        url={bannerUrl(props.publicServer.server!)}
        hexColor={props.publicServer.server?.hexColor}
      />
      <Avatar
        class={avatarStyles}
        animate={hovered()}
        server={server}
        size={60}
      />
      <DetailsContainer class="detailsContainer" gap={1}>
        <FlexRow
          style={{ "align-items": "center", "margin-bottom": "4px" }}
          gap={5}
        >
          <Text class={serverNameStyles} size={18} bold>
            {server.name}
          </Text>
          <Show when={server.verified}>
            <ServerVerifiedIcon />
          </Show>
        </FlexRow>
        <Text size={14} color="rgba(255,255,255,0.6)">
          {t("explore.by")}
          {": "}
          <CustomLink href={RouterEndpoints.PROFILE(server.createdBy.id)}>
            <span
              class={css`
                font-weight: bold;
              `}
            >
              {props.publicServer.server?.createdBy.username}
            </span>
          </CustomLink>
        </Text>
      </DetailsContainer>
      <Text class={descriptionStyles} size={14}>
        {props.publicServer.description}
      </Text>

      <MemberContainer gap={8}>
        <FlexRow gap={5}>
          <Icon name="group" size={17} color="var(--primary-color)" />
          <Text size={14}>
            {t("explore.servers.memberCount", {
              count: server._count.serverMembers.toLocaleString(),
            })}
          </Text>
        </FlexRow>
        {/* <FlexRow gap={5}>
          <Icon name="arrow_upward" size={17} color="var(--primary-color)" />
          <Text size={14}>
            {t("explore.servers.lifetimeBumpCount", {
              count: props.publicServer.lifetimeBumpCount.toLocaleString(),
            })}
          </Text>
        </FlexRow> */}
        <FlexRow gap={5}>
          <Icon name="schedule" size={17} color="var(--primary-color)" />
          <Text size={14}>
            {t("explore.bumped")}{" "}
            {timeSince(props.publicServer.bumpedAt, false)}
          </Text>
        </FlexRow>
      </MemberContainer>

      <ButtonsContainer gap={8}>
        <Show when={cacheServer()}>
          <A
            style={{ "text-decoration": "none", flex: 1, display: "flex" }}
            href={RouterEndpoints.SERVER_MESSAGES(
              cacheServer()!.id,
              cacheServer()!.defaultChannelId,
            )}
          >
            <Button
              padding={8}
              margin={0}
              primary
              class={css`
                flex: 1;
              `}
              iconSize={18}
              iconName="login"
              label={t("explore.servers.visitServerButton")}
            />
          </A>
        </Show>

        <Show when={!cacheServer()}>
          <Button
            margin={0}
            padding={8}
            iconSize={18}
            class={css`
              flex: 1;
            `}
            onClick={joinServerClick}
            iconName="login"
            primary
            label={t("explore.servers.joinServerButton")}
          />
        </Show>
        <Button
          padding={8}
          iconSize={18}
          onClick={bumpClick}
          class={css`
            flex: 1;
          `}
          margin={0}
          iconName="arrow_upward"
          label={t("explore.servers.bumpButton", {
            count: props.publicServer.bumpCount.toLocaleString(),
          })}
        />

        <Show when={store.account.hasModeratorPerm(true)}>
          <Button
            margin={0}
            padding={8}
            iconSize={18}
            href={`/app/moderation/servers/${props.publicServer.serverId}`}
            iconName="security"
          />
        </Show>
      </ButtonsContainer>
    </ServerItemContainer>
  );
}

const ServerBumpModalContainer = styled(FlexRow)`
  justify-content: center;
  align-items: center;
  padding: 10px;
`;

export function ServerBumpModal(props: {
  update(server: RawExploreItem): void;
  publicServer: RawExploreItem;
  close(): void;
}) {
  const [t] = useTransContext();
  const [verifyToken, setVerifyKey] = createSignal<string | undefined>(
    undefined,
  );
  let turnstileRef: TurnstileRef | undefined;

  const bumpServer = () => {
    BumpExploreItem(props.publicServer.id, verifyToken())
      .then((newPublicServer) => {
        props.update(deepMerge(props.publicServer, newPublicServer));
        props.close();
      })
      .catch((err) => {
        setVerifyKey(undefined);
        toast(err.message);
        turnstileRef?.reset();
      });
  };

  const ActionButtons = (
    <FlexRow style={{ "justify-content": "flex-end", width: "100%" }}>
      <Button
        iconName="close"
        onClick={props.close}
        color="var(--alert-color)"
        label={t("general.backButton")}
      />
      <Show when={verifyToken()}>
        <Button iconName="arrow_upward" label="Bump" onClick={bumpServer} />
      </Show>
    </FlexRow>
  );

  return (
    <LegacyModal
      title={`Bump ${
        props.publicServer.server?.name ||
        props.publicServer.botApplication?.botUser.username
      }`}
      close={props.close}
      actionButtons={ActionButtons}
    >
      <ServerBumpModalContainer>
        <Turnstile
          ref={turnstileRef}
          sitekey={env.TURNSTILE_SITEKEY!}
          onVerify={setVerifyKey}
          autoResetOnExpire={true}
        />
      </ServerBumpModalContainer>
    </LegacyModal>
  );
}
