import { copyToClipboard } from "@/common/clipboard";
import RouterEndpoints from "@/common/RouterEndpoints";
import ContextMenu, { ContextMenuProps } from "@/components/ui/context-menu";
import useStore from "@/chat-api/store/useStore";
import { useNavigate } from "@solidjs/router";

type Props = Omit<ContextMenuProps, 'items'> & {
  serverId?: string
}

export default function ContextMenuServer (props: Props) {

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
      {icon: 'markunread_mailbox', label: "Mark As Read", disabled: true},
      {separator: true},
      {icon: 'mail', label: "Invites", onClick: () => navigate(RouterEndpoints.SERVER_SETTINGS_INVITES(props.serverId!))},
      {icon: 'settings', label: "Settings", onClick: () => navigate(RouterEndpoints.SERVER_SETTINGS_GENERAL(props.serverId!))},
      {separator: true},
      {icon: 'copy', label: "Copy ID", onClick: () => copyToClipboard(props.serverId!)},
      {separator: true, show: !isServerCreator()},
      {icon: 'logout', label: "Leave", alert: true, onClick: onLeaveClicked, show: !isServerCreator()},
    ]} />
  )
}