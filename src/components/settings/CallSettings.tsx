import {
  createEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { css, styled } from "solid-styled-components";
import useStore from "@/chat-api/store/useStore";
import {
  StorageKeys,
  useLocalStorage,
  useVoiceInputMode,
} from "@/common/localStorage";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "@nerimity/i18lite";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import DropDown, { DropDownItem } from "../ui/drop-down/DropDown";
import { Notice } from "../ui/Notice/Notice";
import { electronWindowAPI } from "@/common/Electron";
import { RadioBox } from "../ui/RadioBox";
import { FlexColumn } from "../ui/Flexbox";
import Input from "../ui/input/Input";
import Button from "../ui/Button";
import { downKeys, useGlobalKey } from "@/common/GlobalKey";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

export default function CallSettings() {
  const { header } = useStore();

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Call",
      iconName: "settings",
    });
  });

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title={t("dashboard.title")} />
        <BreadcrumbItem title={t("settings.drawer.call-settings")} />
      </Breadcrumb>
      <Notice type="info" description={t("settings.call.nextCallNotice")} />
      <InputDevices />
      <OutputDevices />
      <InputMode />
      <PushToTalk />
    </Container>
  );
}

function InputDevices() {
  const [devices, setDevices] = createSignal<MediaDeviceInfo[]>([]);
  const [inputDeviceId, setInputDeviceId] = useLocalStorage<string | undefined>(
    StorageKeys.inputDeviceId,
    undefined
  );

  const dropDownItem = () => {
    return devices().map((d) => ({
      id: d.deviceId,
      label: d.label,
    })) satisfies DropDownItem[];
  };

  onMount(async () => {
    await navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((s) => s.getAudioTracks()[0]?.stop());
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setDevices(devices.filter((device) => device.kind === "audioinput"));
    });
  });

  return (
    <SettingsBlock icon="mic" label={t("settings.call.inputDevices")}>
      <DropDown
        items={dropDownItem()}
        selectedId={inputDeviceId() || t("settings.call.default")}
        onChange={(e) => setInputDeviceId(e.id)}
      />
    </SettingsBlock>
  );
}

function OutputDevices() {
  const [devices, setDevices] = createSignal<MediaDeviceInfo[]>([]);
  const [outputDeviceId, setOutputDeviceId] = useLocalStorage<
    string | undefined
  >(StorageKeys.outputDeviceId, undefined);

  const dropDownItem = () => {
    return devices().map((d) => ({
      id: d.deviceId,
      label: d.label,
    })) satisfies DropDownItem[];
  };

  onMount(async () => {
    await navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((s) => s.getAudioTracks()[0]?.stop());
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setDevices(devices.filter((device) => device.kind === "audiooutput"));
    });
  });

  return (
    <SettingsBlock icon="speaker" label={t("settings.call.outputDevices")}>
      <DropDown
        items={dropDownItem()}
        selectedId={outputDeviceId() || t("settings.call.default")}
        onChange={(e) => setOutputDeviceId(e.id)}
      />
    </SettingsBlock>
  );
}

const InputModeRadioBoxContainer = styled(FlexColumn)`
  background: rgba(255, 255, 255, 0.05);
  padding: 10px;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  padding-left: 50px;
`;

function InputMode() {
  const [inputMode, setInputMode] = useVoiceInputMode();
  const store = useStore();

  const isInCall = () => store.voiceUsers.currentUser()?.channelId;

  return (
    <div>
      <SettingsBlock
        icon="steppers"
        label={t("settings.call.inputMode")}
        header
      />
      <InputModeRadioBoxContainer
        onClick={() => {
          if (isInCall()) {
            alert("You must leave the call first.");
          }
        }}
      >
        <RadioBox
          style={isInCall() ? { "pointer-events": "none" } : {}}
          initialId={inputMode()}
          onChange={(e) => setInputMode(e.id)}
          items={[
            { id: "OPEN", label: t("settings.call.openMic") },
            { id: "VOICE_ACTIVITY", label: t("settings.call.voiceActivity") },
            { id: "PTT", label: t("settings.call.pushToTalk") },
          ]}
        />
      </InputModeRadioBoxContainer>
    </div>
  );
}

function PushToTalk() {
  const [inputMode] = useVoiceInputMode();
  const [bindMode, setBindMode] = createSignal(false);
  const [PTTBoundKeys, setPTTBoundKeys] = useLocalStorage(
    StorageKeys.PTTBoundKeys,
    [] as (string | number)[]
  );
  const store = useStore();

  const isInCall = () => store.voiceUsers.currentUser()?.channelId;

  const toggleBindMode = () => setBindMode(!bindMode());

  const { start, stop } = useGlobalKey();

  createEffect(() => {
    if (inputMode() !== "PTT") {
      setBindMode(false);
    }
  });

  createEffect(
    on(bindMode, (bindMode) => {
      if (bindMode) {
        if (isInCall()) {
          alert("You must leave the call first.");
          setBindMode(false);
          return;
        }
        start();
      } else {
        stop();
      }
    })
  );

  createEffect(
    on([() => downKeys.length, () => [...downKeys]], (input, prevInput) => {
      if (!bindMode()) return;

      if (prevInput && input < prevInput) {
        setPTTBoundKeys(prevInput[1]!);
        setBindMode(false);
      }
    })
  );

  const value = () => {
    if (bindMode()) {
      return downKeys.map((k) => k).join(" + ");
    }
    return PTTBoundKeys()
      .map((k) => k)
      .join(" + ");
  };
  return (
    <Show when={inputMode() === "PTT"}>
      <FlexColumn gap={4} style={{ "margin-top": "10px" }}>
        <Show when={!electronWindowAPI()?.isElectron}>
          <Notice
            type="info"
            description={t("settings.call.downloadAppNotice")}
          />
        </Show>
        <SettingsBlock icon="keyboard" label={t("settings.call.pushToTalk")}>
          <Input
            disabled
            value={value()}
            suffix={
              <Button
                onkeydown={(e) => e.preventDefault()}
                color={bindMode() ? "var(--alert-color)" : undefined}
                label={
                  bindMode()
                    ? t("settings.call.stopButton")
                    : t("settings.call.bindButton")
                }
                onClick={toggleBindMode}
              />
            }
          />
        </SettingsBlock>
      </FlexColumn>
    </Show>
  );
}
