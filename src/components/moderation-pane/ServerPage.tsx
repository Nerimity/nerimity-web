import { RawPublicServer, RawServer, RawUser } from "@/chat-api/RawData";
import {
  getServer,
  pinServer,
  unpinServer,
  updateServer,
} from "@/chat-api/services/ModerationService";
import { createUpdatedSignal } from "@/common/createUpdatedSignal";
import { useWindowProperties } from "@/common/useWindowProperties";
import { useNavigate, useParams } from "solid-navigator";
import { Show, createEffect, createSignal, onMount } from "solid-js";
import { AuditLogPane, User } from "./ModerationPane";
import Text from "../ui/Text";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import Input from "../ui/input/Input";
import Checkbox from "../ui/Checkbox";
import Button from "../ui/Button";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { Banner } from "../ui/Banner";
import Avatar from "../ui/Avatar";
import { css, styled } from "solid-styled-components";
import { bannerUrl } from "@/chat-api/store/useServers";
import DeleteServerModal from "./DeleteServerModal";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import { UsersPane } from "./UsersPane";
import { UsersAuditLogsPane } from "./UsersAuditLogsPane";
import DeleteServersModal from "./DeleteServersModal";
import { formatTimestamp } from "@/common/date";
import UndoServerDeleteModal from "./UndoServerDeleteModal";
import { useModerationServerDeletedListener } from "@/common/GlobalEvents";
import useStore from "@/chat-api/store/useStore";
import RouterEndpoints from "@/common/RouterEndpoints";
import { useJoinServer } from "@/chat-api/useJoinServer";

export default function ServerPage() {
  const params = useParams<{ serverId: string }>();
  const { width } = useWindowProperties();
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const [server, setServer] = createSignal<
    (RawServer & { createdBy: RawUser }) | null
  >(null);

  const defaultInput = () => ({
    name: server()?.name || "",
    verified: server()?.verified || false,
    password: "",
  });

  const deleteListener = useModerationServerDeletedListener();

  deleteListener((servers) => {
    if (servers[0].id === server()?.id) {
      setServer({
        ...server()!,
        scheduledForDeletion: {
          scheduledAt: Date.now(),
        },
      });
    }
  });

  const [inputValues, updatedInputValues, setInputValue] =
    createUpdatedSignal(defaultInput);

  onMount(() => {
    getServer(params.serverId).then(setServer);
  });

  const requestStatus = () => (requestSent() ? "Saving..." : "Save Changes");
  const onSaveButtonClicked = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError(null);
    const values = updatedInputValues();
    await updateServer(params.serverId, values)
      .then(() => {
        setServer(() => ({ ...server()!, ...values, password: "" }));
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setRequestSent(false));
  };

  return (
    <Show when={server()}>
      <ServerPageContainer>
        <ServerPageInnerContainer>
          <Banner
            class={css`
              margin-bottom: 15px;
            `}
            margin={0}
            maxHeight={250}
            animate
            url={bannerUrl(server()!)}
            hexColor={server()!.hexColor}
          >
            <ServerBannerContainer>
              {server && (
                <Avatar
                  animate
                  server={server()!}
                  size={width() <= 1100 ? 70 : 100}
                />
              )}
              <ServerBannerDetails>
                <div>{server()!.name}</div>
                <Text opacity={0.7} size={14}>
                  {JSON.stringify(server()!._count.serverMembers)} members
                </Text>
              </ServerBannerDetails>
            </ServerBannerContainer>
          </Banner>
          <Breadcrumb>
            <BreadcrumbItem href={"../../"} icon="home" title="Moderation" />
            <BreadcrumbItem title={server()?.name} icon="dns" />
          </Breadcrumb>

          <div
            style={{
              display: "flex",
              "flex-direction": "column",
              gap: "4px",
              "margin-bottom": "10px",
            }}
          >
            <Text size={14} style={{ "margin-left": "45px" }}>
              Created By
            </Text>
            <User
              user={server()?.createdBy}
              class={css`
                border: none;
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.05);
              `}
            />
          </div>

          <Show when={server()?.publicServer}>
            <PublicServerBlock server={server()} />
          </Show>
          <Show when={!server()?.scheduledForDeletion}>
            <DeleteServerBlock serverId={server()?.id!} />
          </Show>

          <Show when={server()?.scheduledForDeletion}>
            <UndoDeleteServerBlock
              server={server()!}
              done={() => {
                setServer({ ...server()!, scheduledForDeletion: undefined });
              }}
            />
          </Show>

          <SettingsBlock label="Server Name" icon="edit">
            <Input
              value={inputValues().name}
              onText={(v) => setInputValue("name", v)}
            />
          </SettingsBlock>
          <SettingsBlock label="Verified" icon="verified">
            <Checkbox
              checked={inputValues().verified}
              onChange={(v) => setInputValue("verified", v)}
            />
          </SettingsBlock>

          <div style={{ "margin-bottom": "4px" }}>
            <UsersPane
              title="Members"
              search={params.serverId}
              hideSearchBar
              noMargin
            />
          </div>
          <div style={{ "margin-bottom": "10px" }}>
            <UsersAuditLogsPane
              title="Server Audit Logs"
              search={params.serverId}
              hideSearchBar
              noMargin
            />
          </div>

          <AuditLogPane search={params.serverId} style={{ margin: 0 }} />

          <Show when={Object.keys(updatedInputValues()).length}>
            <SettingsBlock
              label="Confirm Admin Password"
              icon="security"
              class={css`
                margin-top: 10px;
              `}
            >
              <Input
                type="password"
                value={inputValues().password}
                onText={(v) => setInputValue("password", v)}
              />
            </SettingsBlock>
            <Show when={error()}>
              <Text color="var(--alert-color)">{error()}</Text>
            </Show>

            <Button
              iconName="save"
              label={requestStatus()}
              class={css`
                align-self: flex-end;
              `}
              onClick={onSaveButtonClicked}
            />
          </Show>
        </ServerPageInnerContainer>
      </ServerPageContainer>
    </Show>
  );
}

const ServerPageContainer = styled(FlexColumn)`
  height: 100%;
  width: 100%;
  max-width: 900px;
  align-self: center;
  margin-top: 10px;
`;
const ServerPageInnerContainer = styled(FlexColumn)`
  margin: 10px;
`;
const ServerBannerContainer = styled(FlexRow)`
  display: flex;
  align-items: center;
  margin-left: 30px;
  height: 100%;
  z-index: 11111;
`;
const ServerBannerDetails = styled(FlexColumn)`
  margin-left: 20px;
  margin-right: 20px;
  font-size: 18px;
  z-index: 1111;
  background: rgba(0, 0, 0, 0.86);
  backdrop-filter: blur(34px);
  padding: 10px;
  border-radius: 8px;
`;

const PublicServerBlock = (props: {
  server: RawServer & { publicServer: RawPublicServer };
}) => {
  const { joinPublicById, joining: joinClicked } = useJoinServer();
  const store = useStore();
  const [isPinned, setIsPinned] = createSignal(
    !!props.server.publicServer.pinnedAt
  );

  const cacheServer = () => store.servers.get(props.server.id);

  const onClick = async () => {
    if (cacheServer()) return;
    await joinPublicById(props.server.id);
  };
  const onPinClicked = async () => {
    if (isPinned())
      return unpinServer(props.server.id)
        .then(() => setIsPinned(false))
        .catch((err) => alert(err.message));
    pinServer(props.server.id)
      .then(() => setIsPinned(true))
      .catch((err) => alert(err.message));
  };

  return (
    <>
      <SettingsBlock icon="public" label="Public Server">
        <Button
          onClick={onClick}
          label={
            cacheServer()
              ? "Visit"
              : joinClicked()
              ? "Joining..."
              : "Join Server"
          }
          primary
        />
      </SettingsBlock>
      <SettingsBlock
        class={css`
          && {
            margin-bottom: 20px;
          }
        `}
        icon="public"
        label="Pin Server"
      >
        <Button
          onClick={onPinClicked}
          label={isPinned() ? "Unpin Server" : "Pin Server"}
          color={isPinned() ? "var(--alert-color)" : "var(--primary-color)"}
          primary
        />
      </SettingsBlock>
    </>
  );
};
const DeleteServerBlock = (props: { serverId: string }) => {
  const { createPortal } = useCustomPortal();

  const showSuspendModal = () => {
    createPortal((close) => (
      <DeleteServersModal
        close={close}
        servers={[{ id: props.serverId }]}
        done={() => {}}
      />
    ));
  };

  return (
    <SettingsBlock
      class={css`
        && {
          margin-bottom: 20px;
        }
      `}
      icon="delete"
      label="Delete Server"
    >
      <Button
        onClick={showSuspendModal}
        label="Delete Server"
        color="var(--alert-color)"
        primary
      />
    </SettingsBlock>
  );
};

const UndoDeleteServerBlock = (props: {
  server: RawServer;
  done: () => void;
}) => {
  const { createPortal } = useCustomPortal();

  const onClick = () => {
    createPortal((close) => (
      <UndoServerDeleteModal
        close={close}
        server={props.server}
        done={props.done}
      />
    ));
  };
  const fiveDaysToMs = 5 * 24 * 60 * 60 * 1000;

  const deletedMs = () =>
    props.server.scheduledForDeletion!.scheduledAt + fiveDaysToMs;
  const deletionDate = () => formatTimestamp(deletedMs());

  return (
    <SettingsBlock
      class={css`
        && {
          margin-bottom: 20px;
        }
      `}
      icon="undo"
      label="Scheduled for Deletion"
      description={`Server will be deleted ${deletionDate()}`}
    >
      <Button
        onClick={onClick}
        label="Undo"
        color="var(--alert-color)"
        primary
      />
    </SettingsBlock>
  );
};
