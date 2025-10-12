import serverSettings from "@/common/ServerSettings";
import { Outlet, useParams } from "solid-navigator";
import { createSignal, For, Show } from "solid-js";
import ServerSettingsHeader from "./ServerSettingsHeader";
import useStore from "@/chat-api/store/useStore";
import { styled } from "solid-styled-components";
import Text from "@/components/ui/Text";
import { useTransContext } from "@nerimity/solid-i18lite";
import { createStore } from "solid-js/store";

const SettingsPaneContainer = styled("div")`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 900px;
  align-self: center;
`;

interface ServerSettingsHeaderPreview {
  name?: string;
  avatar?: any;
  banner?: string;
}

export const [serverSettingsHeaderPreview, setServerSettingsHeaderPreview] =
  createStore<ServerSettingsHeaderPreview>({});

export default function ServerSettingsPane() {
  const [t] = useTransContext();
  const params = useParams();
  const { servers } = useStore();

  const server = () => servers.get(params.serverId);

  return (
    <Show when={server()}>
      <SettingsPaneContainer>
        <ServerSettingsHeader />
        <>
          <Outlet name="settingsPane" />
        </>
      </SettingsPaneContainer>
    </Show>
  );
}
