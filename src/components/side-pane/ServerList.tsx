import style from "./ServerList.module.css";
import {
  createServerFolder,
  updateServerFolder,
  updateServerOrder,
} from "@/chat-api/services/ServerService";
import useStore from "@/chat-api/store/useStore";
import { useDocumentListener } from "@/common/useDocumentListener";
import {
  createMemo,
  createSignal,
  Show,
  For,
  createEffect,
  onMount,
  onCleanup,
} from "solid-js";
import Sortable, { SortableEvent } from "solid-sortablejs";
import ContextMenuServer from "../servers/context-menu/ContextMenuServer";
import { Skeleton } from "../ui/skeleton/Skeleton";
import { Tooltip } from "../ui/Tooltip";
import { RawServerFolder } from "@/chat-api/RawData";
import { Server } from "@/chat-api/store/useServers";
import Icon from "../ui/icon/Icon";
import Avatar from "../ui/Avatar";
import { A, useMatch, useParams } from "solid-navigator";
import RouterEndpoints from "@/common/RouterEndpoints";
import { getLastSelectedChannelId } from "@/common/useLastSelectedServerChannel";
import { NotificationCountBadge } from "./NotificationCountBadge";
import { SidebarItemContainer } from "./SidebarItemContainer";
import ContextMenuServerFolder from "./ContextMenuServerFolder";
import { messagesPreloader } from "@/common/createPreloader";

const [draggingId, setDraggingId] = createSignal<string | null>(null);
const [draggedOverId, setDraggedOverId] = createSignal<string | null>(null);
const [draggedOverEl, setDraggedOverEl] = createSignal<HTMLElement | null>(
  null
);
const [isDraggedOverItem, setIsDraggedOverItem] = createSignal(false);
const [openedFolderIds, setOpenedFolderIds] = createSignal<string[]>([]);

export function ServerFolderItem(props: {
  folder: RawServerFolder;
  size: number;
  ghost?: boolean;
  onServerContextMenu?: (e: MouseEvent, server: Server) => void;
  onFolderContextMenu?: (e: MouseEvent, folder: RawServerFolder) => void;
  openedWithoutList?: boolean;
}) {
  const params = useParams<{ serverId?: string }>();
  const opened = () => {
    if (props.openedWithoutList) return true;
    return openedFolderIds().includes(props.folder.id);
  };
  const toggleOpened = () => {
    if (opened()) {
      setOpenedFolderIds(
        openedFolderIds().filter((id) => id !== props.folder.id)
      );
      return;
    }

    if (!opened()) {
      setOpenedFolderIds([...openedFolderIds(), props.folder.id]);
    }
  };

  const store = useStore();

  const folderServers = () => {
    const servers = props.folder.serverIds.map(
      (id) => store.servers.get(id) as Server
    );

    if (
      isDraggedOverItem() &&
      draggingId() &&
      draggedOverId() === props.folder.id
    ) {
      const server = store.servers.get(draggingId()!);
      if (server) servers.push(server);
    }

    return servers.filter(Boolean);
  };

  const folderSelected = () => {
    if (!params.serverId) return false;
    return props.folder.serverIds.includes(params.serverId);
  };

  const hasNotifications = () => {
    return !!folderServers().find((s) => s.hasNotifications());
  };
  const mentionCount = createMemo(() => {
    return folderServers()
      .map((s) => s.mentionCount())
      .reduce((a, b) => a + b, 0);
  });
  return (
    <div
      class={style.folderOuterContainer}
      style={{ "--folder-color": props.folder.color }}
    >
      <Tooltip tooltip={props.folder.name}>
        <Show
          when={!opened()}
          fallback={
            <div
              onContextMenu={(e) =>
                props.onFolderContextMenu?.(e, props.folder)
              }
              class={style.folderOpenedIconContainer}
              onClick={() => toggleOpened()}
            >
              <Icon
                name="folder_open"
                color="var(--folder-color)"
                size={props.size - props.size * 0.58}
              />
            </div>
          }
        >
          <div
            onContextMenu={(e) => props.onFolderContextMenu?.(e, props.folder)}
            class={style.folderContainer}
            data-alert={hasNotifications()}
            data-selected={folderSelected()}
            classList={{ [style.opened!]: opened() }}
            onClick={() => toggleOpened()}
            onPointerLeave={() => {
              if (props.ghost) return;
              setDraggedOverId(null);
              setDraggedOverEl(null);
            }}
            onPointerMove={(e) => {
              if (props.ghost) return;
              const target = e.currentTarget;

              if (props.folder.id === draggingId()) {
                setDraggedOverId(null);
                setDraggedOverEl(null);
                return;
              }

              setDraggedOverId(props.folder.id);
              setDraggedOverEl(target);
            }}
            style={{
              background:
                props.ghost ||
                (isDraggedOverItem() &&
                  draggingId() &&
                  draggedOverId() === props.folder.id)
                  ? "var(--primary-color)"
                  : "",
            }}
          >
            <Show when={mentionCount()}>
              <NotificationCountBadge
                count={mentionCount()}
                top={0}
                right={0}
              />
            </Show>
            <div class={style.folderInnerContainer}>
              <For each={folderServers().slice(0, 4)}>
                {(server) => (
                  <Avatar
                    resize={128}
                    size={props.size - props.size * 0.65}
                    server={server}
                  />
                )}
              </For>
              <Show when={folderServers().length < 4}>
                <For each={Array(4 - folderServers().length)}>
                  {() => (
                    <div
                      style={{
                        width: props.size - props.size * 0.63 + "px",
                        height: props.size - props.size * 0.63 + "px",
                      }}
                    />
                  )}
                </For>
              </Show>
            </div>
          </div>
        </Show>
      </Tooltip>

      <Show when={opened() && !props.openedWithoutList}>
        <div>
          <Sortable
            class={style.folderList}
            animation={0}
            group="server-list"
            delay={300}
            delayOnTouchOnly={true}
            invertSwap={true}
            swapThreshold={0.1}
            id={`folderList-${props.folder.id}`}
            idField={"id"}
            items={folderServers()}
            onEnd={(event) => {
              if (event.from === event.to) return;
              // when dragging a server outside of a folder.
              const index = event.oldIndex;
              const serverItem = folderServers()[index!];
              if (!serverItem) return;

              const newFolderItems = folderServers().filter(
                (s) => s.id !== serverItem!.id
              );

              updateServerFolder(
                props.folder.id,
                newFolderItems.map((s) => s.id)
              );
            }}
            setItems={(items, event) => {
              if (event.from !== event.to) return;

              // Ordering servers inside a folder.
              updateServerFolder(
                props.folder.id,
                items.map((s) => s.id)
              );
            }}
            forceFallback={true}
          >
            {(server) => (
              <ServerItem
                onContextMenu={(e) => props.onServerContextMenu?.(e, server)}
                server={server}
                size={props.size}
              />
            )}
          </Sortable>
        </div>
      </Show>
    </div>
  );
}

const ServerListSkeleton = (props: { size: number }) => {
  return (
    <Skeleton.List>
      <Skeleton.Item
        style={{ "aspect-ratio": "1/0.768" }}
        width={props.size + "px"}
      />
    </Skeleton.List>
  );
};

function ServerItem(props: {
  server: Server;
  onContextMenu?: (e: MouseEvent) => void;
  size: number;
}) {
  const { id, defaultChannelId } = props.server;
  const hasNotifications = () => props.server.hasNotifications();
  const selected = useMatch(() => RouterEndpoints.SERVER(id) + "/*");
  const [hovered, setHovered] = createSignal(false);

  return (
    <Tooltip tooltip={props.server.name}>
      <A
        href={RouterEndpoints.SERVER_MESSAGES(
          id,
          getLastSelectedChannelId(id, defaultChannelId)
        )}
        onMouseEnter={() => {
          setHovered(true);
          messagesPreloader.preload(
            getLastSelectedChannelId(id, defaultChannelId)
          );
        }}
        onMouseLeave={() => setHovered(false)}
        onContextMenu={props.onContextMenu}
      >
        <SidebarItemContainer
          class={style.serverItem}
          alert={hasNotifications()}
          selected={selected()}
        >
          <NotificationCountBadge
            count={props.server.mentionCount()}
            top={5}
            right={10}
          />
          <Avatar
            resize={128}
            animate={hovered()}
            size={props.size - props.size * 0.4}
            server={props.server}
          />
        </SidebarItemContainer>
      </A>
    </Tooltip>
  );
}

export const ServerList = (props: { size: number }) => {
  const { servers, account } = useStore();
  const [contextPosition, setContextPosition] = createSignal<
    { x: number; y: number } | undefined
  >();
  const [contextServerId, setContextServerId] = createSignal<
    string | undefined
  >();

  const [contextServerFolder, setContextServerFolder] = createSignal<null | {
    position: { x: number; y: number };
    folderId: string;
  }>(null);

  const onContextMenu = (event: MouseEvent, serverId: string) => {
    event.preventDefault();
    setContextServerId(serverId);
    setContextPosition({ x: event.clientX, y: event.clientY });
  };

  const onFolderContextMenu = (event: MouseEvent, folderId: string) => {
    event.preventDefault();
    setContextServerFolder({
      position: { x: event.clientX, y: event.clientY },
      folderId,
    });
  };

  const serversAndFolders = createMemo(() => {
    return servers.orderedArray(true).map((s) => {
      if (s.type === "server") {
        const isInFolder = servers
          .validServerFolders()
          ?.find((f) => f.serverIds.includes(s.id));
        if (isInFolder) {
          return { ...s, hide: true };
        }
      }
      return { ...s, hide: false };
    });
  });
  type ServerOrFolder = ReturnType<typeof serversAndFolders>[number];

  const draggedOverItem = () => {
    if (isDraggedOverItem()) {
      const isServerDragging =
        serversAndFolders().find((s) => s.id === draggingId())?.type ===
        "server";

      const draggedOverItem = serversAndFolders().find(
        (s) => s.id === draggedOverId()
      );

      if (isServerDragging && draggedOverItem) {
        return draggedOverItem;
      }
    }
  };

  const onDrop = (servers: ServerOrFolder[], event: SortableEvent) => {
    // is dragging over folder or out of folder
    if (draggedOverItem()) {
      return;
    }

    const serverIds = servers.map((item) => item.id);

    const newIndex = event.newIndex!;
    const indexToDeleteDuplicate = serverIds.findIndex(
      (s, i) => s === serverIds[newIndex] && i !== newIndex
    );

    if (indexToDeleteDuplicate !== -1) {
      serverIds.splice(indexToDeleteDuplicate, 1);
    }
    updateServerOrder(serverIds);
  };

  useDocumentListener("pointermove", (event) => {
    if (!draggedOverEl()) {
      return;
    }
    const rect = draggedOverEl()?.getBoundingClientRect()!;

    const itemTriggerHeight = 48 / 4;

    const top = rect.top;
    const bottom = rect.bottom;
    const isTopTriggered = event.clientY >= top + itemTriggerHeight;
    const isBottomTriggered = event.clientY <= bottom - itemTriggerHeight;

    const isItemHovered = isTopTriggered && isBottomTriggered;

    setIsDraggedOverItem(isItemHovered);
  });

  const onMouseUp = () => {
    setTimeout(() => {
      setDraggingId(null);
    }, 10);
  };
  onMount(() => {
    document.addEventListener("pointerup", onMouseUp);
    onCleanup(() => {
      document.removeEventListener("pointerup", onMouseUp);
    });
  });
  return (
    <div class={style.serverListContainer}>
      <ContextMenuServer
        position={contextPosition()}
        onClose={() => setContextPosition(undefined)}
        serverId={contextServerId()}
      />
      <ContextMenuServerFolder
        {...contextServerFolder()}
        onClose={() => setContextServerFolder(null)}
      />
      <Show
        when={account.lastAuthenticatedAt()}
        fallback={<ServerListSkeleton size={props.size} />}
      >
        <Sortable
          group="server-list"
          onStart={() => setContextPosition(undefined)}
          class={style.serverList}
          idField="id"
          delay={300}
          delayOnTouchOnly={true}
          forceFallback={true}
          setItems={onDrop}
          onMove={(e) => {
            if (e.from !== e.to) {
              if (!draggingId()) return false;
            }
          }}
          swapThreshold={0.1}
          onClone={(evt) => {
            const index = evt.oldIndex;
            if (index === undefined) return;
            const item = serversAndFolders()[index];
            if (item?.type === "folder") {
              setDraggingId(null);
              return;
            }

            setDraggingId(item?.id || null);
          }}
          onEnd={(e) => {
            // when dragging a server inside an opened folder
            if (e.from !== e.to) {
              const folderId = e.to.id.split("-")[1];

              const folder = servers
                .validServerFolders()
                ?.find((f) => f.id === folderId)!;

              const serverIds = [...folder.serverIds];

              const newIndex = e.newIndex;

              serverIds!.splice(newIndex!, 0, draggingId()!);

              updateServerFolder(folder.id, serverIds);
            }
            if (draggedOverItem()) {
              // when dragging a server over a server (create new folder)
              if (draggedOverItem()?.type === "server") {
                const serverIds = [draggedOverId()!, draggingId()!];
                createServerFolder(serverIds);
              }
              // when dragging a server over a folder
              if (draggedOverItem()?.type === "folder") {
                const folder = draggedOverItem() as RawServerFolder;
                const folderServerIds = [...folder.serverIds];
                folderServerIds.push(draggingId()!);
                updateServerFolder(folder.id, folderServerIds);
              }
            }

            setDraggingId(null);
            setDraggedOverId(null);
            setDraggedOverEl(null);
          }}
          invertSwap={true}
          animation={0}
          items={serversAndFolders()}
        >
          {(server) => (
            <Show when={!server.hide}>
              <Show
                when={server.type === "server"}
                fallback={
                  <ServerFolderItem
                    folder={server as RawServerFolder}
                    onServerContextMenu={(e, s) => onContextMenu(e, s.id)}
                    onFolderContextMenu={(e, f) => onFolderContextMenu(e, f.id)}
                    size={props.size}
                  />
                }
              >
                <div
                  onPointerMove={(e) => {
                    const target = e.currentTarget;
                    if (server.id === draggingId()) {
                      setDraggedOverId(null);
                      setDraggedOverEl(null);
                      return;
                    }

                    setDraggedOverId(server.id);
                    setDraggedOverEl(target);
                  }}
                  onPointerLeave={() => setDraggedOverId(null)}
                >
                  <Show
                    when={
                      draggingId() &&
                      draggedOverId() === server.id &&
                      isDraggedOverItem() &&
                      draggedOverId() !== draggingId()
                    }
                    fallback={
                      <ServerItem
                        server={server! as Server}
                        size={props.size}
                        onContextMenu={(e) => onContextMenu(e, server!.id)}
                      />
                    }
                  >
                    <ServerFolderItem
                      ghost
                      folder={{
                        id: "new",
                        name: "New Folder",
                        color: "#000000",
                        serverIds: [server.id, draggingId()!],
                      }}
                      size={props.size}
                    />
                  </Show>
                </div>
              </Show>
            </Show>
          )}
        </Sortable>
      </Show>
    </div>
  );
};
