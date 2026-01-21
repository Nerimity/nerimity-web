import { Outlet, useParams } from "solid-navigator";
import { Show } from "solid-js";
import ServerSettingsHeader from "./ServerSettingsHeader";
import useStore from "@/chat-api/store/useStore";
import { styled } from "solid-styled-components";

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

  return (
    <Show when={server()}>
      <SettingsPaneContainer>
        <ServerSettingsHeader />
        <Outlet name="settingsPane" />
      </SettingsPaneContainer>
    </Show>
  );
}
