import { Outlet, useParams } from "solid-navigator";
import { onMount, Show } from "solid-js";
import ServerSettingsHeader from "./ServerSettingsHeader";
import useStore from "@/chat-api/store/useStore";
import { styled } from "solid-styled-components";
import serverSettings from "@/common/ServerSettings";

const SettingsPaneContainer = styled("div")`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 900px;
  align-self: center;
`;

export default function ServerSettingsPane() {
  const params = useParams<{ serverId: string }>();
  const { servers } = useStore();

  const server = () => servers.get(params.serverId);

  onMount(async () => {
    for (let i = 0; i < serverSettings.length; i++) {
      const setting = serverSettings[i];
      await setting?.element.preload(); 
    }
  });

  return (
    <Show when={server()}>
      <SettingsPaneContainer>
        <ServerSettingsHeader />
        <Outlet name="settingsPane" />
      </SettingsPaneContainer>
    </Show>
  );
}
