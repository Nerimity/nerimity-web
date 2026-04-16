import { createEffect, createSignal, For, onMount } from "solid-js";
import { styled } from "solid-styled-components";

import useStore from "@/chat-api/store/useStore";

import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "@nerimity/i18lite";
import {
  DeviceType,
  DeviceTypeId,
  fetchUserSessions,
  UserSession
} from "@/chat-api/services/UserService";
import SettingsBlock, {
  SettingsGroup
} from "../ui/settings-block/SettingsBlock";
import { formatTimestamp } from "@/common/date";
import Button from "../ui/Button";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
  flex-shrink: 0;
`;

export default function SessionSettings() {
  const { header } = useStore();

  const [sessions, setSessions] = createSignal<UserSession[]>([]);

  createEffect(() => {
    header.updateHeader({
      title: t("settings.drawer.title") + " - " + t("settings.drawer.sessions"),
      iconName: "settings"
    });
  });

  onMount(() => {
    fetchUserSessions().then(setSessions);
  });

  const groupedSessions = () => {
    const grouped: Record<string, UserSession[]> = {};

    const sortedSessions = sessions().sort(
      (a, b) => b.lastSeenAt - a.lastSeenAt
    );

    for (const session of sortedSessions) {
      const sessionId = session.sessionId;

      if (!grouped[sessionId]) {
        grouped[sessionId] = [];
      }

      grouped[sessionId].push(session);
    }

    return grouped;
  };

  const deviceTypeToIcon = (deviceType: DeviceTypeId) => {
    switch (deviceType) {
      case DeviceType.Mobile:
        return "mobile";
      case DeviceType.Desktop:
        return "computer";
      default:
        return "globe";
    }
  };

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title={t("dashboard.title")} />
        <BreadcrumbItem title={t("settings.drawer.sessions")} />
      </Breadcrumb>
      {sessions().length} Sessions
      <For each={Object.keys(groupedSessions())}>
        {(sessionId) => (
          <SettingsGroup>
            <SettingsBlock
              label="Session"
              icon="key"
              description="A new session should be created every time you log in."
            >
              <Button
                label="Destroy Session"
                alert
                iconName="key_off"
                primary
              />
            </SettingsBlock>
            <For each={groupedSessions()[sessionId]}>
              {(session) => (
                <SettingsBlock
                  label={session.location || "Unknown"}
                  icon={deviceTypeToIcon(session.deviceType)}
                  description={`Last seen at ${formatTimestamp(session.lastSeenAt)}`}
                />
              )}
            </For>
          </SettingsGroup>
        )}
      </For>
    </Container>
  );
}
