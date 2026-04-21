import {
  Show,
  For,
  Switch,
  Match,
  createSignal,
  createMemo,
  createEffect,
  on,
  onCleanup
} from "solid-js";
import style from "./style.module.scss";
import ServerDrawerHeader from "./header/ServerDrawerHeader";
import {
  CategoryControllerProvider,
  ServerDrawerControllerProvider,
  useCategoryController,
  useServerDrawerController
} from "./ServerDrawerController";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import useStore from "@/chat-api/store/useStore";
import { ChannelType, ServerNotificationPingMode } from "@/chat-api/RawData";
import { Channel } from "@/chat-api/store/useChannels";
import { cn } from "@/common/classNames";
import { Tooltip } from "@/components/ui/Tooltip";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/icon/Icon";
import { ChannelIcon } from "@/components/ChannelIcon";
import { t } from "@nerimity/i18lite";
import { messagesPreloader } from "@/common/createPreloader";
import RouterEndpoints from "@/common/RouterEndpoints";
import { Item } from "@/components/ui/Item";
import { emitDrawerGoToMain } from "@/common/GlobalEvents";
import { styled } from "solid-styled-components";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import Text from "@/components/ui/Text";
import { timeSinceDigital } from "@/common/date";
import Avatar from "@/components/ui/Avatar";
import InVoiceActions from "@/components/InVoiceActions";
import { useWindowProperties } from "@/common/useWindowProperties";
import { useMatch, useParams } from "solid-navigator";
import ContextMenuServerChannel from "../context-menu/ContextMenuServerChannel";

const ServerDrawer = () => {
  return (
    <ServerDrawerControllerProvider>
      <ServerDrawerContent />
    </ServerDrawerControllerProvider>
  );
};

const ServerDrawerContent = () => {
  const params = useParams<{ serverId: string }>();
  const store = useStore();
  const { isMobileWidth } = useWindowProperties();
  const controller = useServerDrawerController();

  const server = () => store.servers.get(params.serverId);
  return (
    <>
      <Show when={controller?.contextMenuDetails()}>
        <ContextMenuServerChannel
          {...controller?.contextMenuDetails()}
          onClose={() => controller?.setContextMenuDetails(undefined)}
        />
      </Show>
      <ServerDrawerHeader />
      <div class={style.serverDrawer}>
        <div class={style.serverDrawerInner}>
          <Show when={server()?.joinedThisSession}>
            <JoinedThisSessionNotificationNotice />
          </Show>
          <MembersItem />
          <Show when={server()?._count?.welcomeQuestions}>
            <CustomizeItem />
          </Show>
          <ChannelList />
          <InVoiceActions
            style={
              isMobileWidth()
                ? { bottom: "calc(var(--bottom-pane-gap) + 6px)" }
                : {}
            }
          />
        </div>
      </div>
    </>
  );
};

const CustomizeItem = () => {
  const params = useParams<{ serverId: string }>();
  const match = useMatch(() =>
    RouterEndpoints.SERVER_MESSAGES(params.serverId!, "welcome")
  );
  return (
    <div class={style.welcomeItemContainer}>
      <Item.Root
        href={RouterEndpoints.SERVER_MESSAGES(params.serverId!, "welcome")}
        onClick={() => emitDrawerGoToMain()}
        selected={!!match()}
      >
        <Item.Icon>tune</Item.Icon>
        <Item.Label>{t("channelDrawer.customize.title")}</Item.Label>
      </Item.Root>
    </div>
  );
};
const MembersItem = () => {
  const params = useParams<{ serverId: string }>();
  const match = useMatch(() =>
    RouterEndpoints.SERVER_MESSAGES(params.serverId!, "members")
  );
  return (
    <div class={style.membersItemContainer}>
      <Item.Root
        href={RouterEndpoints.SERVER_MESSAGES(params.serverId!, "members")}
        onClick={() => emitDrawerGoToMain()}
        selected={!!match()}
      >
        <Item.Icon>group</Item.Icon>
        <Item.Label>{t("informationDrawer.members")}</Item.Label>
      </Item.Root>
    </div>
  );
};

const ChannelList = () => {
  const store = useStore();
  const controller = useServerDrawerController();

  return (
    <div class={style.channelList}>
      <Show
        when={store.account.lastAuthenticatedAt()}
        fallback={<ChannelListSkeleton />}
      >
        <For each={controller?.sortedRootChannels()}>
          {(channel) => (
            <Switch
              fallback={
                <ChannelItem
                  channel={channel!}
                  selected={controller?.params().channelId === channel!.id}
                />
              }
            >
              <Match when={channel!.type === ChannelType.CATEGORY}>
                <CategoryControllerProvider channel={channel}>
                  <CategoryItem
                    channel={channel!}
                    selected={controller?.params().channelId === channel!.id}
                  />
                </CategoryControllerProvider>
              </Match>
            </Switch>
          )}
        </For>
      </Show>
    </div>
  );
};

const ChannelListSkeleton = () => {
  return (
    <Skeleton.List>
      <Skeleton.Item height="34px" width="100%" />
    </Skeleton.List>
  );
};

function CategoryItem(props: { channel: Channel; selected: boolean }) {
  const controller = useServerDrawerController();
  const categoryController = useCategoryController();
  const [hovered, setHovered] = createSignal(false);

  const sortedServerChannels = () =>
    categoryController!.sortedCategoryChannels();

  const isPrivateCategory = () =>
    controller?.privateChannelIds().includes(props.channel.id);

  const expanded = createMemo(
    () => controller?.expanded(props.channel) ?? false
  );

  return (
    <Show when={!isPrivateCategory() || sortedServerChannels().length}>
      <div
        class={style.categoryContainer}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          class={style.categoryItemContainer}
          onClick={() => controller?.toggleExpanded(props.channel)}
          classList={{ [style.hide!]: !expanded() }}
        >
          <Icon
            size={14}
            name="keyboard_arrow_down"
            class={cn(expanded() && style.expanded, style.expandIcon)}
          />

          <ChannelIcon
            icon={props.channel.icon}
            type={props.channel.type}
            hovered={hovered()}
            class={style.categoryItemChannelIcon}
          />
          <Show when={isPrivateCategory()}>
            <Icon name="lock" size={14} style={{ opacity: 0.3 }} />
          </Show>
          <div class={style.label}>{props.channel.name}</div>

          <div class={style.categoryButtons}>
            <Show when={controller!.hasModeratorPermission()}>
              <Tooltip tooltip={t("channelDrawer.addChannel")}>
                <Button
                  class={style.addChannelButton}
                  padding={4}
                  margin={0}
                  iconName="add"
                  iconSize={16}
                  onClick={(e) =>
                    controller!.onAddChannelClick(e, props.channel.id)
                  }
                />
              </Tooltip>
            </Show>
          </div>
        </div>

        <Show when={sortedServerChannels().length}>
          <div class={style.categoryChannelList}>
            <For each={sortedServerChannels()}>
              {(channel) => (
                <Show when={expanded()}>
                  <ChannelItem
                    channel={channel!}
                    selected={controller?.params().channelId === channel!.id}
                  />
                </Show>
              )}
            </For>
          </div>
        </Show>
      </div>
    </Show>
  );
}

function ChannelItem(props: { channel: Channel; selected: boolean }) {
  const controller = useServerDrawerController();
  const [hovered, setHovered] = createSignal(false);

  const onMouseEnter = () => {
    setHovered(true);
    messagesPreloader.preload(props.channel.id);
  };

  const hasNotifications = () => props.channel.hasNotifications();

  const isPrivateChannel = () =>
    controller?.privateChannelIds().includes(props.channel.id);

  const expanded = () => {
    return controller?.expanded(props.channel);
  };

  return (
    <Show when={expanded || props.selected || hasNotifications()}>
      <Item.Root
        onContextMenu={(e) =>
          controller?.onChannelContextMenu(e, props.channel)
        }
        href={RouterEndpoints.SERVER_MESSAGES(
          props.channel.serverId!,
          props.channel.id
        )}
        onMouseEnter={onMouseEnter}
        onMouseLeave={() => setHovered(false)}
        selected={props.selected}
        alert={!!hasNotifications()}
        onClick={() => emitDrawerGoToMain()}
        class={style.channelItem}
      >
        <ChannelIcon
          icon={props.channel.icon}
          type={props.channel.type}
          hovered={hovered()}
        />
        <Item.Label>{props.channel.name}</Item.Label>
        <Show when={isPrivateChannel()}>
          <Icon
            name="lock"
            size={14}
            style={{ opacity: 0.3, "margin-right": "5px" }}
          />
        </Show>
        <Show when={props.channel.mentionCount()}>
          <div class={style.mentionCount}>{props.channel.mentionCount()}</div>
        </Show>
      </Item.Root>
      <ChannelItemVoiceUsers channelId={props.channel.id} />
    </Show>
  );
}
const ChannelVoiceUsersContainer = styled(FlexColumn)`
  gap: 3px;
  padding: 5px;
  padding-left: 10px;
  background-color: hsl(216deg 7% 28% / 60%);
  border-radius: 8px;
  margin-top: 2px;
`;

const ChannelVoiceUsersListContainer = styled(FlexRow)`
  flex-wrap: wrap;
  gap: 3px;
  margin-left: 20px;
`;
const ChannelVoiceUsersTitle = styled(Text)`
  display: flex;
  gap: 3px;
  align-items: center;
`;

function ChannelItemVoiceUsers(props: { channelId: string }) {
  const { voiceUsers } = useStore();

  const channelVoiceUsers = () =>
    voiceUsers.getVoiceUsersByChannelId(props.channelId);

  return (
    <Show when={channelVoiceUsers().length}>
      <ChannelVoiceUsersContainer>
        <ChannelVoiceUsersTitle size={12}>
          <Icon name="call" size={16} color="rgba(255,255,255,0.4)" />
          {t("channelDrawer.inVoice")}
          <CallTime channelId={props.channelId} />
        </ChannelVoiceUsersTitle>
        <ChannelVoiceUsersListContainer>
          <For each={channelVoiceUsers()}>
            {(voiceUser) => <Avatar user={voiceUser!.user()} size={20} />}
          </For>
        </ChannelVoiceUsersListContainer>
      </ChannelVoiceUsersContainer>
    </Show>
  );
}
function CallTime(props: { channelId: string }) {
  const { channels } = useStore();
  const channel = () => channels.get(props.channelId);

  const [time, setTime] = createSignal<null | string>(null);

  createEffect(
    on(
      () => channel()?.callJoinedAt,
      (joinedAt) => {
        let interval: number;
        if (joinedAt) {
          setTime(timeSinceDigital(joinedAt));
          interval = window.setInterval(
            () => setTime(timeSinceDigital(joinedAt)),
            1000
          );
        }
        onCleanup(() => {
          if (interval) {
            clearInterval(interval);
          }
        });
      }
    )
  );

  return (
    <Show when={channel()?.callJoinedAt}>
      <Text
        size={12}
        opacity={0.6}
        style={{
          "margin-left": "auto",
          "font-variant-numeric": "tabular-nums"
        }}
      >
        {time()}
      </Text>
    </Show>
  );
}

function JoinedThisSessionNotificationNotice() {
  const params = useParams<{ serverId: string }>();
  const store = useStore();
  const server = () => store.servers.get(params.serverId);

  const dismiss = () => {
    server()?.update({ joinedThisSession: false });
  };

  const handleSetToMentionsOnly = () => {
    dismiss();
    store.account.updateUserNotificationSettings({
      notificationPingMode: ServerNotificationPingMode.MENTIONS_ONLY,
      serverId: params.serverId
    });
  };

  return (
    <div class={style.joinedThisSessionNotice}>
      <Button
        iconName="close"
        iconSize={14}
        class={style.closeIcon}
        onclick={dismiss}
      />
      <Icon name="notifications" size={30} />
      <div class={style.details}>
        <div class={style.text}>
          {t("serverDrawer.joinedThisSessionNotice")}
        </div>
        <Button
          label={t("serverDrawer.joinedThisSessionNoticeSetToMentionsOnly")}
          iconName="alternate_email"
          iconSize={16}
          onClick={handleSetToMentionsOnly}
        />
      </div>
    </div>
  );
}

export default ServerDrawer;
