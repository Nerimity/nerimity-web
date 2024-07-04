import { createEffect, createSignal, onMount, Show } from "solid-js";
import Text from "@/components/ui/Text";
import { styled } from "solid-styled-components";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import useStore from "@/chat-api/store/useStore";
import { getStorageBoolean, getStorageNumber, setStorageBoolean, setStorageNumber, StorageKeys, useReactiveLocalStorage } from "@/common/localStorage";
import Checkbox from "../ui/Checkbox";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "i18next";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import Slider from "../ui/Slider";
import { playMessageNotification, playSound, Sounds } from "@/common/Sound";
import DropDown, { DropDownItem } from "../ui/drop-down/DropDown";
import Button from "../ui/Button";
import { Notice } from "../ui/Notice/Notice";

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
      title: "Settings - Call",
      iconName: "settings"
    });
  });


  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href='/app' icon='home' title="Dashboard" />
        <BreadcrumbItem title={t("settings.drawer.call-settings")} />
      </Breadcrumb>
      <Notice type="info" description="Changes will be applied on next your calls." />
      <InputDevices/>
      <OutputDevices/>

    </Container>
  );
}


function InputDevices() {
  const [devices, setDevices] = createSignal<MediaDeviceInfo[]>([]);
  const [inputDeviceId, setInputDeviceId] = useReactiveLocalStorage<string | undefined>(StorageKeys.inputDeviceId, undefined);

  const dropDownItem = () => {
    return devices().map((d) => ({
      id: d.deviceId,
      label: d.label,
    })) satisfies DropDownItem[]
  }


  onMount(async() => {
    await navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(s => s.getAudioTracks()[0]?.stop());
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setDevices(devices.filter((device) => device.kind === "audioinput"));
    })
  })

  return (
    <SettingsBlock icon='mic' label='Input Device'>
      <DropDown items={dropDownItem()} selectedId={inputDeviceId() || "default"} onChange={(e) => setInputDeviceId(e.id)} />
    </SettingsBlock>
  );
}

function OutputDevices() {
  const [devices, setDevices] = createSignal<MediaDeviceInfo[]>([]);
  const [outputDeviceId, setOutputDeviceId] = useReactiveLocalStorage<string | undefined>(StorageKeys.outputDeviceId, undefined);

  const dropDownItem = () => {
    return devices().map((d) => ({
      id: d.deviceId,
      label: d.label,
    })) satisfies DropDownItem[]
  }


  onMount(async () => {
    await navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(s => s.getAudioTracks()[0]?.stop());
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setDevices(devices.filter((device) => device.kind === "audiooutput"));
    })
  })

  return (
    <SettingsBlock icon='speaker' label='Output Device'>
      <DropDown items={dropDownItem()} selectedId={outputDeviceId() || "default"} onChange={(e) => setOutputDeviceId(e.id)} />
    </SettingsBlock>
  );
}
