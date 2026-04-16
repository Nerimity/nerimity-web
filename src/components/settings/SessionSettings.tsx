import { createEffect, createSignal, For, onMount, Show } from "solid-js";
import { styled } from "solid-styled-components";

import useStore from "@/chat-api/store/useStore";

import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "@nerimity/i18lite";
import {
  destroySession,
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
import socketClient from "@/chat-api/socketClient";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { Modal } from "../ui/modal";
import Input from "../ui/input/Input";
import Text from "../ui/Text";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
  flex-shrink: 0;
`;

export default function SessionSettings() {
  const { header } = useStore();

  const portal = useCustomPortal();

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

  const removeSession = (sessionId?: string) => {
    if (!sessionId) {
      setSessions([]);
      return;
    }
    const newSessions = sessions().filter((s) => s.sessionId !== sessionId);
    setSessions(newSessions);
  };

  const destroyAllSessions = (sessionId?: string) => {
    portal.createPortal((c) => (
      <ConfirmPasswordModal
        sessionId={sessionId}
        close={c}
        onDestroyed={() => removeSession(sessionId)}
      />
    ));
  };

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title={t("dashboard.title")} />
        <BreadcrumbItem title={t("settings.drawer.sessions")} />
      </Breadcrumb>
      <SettingsBlock
        label="Destroy All Sessions"
        icon="key_off"
        description="You will be logged out everywhere."
      >
        <Button
          label="Destroy All Sessions"
          alert
          iconName="key_off"
          primary
          onClick={() => destroyAllSessions()}
        />
      </SettingsBlock>
      {sessions().length} Sessions
      <For each={Object.keys(groupedSessions())}>
        {(sessionId) => (
          <SettingsGroup>
            <SettingsBlock
              label={
                "Session" +
                (socketClient.sessionId() === sessionId ? " (Current)" : "")
              }
              icon="key"
              description="A new session should be created every time you log in."
            >
              <Button
                label="Destroy Session"
                alert
                iconName="key_off"
                onClick={() => destroyAllSessions(sessionId)}
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

const ConfirmPasswordModal = (props: {
  sessionId?: string;
  close: () => void;
  onDestroyed: (sessionId?: string) => void;
}) => {
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);
  return (
    <Modal.Root close={props.close}>
      <Modal.Header
        title={props.sessionId ? "Destroy Session" : "Destroy All Sessions"}
        icon="key_off"
        alert
      />
      <Modal.Body>
        <Input
          label="Password"
          type="password"
          value={password()}
          onText={setPassword}
        />
        <Show when={error()}>
          <Text color="var(--alert-color)">{error()}</Text>
        </Show>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Button
          alert
          iconName="key_off"
          primary
          label={props.sessionId ? "Destroy Session" : "Destroy All Sessions"}
          onclick={() => {
            setError(null);
            destroySession(password(), props.sessionId)
              .then(() => {
                props.onDestroyed(props.sessionId);
                props.close();
              })
              .catch((err) => setError(err.message));
          }}
        />
      </Modal.Footer>
    </Modal.Root>
  );
};
