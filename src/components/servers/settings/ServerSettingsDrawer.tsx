import ServerDrawerHeader from "@/components/servers/drawer/header/ServerDrawerHeader";
import Icon from "@/components/ui/icon/Icon";
import { A, useMatch, useParams } from "solid-navigator";
import { For, Show } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import RouterEndpoints from "@/common/RouterEndpoints";
import serverSettings from "@/common/ServerSettings";
import ItemContainer from "@/components/ui/LegacyItem";
import { styled } from "solid-styled-components";
import Text from "@/components/ui/Text";
import { useTransContext } from "@nerimity/solid-i18lite";
import { Bitwise } from "@/chat-api/Bitwise";
import { ChannelType } from "@/chat-api/RawData";
import InVoiceActions from "@/components/InVoiceActions";
import { useCustomScrollbar } from "@/components/custom-scrollbar/CustomScrollbar";
import { SupportBlock } from "@/components/SupportBlock";
import { FlexColumn } from "@/components/ui/Flexbox";
import { useWindowProperties } from "@/common/useWindowProperties";

const MainContainer = styled(FlexColumn)`
  height: 100%;
  padding-left: 2px;
  padding-right: 4px;
`;
const SettingsListContainer = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 3px;
  flex: 1;
`;

const SettingItemContainer = styled(ItemContainer)<{ nested?: boolean }>`
  height: 32px;
  gap: 5px;
  padding-left: ${(props) => (props.nested ? "25px" : "10px")};
  margin-left: 3px;
  margin-right: 3px;

  .label {
    opacity: ${(props) => (props.selected ? 1 : 0.6)};
    transition: 0.2s;
    font-size: 14px;
    color: var(--text-color);
  }

  &:hover .label {
    opacity: 1;
  }
`;

export default function ServerSettingsDrawer() {
  return (
    <>
      <ServerDrawerHeader />
      <MainContainer>
        <SettingsList />
        <Footer />
      </MainContainer>
    </>
  );
}

function SettingsList() {
  const [t] = useTransContext();
  const params = useParams();
  const { serverMembers, account, servers } = useStore();
  const member = () => serverMembers.get(params.serverId, account.user()?.id!);
  const server = () => servers.get(params.serverId);

  const hasPermission = (role?: Bitwise) => {
    if (!role) return true;
    if (server()?.createdById === account.user()?.id) return true;
    return serverMembers?.hasPermission(member()!, role);
  };

  return (
    <SettingsListContainer>
      <For each={serverSettings}>
        {(setting) => {
          if (setting.hideDrawer) return null;
          const selected = () => params.path === setting.path;
          // const isChannels = () => setting.path === "channels";
          return (
            <Show when={hasPermission(setting.requiredRolePermission)}>
              <Item
                path={setting.path || "#  "}
                icon={setting.icon}
                label={setting.name()}
                selected={selected()}
              />
              {/* <Show when={isChannels() && selected()}><ServerChannelsList/></Show> */}
            </Show>
          );
        }}
      </For>
    </SettingsListContainer>
  );
}

function Item(props: {
  path: string;
  icon: string;
  label: string;
  selected?: boolean;
  nested?: boolean;
  onClick?: () => void;
}) {
  const params = useParams();

  const href = () => {
    if (props.nested) return props.path;
    return "/app/servers/" + params.serverId + "/settings/" + props.path;
  };

  const selected = useMatch(() => href() + "/*");

  return (
    <A href={href()} style={{ "text-decoration": "none" }}>
      <SettingItemContainer nested={props.nested} selected={selected()}>
        <Icon name={props.icon} size={18} />
        <div class="label">{props.label}</div>
      </SettingItemContainer>
    </A>
  );
}

const FooterContainer = styled(FlexColumn)`
  margin-top: 8px;
  position: sticky;
  bottom: 2px;
  background-color: var(--pane-color);
  &[data-mobile-width="true"] {
    padding-bottom: 74px;
  }
`;

function Footer() {
  const { isMobileWidth } = useWindowProperties();
  return (
    <FooterContainer gap={2} data-mobile-width={isMobileWidth()}>
      <SupportBlock />
      <InVoiceActions style={isMobileWidth() ? { bottom: "76px" } : {}} />
    </FooterContainer>
  );
}
