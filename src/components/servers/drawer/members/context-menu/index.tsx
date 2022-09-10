import { useNavigate } from "@solidjs/router";
import { copyToClipboard } from "@/common/clipboard";
import RouterEndpoints from "@/common/RouterEndpoints";
import ContextMenu, { ContextMenuProps } from "@/components/ui/context-menu";
import { createSignal, onCleanup } from "solid-js";
import useStore from "@/chat-api/store/useStore";

type Props = Omit<ContextMenuProps, 'items'> & {
  serverId: string
  userId: string
}

export default function ContextMenuServerMember (props: Props) {
  const navigate = useNavigate();

  const {account, servers} = useStore();

  const server = () => servers.get(props.serverId!);

  const isServerCreator = () => account.user()?.id === server()?.createdById;

  const onLeaveClicked = async () => {
    navigate(RouterEndpoints.INBOX());
    await server()?.leave();
  }

  return (
    <ContextMenu {...props} items={[
      {label: "View Profile"},
      {label: "Edit Role", onClick: () => navigate(RouterEndpoints.SERVER_SETTINGS_INVITES(props.serverId!))},
      {separator: true},
      {label: "Kick", alert: true},
      { label: "Ban", alert: true},
      {separator: true},
      {icon: 'copy', label: "Copy ID", onClick: () => copyToClipboard(props.userId)},
    ]} />
  )
}