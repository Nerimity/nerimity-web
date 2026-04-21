import { CHANNEL_PERMISSIONS, ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { ChannelType } from "@/chat-api/RawData";
import { Channel } from "@/chat-api/store/useChannels";
import useStore from "@/chat-api/store/useStore";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import { createContextProvider } from "@solid-primitives/context";
import { createMemo, createSignal } from "solid-js";
import { useParams } from "solid-navigator";
import { CreateChannelModal } from "../modals/CreateChannelModal";
import { useCollapsedServerCategories } from "@/common/localStorage";

const [controller, useController] = createContextProvider(() => {
  const params = useParams<{ serverId: string; channelId?: string }>();
  const store = useStore();
  const { createPortal } = useCustomPortal();

  const [contextMenuDetails, setContextMenuDetails] = createSignal<
    | {
        position: { x: number; y: number };
        serverId: string;
        channelId: string;
      }
    | undefined
  >();

  const [collapsedServerCategories, setCollapsedServerCategories] =
    useCollapsedServerCategories();

  const member = () =>
    store.serverMembers.get(params.serverId, store.account.user()?.id!);
  const hasModeratorPermission = createMemo(() =>
    store.serverMembers.hasPermission(
      member()!,
      ROLE_PERMISSIONS.MANAGE_CHANNELS
    )
  );

  const sortedChannels = createMemo(() =>
    store.channels.getSortedChannelsByServerId(params.serverId, true, true)
  );

  const sortedRootChannels = () =>
    sortedChannels().filter((channel) => !channel?.categoryId);

  const privateChannelIds = createMemo(() => {
    const ids: string[] = [];

    sortedChannels().forEach((channel) => {
      if (channel!.type === ChannelType.CATEGORY) {
        if (
          store.serverMembers.hasPermission(
            member(),
            ROLE_PERMISSIONS.MANAGE_CHANNELS
          )
        ) {
          return;
        }

        const noViewableChannels = sortedChannels().every(
          (channel) =>
            !channel.hasPermission(CHANNEL_PERMISSIONS.PUBLIC_CHANNEL, true)
        );
        const isPrivateCategory =
          !channel.hasPermission(CHANNEL_PERMISSIONS.PUBLIC_CHANNEL, true) ||
          noViewableChannels;
        if (isPrivateCategory) {
          ids.push(channel!.id);
        }
      } else {
        const isPrivateChannel = !channel.hasPermission(
          CHANNEL_PERMISSIONS.PUBLIC_CHANNEL,
          true
        );
        if (isPrivateChannel) {
          ids.push(channel!.id);
        }
      }
    });
    return ids;
  });

  const onAddChannelClick = (event: MouseEvent, categoryId: string) => {
    event.stopPropagation();
    createPortal?.((close) => (
      <CreateChannelModal
        close={close}
        serverId={params.serverId!}
        categoryId={categoryId}
      />
    ));
  };

  const expanded = (channel: Channel) => {
    return !collapsedServerCategories().includes(channel.id);
  };

  const toggleExpanded = (channel: Channel) => {
    const value = !expanded(channel);
    const newCollapsedCategories = [...collapsedServerCategories()];
    if (value) {
      const index = newCollapsedCategories.indexOf(channel.id);
      if (index > -1) {
        newCollapsedCategories.splice(index, 1);
      }
    } else {
      newCollapsedCategories.push(channel.id);
    }
    setCollapsedServerCategories(newCollapsedCategories);
  };

  const onChannelContextMenu = (event: MouseEvent, channel: Channel) => {
    event.preventDefault();
    setContextMenuDetails({
      position: { x: event.clientX, y: event.clientY },
      serverId: params.serverId!,
      channelId: channel.id
    });
  };

  return {
    contextMenuDetails,
    onChannelContextMenu,
    setContextMenuDetails,
    privateChannelIds,
    sortedRootChannels,
    sortedChannels,
    hasModeratorPermission,
    onAddChannelClick,
    member,
    expanded,
    toggleExpanded,
    params: () => params
  };
});

const [categoryController, useCategoryController] = createContextProvider(
  (props: { channel: Channel }) => {
    const controller = useController();

    const sortedCategoryChannels = createMemo(() =>
      controller!
        .sortedChannels()
        .filter((channel) => channel?.categoryId === props.channel.id)
    );

    return { sortedCategoryChannels };
  }
);

export {
  controller as ServerDrawerControllerProvider,
  useController as useServerDrawerController,
  categoryController as CategoryControllerProvider,
  useCategoryController
};
