import useStore from "@/chat-api/store/useStore";
import { JSX, Show, createEffect, createSignal, on, onCleanup } from "solid-js";
import { FlexColumn, FlexRow } from "./ui/Flexbox";
import { styled } from "solid-styled-components";
import Text from "./ui/Text";
import Icon from "./ui/icon/Icon";
import RouterEndpoints from "@/common/RouterEndpoints";
import { CustomLink } from "./ui/CustomLink";
import { timeSinceDigital } from "@/common/date";
import Button from "./ui/Button";
import { useTransContext } from "@nerimity/solid-i18lite";

const InVoiceActionsContainer = styled(FlexColumn)`
  background-color: rgb(15, 15, 15);
  margin: 3px;
  margin-bottom: 0;
  border-radius: 6px;
  flex-shrink: 0;
  padding-top: 6px;

  position: sticky;
  bottom: 5px;
  z-index: 11111111;
`;
const DetailsContainer = styled(FlexColumn)`
  overflow: hidden;
  gap: 2px;
  margin-right: 5px;
`;

export default function InVoiceActions(props: { style?: JSX.CSSProperties }) {
  const { voiceUsers, channels, servers } = useStore();

  const channelId = () => voiceUsers.currentUser()?.channelId;

  const channel = () => channels.get(channelId()!);
  const server = () => servers.get(channel()?.serverId!);

  const name = () => {
    if (!server()) return channel()?.recipient()?.username;
    return `${server()?.name}#${channel()?.name}`;
  };

  const href = () => {
    if (!server()) return RouterEndpoints.INBOX_MESSAGES(channel()?.id!);
    return RouterEndpoints.SERVER_MESSAGES(server()?.id!, channel()?.id!);
  };

  const [t] = useTransContext();

  return (
    <Show when={channelId()}>
      <InVoiceActionsContainer style={props?.style}>
        <FlexRow>
          <Icon
            name="call"
            color="var(--success-color)"
            size={18}
            style={{ padding: "10px", "padding-right": "5px" }}
          />
          <DetailsContainer>
            <Text size={12}>
              {t("inVoiceActions.connectedFor")} <CallTime channelId={channelId()!} />
            </Text>
            <CustomLink
              href={href()}
              decoration
              style={{
                "font-size": "12px",
                "white-space": "nowrap",
                overflow: "hidden",
                "text-overflow": "ellipsis",
              }}
            >
              {name()}
            </CustomLink>
          </DetailsContainer>
        </FlexRow>
        <ActionButtons channelId={channelId()!} />
      </InVoiceActionsContainer>
    </Show>
  );
}

const ActionButtonsContainer = styled(FlexRow)`
  gap: 5px;
  padding: 5px;
  padding-top: 0;
  button {
    flex: 1;
  }
`;

function ActionButtons(props: { channelId: string }) {
  const { channels } = useStore();
  const channel = () => channels.get(props.channelId);
  return (
    <ActionButtonsContainer>
      <VoiceDeafenButton channelId={props.channelId} />
      <VoiceMicButton channelId={props.channelId} />
      <Button
        margin={0}
        iconName="call_end"
        color="var(--alert-color)"
        iconSize={16}
        onClick={() => channel()?.leaveCall()}
      />
    </ActionButtonsContainer>
  );
}

function VoiceMicButton(props: { channelId: string }) {
  const {
    voiceUsers: { isLocalMicMuted, toggleMic, deafened },
  } = useStore();

  const isDeafened = () => deafened.enabled;

  return (
    <Show when={!isDeafened()}>
      <Show when={isLocalMicMuted()}>
        <Button
          margin={0}
          iconName="mic_off"
          iconSize={16}
          color="var(--alert-color)"
          onClick={toggleMic}
        />
      </Show>
      <Show when={!isLocalMicMuted()}>
        <Button
          margin={0}
          iconName="mic"
          iconSize={16}
          color="var(--success-color)"
          onClick={toggleMic}
        />
      </Show>
    </Show>
  );
}
function VoiceDeafenButton(props: { channelId: string }) {
  const { voiceUsers } = useStore();

  const isDeafened = () => voiceUsers.deafened.enabled;

  return (
    <>
      <Show when={isDeafened()}>
        <Button
          margin={0}
          iconName="headset_off"
          iconSize={16}
          color="var(--alert-color)"
          onClick={voiceUsers.toggleDeafen}
        />
      </Show>
      <Show when={!isDeafened()}>
        <Button
          margin={0}
          iconName="headset_mic"
          iconSize={16}
          color="var(--primary-color)"
          onClick={voiceUsers.toggleDeafen}
        />
      </Show>
    </>
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
          interval && clearInterval(interval);
        });
      }
    )
  );

  return (
    <Show when={channel()?.callJoinedAt}>
      <Text size={12} opacity={0.6} style={{ "margin-left": "auto" }}>
        {time()}
      </Text>
    </Show>
  );
}
