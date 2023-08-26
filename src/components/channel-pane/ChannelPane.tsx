import { ChannelType } from "@/chat-api/RawData";
import useStore from "@/chat-api/store/useStore";
import { Rerun } from "@solid-primitives/keyed";
import { useParams } from "@solidjs/router";
import { Match, Switch } from "solid-js";
import MessagePane from "../message-pane/MessagePane";
import VoteChannelPane from "../vote-channel-pane/VoteChannelPane";

const TextChannels = [ChannelType.DM_TEXT, ChannelType.SERVER_TEXT];

export default function ChannelPane(props: { mainPaneEl: HTMLDivElement }) {
  const params = useParams<{channelId: string, serverId?: string}>();
  const { channels } = useStore();
  const channel = () => channels.get(params.channelId!);


  return (
    <Rerun on={() => params.channelId}>
      <Switch>
        <Match when={TextChannels.includes(channel()?.type!)}><MessagePane {...props} /></Match>
        <Match when={channel()?.type! === ChannelType.VOTE}><VoteChannelPane /></Match>
      </Switch>

    </Rerun>
  );
}
