import { createEffect, createSignal, Show } from "solid-js";
import Text from "@/components/ui/Text";
import { styled } from "solid-styled-components";
import useStore from "@/chat-api/store/useStore";
import {
  getStorageBoolean,
  getStorageNumber,
  setStorageBoolean,
  setStorageNumber,
  StorageKeys,
  useLocalStorage
} from "@/common/localStorage";
import Checkbox from "../ui/Checkbox";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "@nerimity/i18lite";
import SettingsBlock, { SettingsGroup } from "../ui/settings-block/SettingsBlock";
import Slider from "../ui/Slider";
import {
  getCustomSound,
  playMessageNotification,
  playSound,
  Sounds
} from "@/common/Sound";
import DropDown from "../ui/drop-down/DropDown";
import Button from "../ui/Button";
import { RadioBox, RadioBoxItem } from "../ui/RadioBox";
import Block from "../ui/settings-block/Block";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

export default function NotificationsSettings() {
  const { header } = useStore();

  createEffect(() => {
    header.updateHeader({
      title:
        t("settings.drawer.title") + " - " + t("settings.drawer.notifications"),
      iconName: "settings"
    });
  });

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title={t("dashboard.title")} />
        <BreadcrumbItem title={t("settings.drawer.notifications")} />
      </Breadcrumb>
      <DesktopNotification />
      <NotificationSound />

      <NotificationSoundSelection />

      <InAppNotificationBlock />
    </Container>
  );
}

function DesktopNotification() {
  const [isEnabled, setEnabled] = createSignal(
    getStorageBoolean(StorageKeys.ENABLE_DESKTOP_NOTIFICATION, false)
  );

  const onChange = async () => {
    setEnabled(!isEnabled());
    setStorageBoolean(StorageKeys.ENABLE_DESKTOP_NOTIFICATION, isEnabled());

    await Notification.requestPermission();
    isEnabled() &&
      new Notification(t("settings.notifications.testNotification.title"), {
        body: t("settings.notifications.testNotification.body"),
        icon: "/assets/logo.png"
      });
  };

  return (
    <SettingsBlock
      icon="dvr"
      label={t("settings.notifications.desktopNotifications")}
      description={t("settings.notifications.desktopNotificationsDescription")}
    >
      <Checkbox onChange={onChange} checked={isEnabled()} />
    </SettingsBlock>
  );
}

function NotificationSound() {
  const [isMuted, setMuted] = createSignal(
    getStorageBoolean(StorageKeys.ARE_NOTIFICATIONS_MUTED, false)
  );
  const onNotificationSoundChange = () => {
    setMuted(!isMuted());
    setStorageBoolean(StorageKeys.ARE_NOTIFICATIONS_MUTED, isMuted());
    !isMuted() && playMessageNotification({ force: true });
  };

  const [volume, setVolume] = createSignal(
    getStorageNumber(StorageKeys.NOTIFICATION_VOLUME, 10)
  );
  const onVolumeChanged = () => {
    setStorageNumber(StorageKeys.NOTIFICATION_VOLUME, volume());
    playMessageNotification({ force: true });
  };

  return (
    <SettingsGroup>
      <SettingsBlock
        icon="notifications_active"
        label={t("settings.notifications.sounds")}
        description={t("settings.notifications.soundsDescription")}
      >
        <Checkbox onChange={onNotificationSoundChange} checked={!isMuted()} />
      </SettingsBlock>

      <Show when={!isMuted()}>
        <SettingsBlock
          icon="volume_up"
          label={t("settings.notifications.volume")}
          description={t("settings.notifications.volumeDescription")}
        >
          <div style={{ display: "flex" }}>
            <Slider
              onEnd={onVolumeChanged}
              value={volume()}
              min={0}
              max={100}
              onChange={setVolume}
            />
            <Text style={{ width: "30px", "text-align": "center" }}>
              {volume()}
            </Text>
          </div>
        </SettingsBlock>
      </Show>
    </SettingsGroup>
  );
}

function NotificationSoundSelection() {
  return (
    <SettingsGroup>
      <SettingsBlock
        icon="music_note"
        label={t("settings.notifications.sounds")}
        description={t("settings.notifications.changeSoundsDescription")}
      />
      <SettingsBlock
        icon="chat"
        label={t("settings.notifications.message")}
        description={t("settings.notifications.messageDescription")}
      >
        <NotificationSoundDropDown typeId="MESSAGE" />
      </SettingsBlock>
      <SettingsBlock
        icon="alternate_email"
        label={t("settings.notifications.mention")}
        description={t("settings.notifications.mentionDescription")}
      >
        <NotificationSoundDropDown typeId="MESSAGE_MENTION" />
      </SettingsBlock>
      <SettingsBlock
        icon="calendar_today"
        label={t("settings.notifications.reminder")}
        description={t("settings.notifications.reminderDescription")}
      >
        <NotificationSoundDropDown typeId="REMINDER" />
      </SettingsBlock>
      <SettingsBlock
        icon="call"
        label={t("settings.notifications.callJoin")}
      >
        <NotificationSoundDropDown typeId="CALL_JOIN" />
      </SettingsBlock>
      <SettingsBlock
        icon="call_end"
        label={t("settings.notifications.callLeave")}
      >
        <NotificationSoundDropDown typeId="CALL_LEAVE" />
      </SettingsBlock>
    </SettingsGroup>
  );
}

function NotificationSoundDropDown(props: {
  typeId:
    | "MESSAGE"
    | "MESSAGE_MENTION"
    | "REMINDER"
    | "CALL_JOIN"
    | "CALL_LEAVE";
}) {
  const [selectedSounds, setSelectedSounds] = useLocalStorage<{
    [key: string]: (typeof Sounds)[number] | undefined;
  }>(StorageKeys.NOTIFICATION_SOUNDS, {});

  const selectedId = () =>
    selectedSounds()[props.typeId] || getCustomSound(props.typeId) || "default";

  const capitalizeFirstLetter = (val: string) => {
    return val.charAt(0).toUpperCase() + val.slice(1);
  };

  const testSound = (e: MouseEvent, sound: (typeof Sounds)[number]) => {
    e.stopPropagation();
    playSound(sound);
  };
  return (
    <DropDown
      selectedId={selectedId()}
      items={Sounds.map((sound) => ({
        id: sound,
        onClick: () =>
          setSelectedSounds({ ...selectedSounds(), [props.typeId]: sound }),
        label:
          sound === "nerimity-mute"
            ? t("settings.notifications.mute")
            : capitalizeFirstLetter(sound.replaceAll("-", " ")),
        suffix: (
          <Show when={sound !== "nerimity-mute"}>
            <div style={{ "margin-left": "auto", "flex-shrink": 0 }}>
              <Button
                onClick={(e) => testSound(e, sound)}
                style={{ "margin-left": "6px", "flex-shrink": 0 }}
                iconName="play_circle"
                margin={0}
                padding={4}
                iconSize={16}
              />
            </div>
          </Show>
        )
      }))}
    />
  );
}

function InAppNotificationBlock() {
  const [value, setValue] = useLocalStorage(
    StorageKeys.IN_APP_NOTIFICATIONS_PREVIEW,
    "INHERIT"
  );
  const NotificationPingItems: RadioBoxItem[] = [
    { id: "OFF", label: t("settings.notifications.inAppPreviewModes.off") },
    {
      id: "MENTIONS_ONLY",
      label: t("serverContextMenu.notificationOptions.mentionsOnly")
    },
    {
      id: "INHERIT",
      label: t(
        "settings.notifications.inAppPreviewModes.inheritFromPingSettings"
      )
    },
    { id: "ALL", label: t("serverContextMenu.notificationOptions.everything") }
  ];

  return (
    <SettingsGroup>
      <SettingsBlock
        icon="priority_high"
        label={t("settings.notifications.inAppPreview")}
        description={t("settings.notifications.inAppPreviewDescription")}
      />

      <Block style={{ "padding-left": "50px" }}>
        <RadioBox
          onChange={(e) => setValue(e.id)}
          items={NotificationPingItems}
          initialId={value()}
        />
      </Block>
    </SettingsGroup>
  );
}
