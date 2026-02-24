import { RawExploreItem } from "@/chat-api/RawData";

import { bannerUrl } from "@/chat-api/store/useServers";
import useStore from "@/chat-api/store/useStore";
import RouterEndpoints from "@/common/RouterEndpoints";
import { useTransContext } from "@nerimity/solid-i18lite";
import { batch, createSignal, For, on, Show } from "solid-js";
import { createEffect } from "solid-js";
import { css, styled } from "solid-styled-components";
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
import { Skeleton } from "../ui/skeleton/Skeleton";
import { classNames, cn } from "@/common/classNames";
import { MetaTitle } from "@/common/MetaTitle";
import Input from "../ui/input/Input";
import { CustomLink } from "../ui/CustomLink";
import {
  getExploreItems,
  PublicServerFilter,
  PublicServerSort,
} from "@/chat-api/services/ExploreService";
import { ServerBumpModal } from "./ExploreServers";
import { openInviteBotModal } from "../ui/openInviteBotModal";


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
  scroll-margin-top: 120px;
`;

const defaultQuery = {
  sort: "recently_bumped",
  filter: "online_bots",
  search: "",
} as const;

export default function ExploreBots() {
  const MAX_LIMIT = 30;
  const [t] = useTransContext();
  const { header } = useStore();
  const [publicItems, setPublicItems] = createSignal<null | RawExploreItem[]>(
    null
  );

  const [query, setQuery] = createSignal<{
    sort: PublicServerSort;
    filter: PublicServerFilter;
    search: string;
  }>(defaultQuery);

  const [afterId, setAfterId] = createSignal<string | null>(null);
  const [showSkeleton, setShowSkeleton] = createSignal(true);

  createEffect(
    on(query, () => {
      header.updateHeader({
        title: t("explore.bots.title"),
        iconName: "explore",
      });
      batch(() => {
        setPublicItems(null);
        setAfterId(null);
        setShowSkeleton(true);
      });
    })
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
      type: "bot" as const,
    };
    timerId = window.setTimeout(() => {
      getExploreItems(opts).then((servers) => {
        batch(() => {
          setPublicItems([...(publicItems() || []), ...servers]);
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
  ];

  const filterOpts: DropDownItem[] = [
    { id: "all", label: t("explore.servers.filterAll") },
    { id: "online_bots", label: t("status.online") },
    { id: "offline_bots", label: t("status.offline") },
  ];

  const update = (newPublicServer: RawExploreItem, index: number) => {
    const current = [...publicItems()!];
    current[index] = { ...current[index], ...newPublicServer };
    setPublicItems(current);
  };

  return (
    <Container>
      <MetaTitle>Explore Bots</MetaTitle>
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
        description={t("explore.bots.noticeMessage", {
          hours: "3",
          date: "Monday at 0:00 UTC",
        })}
      />
      <Notice
        class={css`
          margin-bottom: 10px;
        `}
        type="warn"
        description={t("explore.bots.moderationNotice")}
      />

      <GridLayout class="servers-list-grid">
        <For each={publicItems()}>
          {(item, i) => (
            <PublicItem
              update={(newItem) => update(newItem, i())}
              item={item}
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
                  const servers = publicItems();
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
const OnlineIndicator = styled.div`
  display: inline-block;
  margin-right: 6px;
  width: 10px;
  border-radius: 50%;
  height: 10px;
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

function PublicItem(props: {
  class?: string;
  item: RawExploreItem;
  update: (newItem: RawExploreItem) => void;
  display?: boolean;
}) {
  const [t] = useTransContext();
  const app = props.item.botApplication!;
  const bot = app.botUser;
  const [hovered, setHovered] = createSignal(false);
  const store = useStore();

  const { createPortal } = useCustomPortal();
  const bumpClick = () => {
    const bumpAfter = 3 * 60 * 60 * 1000; // 3 hours in ms

    const millisecondsSinceLastBump =
      new Date().getTime() - props.item.bumpedAt;
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
        "arrow_upward"
      );
    }

    return createPortal((close) => (
      <ServerBumpModal
        update={props.update}
        publicServer={props.item}
        close={close}
      />
    ));
  };

  return (
    <ServerItemContainer
      class={classNames(
        "serverItemContainer",
        props.class,
        props.display && "display"
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
          "banner"
        )}
        url={bannerUrl(props.item.botApplication?.botUser!)}
        hexColor={bot.hexColor}
      />
      <Avatar class={avatarStyles} animate={hovered()} user={bot} size={60} />
      <DetailsContainer class="detailsContainer" gap={1}>
        <FlexRow
          style={{ "align-items": "center", "margin-bottom": "4px" }}
          gap={5}
        >
          <CustomLink href={RouterEndpoints.PROFILE(bot.id)}>
            <Text class={serverNameStyles} size={18} bold>
              <OnlineIndicator
                style={{
                  background: bot.online
                    ? "var(--status-online)"
                    : "var(--status-offline)",
                }}
              />
              {bot.username}
            </Text>
          </CustomLink>
        </FlexRow>
        <Text size={14} color="rgba(255,255,255,0.6)">
          {t("explore.by")}
          {": "}
          <CustomLink
            href={RouterEndpoints.PROFILE(app.creatorAccount.user.id)}
          >
            <span
              class={css`
                font-weight: bold;
              `}
            >
              {app.creatorAccount.user.username}
            </span>
          </CustomLink>
        </Text>
      </DetailsContainer>
      <Text class={descriptionStyles} size={14}>
        {props.item.description}
      </Text>

      <MemberContainer gap={8}>
        <FlexRow gap={5}>
          <Icon name="group" size={17} color="var(--primary-color)" />
          <Text size={14}>
            {t("explore.bots.serverCount", {
              count: bot._count.servers.toLocaleString(),
            })}
          </Text>
        </FlexRow>

        <FlexRow gap={5}>
          <Icon name="schedule" size={17} color="var(--primary-color)" />
          <Text size={14}>
            {t("explore.bumped")}{" "}
            {timeSince(props.item.bumpedAt, false)}
          </Text>
        </FlexRow>
      </MemberContainer>

      <ButtonsContainer gap={8}>
        <Button
          margin={0}
          padding={8}
          iconSize={18}
          class={css`
            flex: 1;
          `}
          onClick={() =>
            openInviteBotModal(
              createPortal,
              props.item.botApplication?.id!,
              props.item.botPermissions
            )
          }
          iconName="add"
          primary
          label={t("explore.bots.inviteButton")}
        />
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
            count: props.item.bumpCount.toLocaleString(),
          })}
        />

        <Show when={store.account.hasModeratorPerm(true)}>
          <Button
            margin={0}
            padding={8}
            iconSize={18}
            href={`/app/moderation/users/${props.item.botApplication?.botUser.id}`}
            iconName="security"
          />
        </Show>
      </ButtonsContainer>
    </ServerItemContainer>
  );
}
