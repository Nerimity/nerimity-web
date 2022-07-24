import { useNavigate } from "solid-app-router";
import { copyToClipboard } from "@/common/clipboard";
import RouterEndpoints from "@/common/RouterEndpoints";
import ContextMenu, { ContextMenuProps } from "@/components/ui/context-menu";

type Props = Omit<ContextMenuProps, 'items'> & {
  serverId?: string
}

export default function ContextMenuServer (props: Props) {
  const navigate = useNavigate();
  return (
    <ContextMenu {...props} items={[
      {icon: 'markunread_mailbox', label: "Mark As Read", disabled: true},
      {separator: true},
      {icon: 'mail', label: "Invites", onClick: () => navigate(RouterEndpoints.SERVER_SETTINGS_INVITES(props.serverId!))},
      {icon: 'settings', label: "Settings", onClick: () => navigate(RouterEndpoints.SERVER_SETTINGS_GENERAL(props.serverId!))},
      {separator: true},
      {icon: 'copy', label: "Copy ID", onClick: () => copyToClipboard(props.serverId!)},
      {separator: true},
      {icon: 'logout', label: "Leave", alert: true, disabled: true},
    ]} />
  )
}