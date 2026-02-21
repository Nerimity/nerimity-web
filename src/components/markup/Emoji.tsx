import { classNames } from "@/common/classNames";
import { useWindowProperties } from "@/common/useWindowProperties";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import { css, styled } from "solid-styled-components";
import Text from "../ui/Text";
import { Show, createEffect, createSignal, onMount } from "solid-js";
import { publicServerByEmojiId } from "@/chat-api/services/ServerService";
import { RawExploreItem } from "@/chat-api/RawData";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import useStore from "@/chat-api/store/useStore";
import { ServerVerifiedIcon } from "../servers/ServerVerifiedIcon";
import { useNavigate } from "solid-navigator";
import RouterEndpoints from "@/common/RouterEndpoints";
import { useJoinServer } from "@/chat-api/useJoinServer";

export function Emoji(props: {
  clickable?: boolean;
  custom?: boolean;
  class?: string;
  name: string;
  url: string;
  id?: string;
  animated?: boolean;
  resize?: number;
}) {
  const { shouldAnimate } = useWindowProperties();
  const { createPortal } = useCustomPortal();
  const [hovered, setHovered] = createSignal(false);

  const click = () => {
    createPortal((close) => <EmojiDetailsModal close={close} {...props} />);
  };

  const src = () => {
    if (!props.custom) return props.url;

    const url = new URL(props.url);
    if (!shouldAnimate(hovered()) && props.animated) {
      url.searchParams.set("type", "webp");
    }
    if (props.resize) {
      url.searchParams.set("size", props.resize.toString());
    }
    return url.href;
  };

  return (
    <img
      onClick={props.clickable ? click : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      loading="lazy"
      class={classNames(props.class, "emoji")}
      src={src()}
      alt={props.name}
      title={props.name}
    />
  );
}

const EmojiDetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  overflow: hidden;
  gap: 8px;
  position: relative;
  align-self: center;
  min-width: 200px;

  margin: 10px;
`;

const MainEmojiContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  padding: 6px;
  padding-left: 8px;
  padding-right: 8px;

  word-break: break-word;
  white-space: pre-wrap;
`;

const EmojiNameContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

function EmojiDetailsModal(props: {
  close: () => void;
  name: string;
  url: string;
  animated?: boolean;
  custom?: boolean;
  id?: string;
}) {
  const [publicServer, setPublicServer] = createSignal<RawExploreItem | null>(
    null
  );
  const { shouldAnimate } = useWindowProperties();

  onMount(() => {
    if (!props.custom || !props.id) return;
    publicServerByEmojiId(props.id).then(setPublicServer);
  });
  return (
    <LegacyModal
      close={props.close}
      icon="face"
      title={props.custom ? "Custom Emoji" : "Emoji"}
    >
      <EmojiDetailsContainer>
        <MainEmojiContainer>
          <img
            loading="lazy"
            style={{
              "object-fit": "contain",
              width: "60px",
              height: "60px",
              "border-radius": "6px",
            }}
            src={
              props.url + (props.animated && !shouldAnimate(true) ? "?type=webp" : "")
            }
            alt={props.name}
            title={props.name}
          />
          <EmojiNameContainer>
            <Text size={18}>
              :
              <Text size={18} color="var(--primary-color)">
                {props.name}
              </Text>
              :
            </Text>
            <Text size={12} opacity={0.6}>
              {props.custom ? "Custom Emoji" : "Emoji"}
            </Text>
          </EmojiNameContainer>
        </MainEmojiContainer>

        <Show when={props.custom}>
          <PublicServer
            close={props.close}
            publicServer={publicServer()!}
            emojiId={props.id!}
          />
        </Show>
      </EmojiDetailsContainer>
    </LegacyModal>
  );
}

const PublicServerContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 6px;
  padding-left: 12px;
  padding-right: 6px;
  border-radius: 6px;
`;

const PublicServerDetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
`;

const PublicServerNameContainer = styled.span`
  display: inline;
  vertical-align: 1.3;
`;

function PublicServer(props: {
  publicServer?: RawExploreItem;
  emojiId?: string;
  close: () => void;
}) {
  const [hovered, setHovered] = createSignal(false);
  const { joinPublicById, joining } = useJoinServer();
  const navigate = useNavigate();
  const { servers } = useStore();

  const serverId = () => {
    if (props.publicServer) return props.publicServer.server?.id;
    const emoji = servers
      .emojisUpdatedDupName()
      .find((e) => e.id === props.emojiId);
    return emoji?.serverId;
  };

  const server = () => props.publicServer?.server! || servers.get(serverId()!);
  const isInServer = () => servers.get(serverId()!);

  const joinOrVisitServer = () => {
    if (isInServer())
      return navigate(
        RouterEndpoints.SERVER_MESSAGES(server().id, server().defaultChannelId)
      );

    if (joining()) return;

    joinPublicById(serverId()!);
  };

  return (
    <Show when={server()}>
      <PublicServerContainer
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Avatar animate={hovered()} size={40} server={server()} />
        <PublicServerDetailsContainer>
          <PublicServerNameContainer>
            <Text size={14}>{server().name}</Text>
            <Show when={props.publicServer?.server?.verified}>
              {" "}
              <ServerVerifiedIcon
                class={css`
                  vertical-align: -3px;
                `}
              />
            </Show>
          </PublicServerNameContainer>
          <Button
            onClick={joinOrVisitServer}
            styles={{ "align-self": "flex-start" }}
            iconName="login"
            label={isInServer() ? "Visit Server" : "Join Server"}
            margin={0}
          />
        </PublicServerDetailsContainer>
      </PublicServerContainer>
    </Show>
  );
}
