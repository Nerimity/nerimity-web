import { ChannelType } from "@/chat-api/RawData";
import useStore from "@/chat-api/store/useStore";
import { Rerun } from "@solid-primitives/keyed";
import { useParams } from "solid-navigator";
import { Match, Switch } from "solid-js";
import MessagePane from "../message-pane/MessagePane";

const TextChannels = [ChannelType.DM_TEXT, ChannelType.SERVER_TEXT];

export default function ChannelPane() {
  const params = useParams<{channelId: string, serverId?: string}>();
  const { channels } = useStore();
  const channel = () => channels.get(params.channelId!);

  return (
      <Switch>
        <Match when={TextChannels.includes(channel()?.type!)}><MessagePane /></Match>
      </Switch>
  );
}
