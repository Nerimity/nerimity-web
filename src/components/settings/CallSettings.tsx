import {
  createEffect,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  Show
} from "solid-js";
import { css, styled } from "solid-styled-components";
import useStore from "@/chat-api/store/useStore";
import {
  StorageKeys,
  useLocalStorage,
  useVoiceInputMode
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
import { toast } from "../ui/custom-portal/CustomPortal";
import Checkbox from "../ui/Checkbox";

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
      title:
        t("settings.drawer.title") + " - " + t("settings.drawer.call-settings"),
      iconName: "settings"
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
      <TurnServers />
    </Container>
  );
}

interface AvailableConstraint {
  label: string;
  description?: string;
  icon: string;
  key: "echo" | "noise" | "gain";
  default: boolean;
}
type ModifiableConstraints = "echo" | "noise" | "gain";
function InputDevices() {
  const [devices, setDevices] = createSignal<MediaDeviceInfo[]>([]);
  const [defaultDeviceId, setDefaultDeviceId] = createSignal<
    string | undefined
  >(undefined);
  const [inputDeviceId, setInputDeviceId] = useLocalStorage<string | undefined>(
    StorageKeys.inputDeviceId,
    undefined
  );

  const [supportedConstraints, setSupportedConstraints] = createSignal<
    AvailableConstraint[]
  >([]);

  const updateSupportedConstraints = () => {
    const supported = navigator.mediaDevices.getSupportedConstraints();
    const supportedList: AvailableConstraint[] = [];
    if (supported.echoCancellation)
      supportedList.push({
        label: t("settings.call.inputConstraints.echoCancelation"),
        description: t("settings.call.inputConstraints.echoCancelationDescription"),
        icon: "record_voice_over",
        key: "echo",
        default: true
      });
    if (supported.noiseSuppression)
      supportedList.push({
        label: t("settings.call.inputConstraints.noiseSuppression"),
        description: t("settings.call.inputConstraints.noiseSuppressionDescription"),
        icon: "noise_aware",
        key: "noise",
        default: true
      });
    if (supported.autoGainControl)
      supportedList.push({
        label: t("settings.call.inputConstraints.autoGainControl"),
        description: t("settings.call.inputConstraints.autoGainControlDescription"),
        icon: "settings_voice",
        key: "gain",
        default: true
      });
    setSupportedConstraints(supportedList);
  };

  const dropDownItem = () => {
    return devices().map((d) => ({
      id: d.deviceId,
      label: d.label
    })) satisfies DropDownItem[];
  };

  onMount(async () => {
    updateSupportedConstraints();
    const defaultStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });

    setDefaultDeviceId(
      defaultStream.getAudioTracks()[0]?.getSettings().deviceId
    );

    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setDevices(devices.filter((device) => device.kind === "audioinput"));
    });
  });

  const [constraints, setConstraints] = useLocalStorage(
    StorageKeys.voiceMicConstraints,
    { echo: true, noise: true, gain: true } as Record<
      ModifiableConstraints,
      boolean
    >
  );

  return (
    <div>
      <SettingsBlock
        icon="mic"
        label={t("settings.call.inputDevices")}
        borderBottomRadius={!supportedConstraints().length}
      >
        <DropDown
          items={dropDownItem()}
          selectedId={
            inputDeviceId() || defaultDeviceId() || t("settings.call.default")
          }
          onChange={(e) => setInputDeviceId(e.id)}
        />
      </SettingsBlock>
      <For each={supportedConstraints()}>
        {(constraint, i) => (
          <CheckboxOption
            constraint={constraint}
            checked={constraints()[constraint.key]}
            bottomBorder={i() === supportedConstraints().length - 1}
            onChange={(val) => {
              setConstraints({
                ...constraints(),
                [constraint.key]: val
              });
            }}
          />
        )}
      </For>
    </div>
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
      label: d.label
    })) satisfies DropDownItem[];
  };

  const defaultDeviceId = () => {
    const defaultDevice = devices().find((d) => d.deviceId === "default");
    if (defaultDevice) {
      return defaultDevice.deviceId;
    }
    return devices()[0]?.deviceId;
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
        selectedId={
          outputDeviceId() || defaultDeviceId() || t("settings.call.default")
        }
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
            toast(t("settings.call.leaveCall"));
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
            { id: "PTT", label: t("settings.call.pushToTalk") }
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
          toast(t("settings.call.leaveCall"));
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
function CheckboxOption(props: {
  constraint: AvailableConstraint;
  onChange: (checked: boolean) => void;
  checked: boolean;
  bottomBorder?: boolean;
}) {
  return (
    <SettingsBlock
      icon={props.constraint.icon}
      label={t(props.constraint.label)}
      borderTopRadius={false}
      description={props.constraint.description}
      onClick={() => props.onChange?.(!props.checked)}
      borderBottomRadius={props.bottomBorder}
    >
      <Checkbox checked={props.checked} />
    </SettingsBlock>
  );
}
function TurnServers() {
  const [enabled, setEnabled] = useLocalStorage(
    StorageKeys.voiceUseTurnServers,
    true
  );
  return (
    <SettingsBlock
      label={t("settings.call.useTurn")}
      description={t("settings.call.useTurnDescription")}
      icon="cloud"
      onClick={() => setEnabled(!enabled())}
    >
      <Checkbox checked={enabled()} />
    </SettingsBlock>
  );
}
