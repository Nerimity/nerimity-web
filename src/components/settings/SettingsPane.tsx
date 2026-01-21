import { Outlet, useLocation, useMatch } from "solid-navigator";
import { Show, createEffect } from "solid-js";
import SettingsHeader from "./SettingsHeader";
import useStore from "@/chat-api/store/useStore";
import { styled } from "solid-styled-components";
import { useTransContext } from "@nerimity/solid-i18lite";
import settings from "@/common/Settings";

const SettingsPaneContainer = styled("div")`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 900px;
  align-self: center;
`;

export default function SettingsPane() {
  const { account } = useStore();
  const user = () => account.user();

  const matchingSettingsPane = () => {
    return settings.find((s) => {
      const match = useMatch(() => `/app/settings/${s.routePath}`);
      return match();
    });
  };

  return (
    <Show when={user()}>
      <SettingsPaneContainer>
        <Show when={!matchingSettingsPane()?.hideHeader}>
          <SettingsHeader />
        </Show>
        <Outlet name="settingsPane" />
      </SettingsPaneContainer>
    </Show>
  );
}
