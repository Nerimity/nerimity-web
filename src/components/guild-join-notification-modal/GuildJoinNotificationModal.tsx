import style from "./GuildJoinNotificationModal.module.css";
import { createEffect, JSXElement, Show } from "solid-js";
import { Modal } from "../ui/modal";
import useStore from "@/chat-api/store/useStore";
import SettingsBlock, { SettingsGroup } from "../ui/settings-block/SettingsBlock";
import ItemContainer from "@/components/ui/LegacyItem";
import { t } from "@nerimity/i18lite";
import Avatar from "../ui/Avatar";
import { RadioBox, RadioBoxItem } from "../ui/RadioBox";
import { ServerNotificationPingMode } from "@/chat-api/RawData";
import Block from "../ui/settings-block/Block";

const RadioBoxContainer = (props: { children?: JSXElement }) => {
  return (
    <Block style={{ "padding-left": "50px", "margin-bottom": "0" }}>
      {props.children}
    </Block>
  );
};

export default function GuildJoinNotificationModal(props: {
  close: () => void;
  serverId: string;
}) {
  const store = useStore();
  const server = () => store.servers.get(props.serverId);

  createEffect(() => {
    if (!server()) {
      // props.close();
    }
  });

  const currentNotificationSoundMode = () =>
    store.account.getRawNotificationSettings(props.serverId)
      ?.notificationSoundMode ?? 0;
  const currentNotificationPingMode = () =>
    store.account.getRawNotificationSettings(props.serverId)
      ?.notificationPingMode ?? 0;

  const NotificationSoundItems: () => RadioBoxItem[] = () => [
    ...(currentNotificationPingMode() === null
      ? [
          {
            id: null,
            label: t("serverContextMenu.notificationOptions.initial")
          }
        ]
      : []),
    ...(currentNotificationPingMode() !==
    ServerNotificationPingMode.MENTIONS_ONLY
      ? [
          {
            id: 0,
            label: t("serverContextMenu.notificationOptions.everything")
          }
        ]
      : []),
    { id: 1, label: t("serverContextMenu.notificationOptions.mentionsOnly") },
    { id: 2, label: t("serverContextMenu.notificationOptions.mute") }
  ];

  const onNotificationSoundChange = (item: RadioBoxItem) => {
    store.account.updateUserNotificationSettings({
      notificationSoundMode: item.id,
      serverId: props.serverId
    });
  };

  const NotificationPingItems: RadioBoxItem[] = [
    { id: 0, label: t("serverContextMenu.notificationOptions.everything") },
    { id: 1, label: t("serverContextMenu.notificationOptions.mentionsOnly") },
    { id: 2, label: t("serverContextMenu.notificationOptions.mute") }
  ];

  const onNotificationPingChange = (item: RadioBoxItem) => {
    store.account.updateUserNotificationSettings({
      notificationPingMode: item.id,
      serverId: props.serverId
    });
  };

  return (
    <Modal.Root
      close={props.close}
      doNotCloseOnBackgroundClick
      desktopMaxWidth={400}
      class={style.modal}
    >
      <Modal.Header title="Notification Settings" icon="notifications" />
      <Modal.Body class={style.body}>
        <SettingsGroup>
          <SettingsBlock
            icon="priority_high"
            label={t("servers.settings.notifications.ping")}
            description={t("servers.settings.notifications.pingDescription")}
          >
            <ItemContainer
              alert={
                currentNotificationPingMode() !==
                ServerNotificationPingMode.MUTE
              }
              style={{ "padding-left": "10px", "pointer-events": "none" }}
            >
              <Avatar server={server()} size={30} />
            </ItemContainer>
          </SettingsBlock>

          <RadioBoxContainer>
            <RadioBox
              onChange={onNotificationPingChange}
              items={NotificationPingItems}
              initialId={currentNotificationPingMode()}
            />
          </RadioBoxContainer>
        </SettingsGroup>

        <Show
          when={
            currentNotificationPingMode() !== ServerNotificationPingMode.MUTE
          }
        >
          <SettingsGroup>
            <SettingsBlock
              icon="notifications_active"
              label={t("servers.settings.notifications.sound")}
              description={t("servers.settings.notifications.soundDescription")}
            />
            <RadioBoxContainer>
              <RadioBox
                onChange={onNotificationSoundChange}
                items={NotificationSoundItems()}
                initialId={currentNotificationSoundMode()}
              />
            </RadioBoxContainer>
          </SettingsGroup>
        </Show>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Button
          onClick={props.close}
          label="Close"
          primary
          iconName="close"
        />
      </Modal.Footer>
    </Modal.Root>
  );
}
