import useStore from "@/chat-api/store/useStore"
import { JSX, Show, createEffect, createSignal, on, onCleanup } from "solid-js";
import { FlexColumn, FlexRow } from "./ui/Flexbox";
import { styled } from "solid-styled-components";
import Text from "./ui/Text";
import Icon from "./ui/icon/Icon";
import RouterEndpoints from "@/common/RouterEndpoints";
import { CustomLink } from "./ui/CustomLink";
import { timeElapsed } from "@/common/date";
import Button from "./ui/Button";


const InVoiceActionsContainer = styled(FlexRow)`
  background-color: rgba(255, 255, 255, 0.05);
  margin: 5px;
  border-radius: 8px;
  height: 50px;
  flex-shrink: 0;
  align-items: center;
`;
const DetailsContainer = styled(FlexColumn)`

`;

export default function InVoiceActions(props: { style?: JSX.CSSProperties }) {
  const { voiceUsers, channels, servers } = useStore();

  const channelId = () => voiceUsers.currentVoiceChannelId();

  const channel = () => channels.get(channelId()!);
  const server = () => servers.get(channel()?.serverId!);

  const name = () => {
    if (!server()) return channel()?.recipient?.username
    return `${server()?.name} #${channel()?.name}`;
  }

  const href = () => {
    if (!server())
      return RouterEndpoints.INBOX_MESSAGES(channel()?.id!);
    return RouterEndpoints.SERVER_MESSAGES(server()?.id!, channel()?.id!);
  }

  return (
    <Show when={channelId()}>
      <InVoiceActionsContainer style={props?.style}>
        <Icon name="call" color="var(--success-color)" size={18} style={{ padding: "10px", "padding-right": "5px" }} />
        <DetailsContainer>
          <Text size={12}>Connected for <CallTime channelId={channelId()!} /></Text>
          <CustomLink href={href()} decoration style={{ "font-size": "12px" }}>
            {name()}
          </CustomLink>
        </DetailsContainer>
        <ActionButtons channelId={channelId()!} />
      </InVoiceActionsContainer>
    </Show>
  )
}

const ActionButtonsContainer = styled(FlexRow)`
  gap: 5px;
  margin-left: auto;
  margin-right: 10px;
`

function ActionButtons(props: {channelId: string}) {
  const { channels } = useStore();
  const channel = () => channels.get(props.channelId);
  return (
    <ActionButtonsContainer>
      <VoiceMicButton channelId={props.channelId}/>
      <Button margin={0} iconName="call_end" color="var(--alert-color)" iconSize={16} onClick={() => channel()?.leaveCall()} />
    </ActionButtonsContainer>
  )
}


function VoiceMicButton(props: { channelId: string }) {
  const { voiceUsers: {isLocalMicMuted, toggleMic} } = useStore();

  return (
    <>
    <Show when={isLocalMicMuted()}>
      <Button margin={0} iconName='mic_off' iconSize={16} color='var(--alert-color)' onClick={toggleMic} />
    </Show>
    <Show when={!isLocalMicMuted()}>
      <Button margin={0} iconName='mic' iconSize={16} color='var(--success-color)' onClick={toggleMic} />
    </Show> 
    </>
  )
}

function CallTime(props: { channelId: string }) {
  const { channels } = useStore();
  const channel = () => channels.get(props.channelId)

  const [time, setTime] = createSignal<null | string>(null);

  createEffect(on(() => channel()?.callJoinedAt, (joinedAt) => {
    let interval: number;
    if (joinedAt) {
      setTime(timeElapsed(joinedAt))
      interval = window.setInterval(() =>
        setTime(timeElapsed(joinedAt))
        , 1000)
    }
    onCleanup(() => {
      interval && clearInterval(interval);
    })
  }))

  return (
    <Show when={channel()?.callJoinedAt}>
      <Text size={12} opacity={0.6} style={{ "margin-left": "auto" }}>{time()}</Text>
    </Show>
  )
}