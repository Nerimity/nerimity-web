import {
  Ban,
  bannedMembersList,
  removeBanServerMember,
} from "@/chat-api/services/ServerService";
import useStore from "@/chat-api/store/useStore";
import RouterEndpoints from "@/common/RouterEndpoints";
import Avatar from "@/components/ui/Avatar";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import Input from "../../ui/input/Input";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import Text from "@/components/ui/Text";
import { A, useParams } from "solid-navigator";
import { createSignal, For, Show, onMount, onCleanup } from "solid-js";
import { css, styled } from "solid-styled-components";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Button from "@/components/ui/Button";
import DropDown, { DropDownItem } from "../../ui/drop-down/DropDown";
import { formatTimestamp } from "@/common/date";
import { t } from "@nerimity/i18lite";

const BansContainer = styled(FlexColumn)`
  gap: 10px;
  padding: 10px;
`;

export default function ServerSettingsBans() {
  const params = useParams<{ serverId: string }>();
  const { servers } = useStore();

  const [bans, setBans] = createSignal<Ban[]>([]);
  const [query, setQuery] = createSignal("");
  const [sortOption, setSortOption] = createSignal<
    "alphabetical" | "relevance"
  >("alphabetical");

  const sortOptions: DropDownItem[] = [
    { id: "alphabetical", label: t("settings.call.default") },
    { id: "unsorted", label: t("servers.settings.bans.sort.unsorted") },
  ]; // TODO: Add a sort by "Recent" :P

  const filtered = () => {
    const result = bans().filter(
      (b) =>
        b.user.username.toLowerCase().includes(query().trim().toLowerCase()) ||
        b.user.id.toLowerCase().includes(query().trim().toLowerCase())
    );

    if (sortOption() === "alphabetical") {
      return result.sort((a, b) =>
        a.user.username.localeCompare(b.user.username)
      );
    }
    return result;
  };

  const loadBans = async () => {
    const list = await bannedMembersList(params.serverId);
    setBans(list);
  };

  onMount(() => {
    // Reactivity
    loadBans();
    const interval = setInterval(loadBans, 10_000); // Update bans every 5 seconds
    onCleanup(() => clearInterval(interval));
  });

  const server = () => servers.get(params.serverId);

  return (
    <BansContainer>
      <Breadcrumb>
        <BreadcrumbItem
          href={RouterEndpoints.SERVER_MESSAGES(
            params.serverId,
            server()?.defaultChannelId!
          )}
          icon="home"
          title={server()?.name}
        />
        <BreadcrumbItem title={t("servers.settings.drawer.bans")} />
      </Breadcrumb>

      <FlexRow gap={10}>
        <Input
          label={t("inbox.drawer.searchBarPlaceholder")}
          value={query()}
          onText={setQuery}
          class={css`
            flex: 1;
            min-width: 200px;
            margin: 0;
          `}
        />
        <DropDown
          title={t("servers.settings.bans.sort.title")}
          items={sortOptions}
          selectedId={sortOption()}
          onChange={(item) =>
            setSortOption(item.id as "alphabetical" | "relevance")
          }
          class={css`
            margin: 0;
          `}
        />
      </FlexRow>

      <Show
        when={bans().length > 0}
        fallback={
          <Text
            size={14}
            opacity={0.6}
            class={css`
              padding: 30px 0;
              text-align: center;
            `}
          >
            {t("servers.settings.bans.noResults")}
          </Text>
        }
      >
        <For each={filtered()}>
          {(ban) => (
            <BanItem
              ban={ban}
              removeLocalBan={() =>
                setBans((b) => b.filter((x) => x.user.id !== ban.user.id))
              }
            />
          )}
        </For>
      </Show>
    </BansContainer>
  );
}

function BanItem(props: { ban: Ban; removeLocalBan: () => void }) {
  // eslint-disable-next-line solid/reactivity
  const user = props.ban.user;
  const [requestSent, setRequestSent] = createSignal(false);
  const [isRemoving, setIsRemoving] = createSignal(false);

  const onUnbanClick = () => {
    if (requestSent()) return;
    setRequestSent(true);
    setIsRemoving(true);

    setTimeout(() => {
      removeBanServerMember(props.ban.serverId, user.id).finally(() => {
        props.removeLocalBan();
      });
    }, 800);
  };

  // I love this animation, touch this, and It's like killing John Wick's dog.
  const AnimatedAvatar = styled(Avatar)<{ removing: boolean }>`
    width: 3em;
    height: 3em;
    min-width: 26px;
    min-height: 26px;
    border-radius: 50%;
    flex-shrink: 0;
    transition: all 0.8s ease-in-out;
    transform: ${({ removing }) =>
      removing ? "scale(0) rotate(360deg)" : "scale(1) rotate(0deg)"};
    opacity: ${({ removing }) => (removing ? 0 : 1)};
  `;

  const AnimatedSettingsBlock = styled(SettingsBlock)<{ removing: boolean }>`
    transition: all 0.8s ease-in-out;
    opacity: ${({ removing }) => (removing ? 0 : 1)};
    transform: ${({ removing }) => (removing ? "scale(0.5)" : "scale(1)")};
  `;

  const InfoColumn = styled(FlexColumn)`
    gap: 2px;
  `; // Info column's could be collapsible in future for better readability?

  return (
    <AnimatedSettingsBlock
      removing={isRemoving()}
      icon={
        <A href={RouterEndpoints.PROFILE(user.id)}>
          <AnimatedAvatar user={user} removing={isRemoving()} />
        </A>
      }
      label={
        <A
          href={RouterEndpoints.PROFILE(user.id)}
          style={{ "text-decoration": "none" }}
        >
          {user.username}
        </A>
      }
      description={
        <InfoColumn>
          <Text size={12} opacity={0.6}>
            {t("servers.settings.bans.reason")}:{" "}
            {props.ban.reason || t("servers.settings.bans.noReason")}
          </Text>
          <Text size={12} opacity={0.6}>
            {t("servers.settings.bans.bannedAt")}:{" "}
            {props.ban.bannedAt
              ? formatTimestamp(props.ban.bannedAt)
              : t("servers.settings.bans.unknown")}
          </Text>
        </InfoColumn>
      } // TODO: Include a "Banned By:"
      children={
        <Button
          label={
            requestSent()
              ? t("servers.settings.bans.unbanning")
              : t("servers.settings.bans.unban")
          }
          color="var(--alert-color)"
          iconName="undo"
          onClick={onUnbanClick}
        />
      }
    />
  );
}
