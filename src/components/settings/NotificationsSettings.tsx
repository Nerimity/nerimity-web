import { createEffect, createSignal, Show } from "solid-js";
import Text from "@/components/ui/Text";
import { css, styled } from "solid-styled-components";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import useStore from "@/chat-api/store/useStore";
import {
  getStorageBoolean,
  getStorageNumber,
  setStorageBoolean,
  setStorageNumber,
  StorageKeys,
  useReactiveLocalStorage,
} from "@/common/localStorage";
import Checkbox from "../ui/Checkbox";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "i18next";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import Slider from "../ui/Slider";
import { playMessageNotification, playSound, Sounds } from "@/common/Sound";
import DropDown from "../ui/drop-down/DropDown";
import Button from "../ui/Button";
import ItemContainer from "../ui/Item";
import { RadioBox, RadioBoxItem } from "../ui/RadioBox";
import { isExperimentEnabled, useExperiment } from "@/common/experiments";

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
      title: "Settings - Notifications",
      iconName: "settings",
    });
  });

  const inAppNotificationPreviewsEnabled = isExperimentEnabled(
    "IN_APP_NOTIFICATION_PREVIEWS"
  );
  isExperimentEnabled;
  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title={t("dashboard.title")} />
        <BreadcrumbItem title={t("settings.drawer.notifications")} />
      </Breadcrumb>
      <DesktopNotification />
      <NotificationSound />

      <NotificationSoundSelection />

      <Show when={inAppNotificationPreviewsEnabled()}>
        <InAppNotificationBlock />
      </Show>
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
      new Notification("It worked.", {
        body: "Desktop notifications enabled!",
        icon: "/assets/logo.png",
      });
  };

  return (
    <SettingsBlock
      icon="dvr"
      label="Desktop Notifications"
      description="Show desktop notifications even when the app is minimized."
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
    <FlexColumn>
      <SettingsBlock
        icon="notifications_active"
        label="Sounds"
        description="If the notification sounds are too annoying, you can disable them."
      >
        <Checkbox onChange={onNotificationSoundChange} checked={!isMuted()} />
      </SettingsBlock>

      <Show when={!isMuted()}>
        <SettingsBlock
          icon="volume_up"
          label="Volume"
          description="Change the volume of the notification sounds."
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
    </FlexColumn>
  );
}

function NotificationSoundSelection() {
  return (
    <FlexColumn>
      <SettingsBlock
        header
        icon="music_note"
        label="Sounds"
        description="Change the sound of notifications with these royalty free sounds."
      />
      <SettingsBlock
        icon="chat"
        label="Message"
        description="Sound when receiving a message."
        borderTopRadius={false}
        borderBottomRadius={false}
      >
        <NotificationSoundDropDown typeId="MESSAGE" />
      </SettingsBlock>
      <SettingsBlock
        icon="alternate_email"
        label="Mention"
        description="Sound when receiving a mention."
        borderTopRadius={false}
      >
        <NotificationSoundDropDown typeId="MESSAGE_MENTION" />
      </SettingsBlock>
    </FlexColumn>
  );
}

function NotificationSoundDropDown(props: {
  typeId: "MESSAGE" | "MESSAGE_MENTION";
}) {
  const [selectedSounds, setSelectedSounds] = useReactiveLocalStorage<{
    [key: string]: (typeof Sounds)[number] | undefined;
  }>(StorageKeys.NOTIFICATION_SOUNDS, {});

  const selectedId = () => selectedSounds()[props.typeId] || "default";

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
            ? "Mute"
            : capitalizeFirstLetter(sound.replaceAll("-", " ")),
        suffix: (
          <Show when={sound !== "nerimity-mute"}>
            <div style={{ "margin-left": "auto", "flex-shrink": 0 }}>
              <Button
                onClick={(e) => testSound(e, sound)}
                styles={{ "margin-left": "6px", "flex-shrink": 0 }}
                iconName="play_circle"
                margin={0}
                padding={4}
                iconSize={16}
              />
            </div>
          </Show>
        ),
      }))}
    />
  );
}

const RadioBoxContainer = styled("div")`
  box-shadow: 0 0 2px 0 rgba(0, 0, 0, 0.4);
  background: rgba(255, 255, 255, 0.05);
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  padding: 10px;
  padding-left: 50px;
`;

function InAppNotificationBlock() {
  const [value, setValue] = useReactiveLocalStorage(
    StorageKeys.IN_APP_NOTIFICATIONS_PREVIEW,
    "INHERIT"
  );
  const NotificationPingItems: RadioBoxItem[] = [
    { id: "OFF", label: "Off" },
    { id: "MENTIONS_ONLY", label: "Mentions Only" },
    { id: "INHERIT", label: "Inherit from Ping Settings" },
    { id: "ALL", label: "All" },
  ];

  return (
    <div>
      <SettingsBlock
        class={css`
          margin-top: 10px;
        `}
        header
        icon="priority_high"
        label="In App Preview"
        description="Display In App Notification popups."
      ></SettingsBlock>

      <RadioBoxContainer>
        <RadioBox
          onChange={(e) => setValue(e.id)}
          items={NotificationPingItems}
          initialId={value()}
        />
      </RadioBoxContainer>
    </div>
  );
}
