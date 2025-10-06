import { createEffect, createSignal, onMount, Show } from "solid-js";
import { styled } from "solid-styled-components";

import { FlexColumn } from "../ui/Flexbox";
import useStore from "@/chat-api/store/useStore";
import Checkbox from "../ui/Checkbox";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "i18next";
import SettingsBlock from "../ui/settings-block/SettingsBlock";

import { Notice } from "../ui/Notice/Notice";
import { electronWindowAPI } from "@/common/Electron";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
  flex-shrink: 0;
`;

const Options = styled("div")`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-top: 10px;
  flex-shrink: 0;
`;

const BlockContent = styled("div")`
  position: absolute;
  inset: 0;
  cursor: not-allowed;
`;

export default function WindowSettings() {
  const { header } = useStore();

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Window Settings",
      iconName: "settings",
    });
  });

  const isElectron = electronWindowAPI()?.isElectron;

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title={t("dashboard.title")} />
        <BreadcrumbItem title={t("settings.drawer.window-settings")} />
      </Breadcrumb>
      <Show when={!isElectron}>
        <Notice
          type="info"
          description="To modify these settings, you must download the Nerimity desktop app."
        />
      </Show>

      <Options>
        <Show when={!isElectron}>
          <BlockContent />
        </Show>
        <StartupOptions />
        <HardwareAccelerationOptions />
      </Options>
    </Container>
  );
}

function StartupOptions() {
  const [autostart, setAutostart] = createSignal(false);
  const [autostartMinimized, setAutostartMinimized] = createSignal(false);

  onMount(async () => {
    electronWindowAPI()?.getAutostart().then(setAutostart);
    electronWindowAPI()?.getAutostartMinimized().then(setAutostartMinimized);
  });

  const onAutostartChange = (checked: boolean) => {
    electronWindowAPI()?.setAutostart(checked);
    setAutostart(checked);
  };
  const onAutostartMinimizedChange = (checked: boolean) => {
    electronWindowAPI()?.setAutostartMinimized(checked);
    setAutostartMinimized(checked);
  };

  return (
    <FlexColumn>
      <SettingsBlock icon="open_in_new" label="Startup Options" header />
      <SettingsBlock
        onClick={() => onAutostartChange(!autostart())}
        icon="restart_alt"
        label={"Open Nerimity on startup"}
        borderTopRadius={false}
        borderBottomRadius={!autostart()}
      >
        <Checkbox checked={autostart()} onChange={onAutostartChange} />
      </SettingsBlock>
      <Show when={autostart()}>
        <SettingsBlock
          onClick={() => onAutostartMinimizedChange(!autostartMinimized())}
          icon="horizontal_rule"
          label="Start Minimized"
          description={"Minimize Nerimity to the tray automatically."}
          borderTopRadius={false}
        >
          <Checkbox
            checked={autostartMinimized()}
            onChange={onAutostartMinimizedChange}
          />
        </SettingsBlock>
      </Show>
    </FlexColumn>
  );
}
function HardwareAccelerationOptions() {
  const [hardwareAccelerationDisabled, setHardwareAccelerationDisabled] =
    createSignal(false);

  onMount(async () => {
    electronWindowAPI()
      ?.getHardwareAccelerationDisabled()
      .then(setHardwareAccelerationDisabled);
  });

  const onHardwareAccelerationChange = (checked: boolean) => {
    electronWindowAPI()?.setHardwareAccelerationDisabled(checked);
    setHardwareAccelerationDisabled(checked);
  };

  return (
    <FlexColumn>
      <SettingsBlock
        onClick={() =>
          onHardwareAccelerationChange(!hardwareAccelerationDisabled())
        }
        icon="speed"
        label={"Disable Hardware Acceleration"}
        description="You must reopen the app for the change to take effect."
      >
        <Checkbox
          checked={hardwareAccelerationDisabled()}
          onChange={onHardwareAccelerationChange}
        />
      </SettingsBlock>
    </FlexColumn>
  );
}
