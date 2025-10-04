import { createEffect, For, Show } from "solid-js";
import { css, styled } from "solid-styled-components";

import useStore from "@/chat-api/store/useStore";
import { StorageKeys, useLocalStorage } from "@/common/localStorage";
import Checkbox from "../ui/Checkbox";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "i18next";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import { useWindowProperties } from "@/common/useWindowProperties";
import { currentTheme, customColors, setThemeColor } from "@/common/themes";
import { ColorPicker } from "../ui/color-picker/ColorPicker";
import Button from "../ui/Button";
import env from "@/common/env";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

export default function InterfaceSettings() {
  const { header } = useStore();

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Interface",
      iconName: "settings",
    });
  });

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title={t("dashboard.title")} />
        <BreadcrumbItem title={t("settings.drawer.interface")} />
      </Breadcrumb>
      <BlurEffect />
      <AdvancedMarkup />
      <CustomizeColors />
      <SettingsBlock icon="code" label="Custom CSS" href="./custom-css" />
      <ErudaBlock />
    </Container>
  );
}

function ErudaBlock() {
  return (
    <SettingsBlock
      icon="bug_report"
      label={"Enable Eruda"}
      description="Enable Eruda for debugging. Do not share any details with others."
    >
      <Button
        label="Enable Once"
        alert
        href={env.APP_URL + "/app?eruda=true"}
      />
    </SettingsBlock>
  );
}

function BlurEffect() {
  const { setBlurEffectEnabled, blurEffectEnabled } = useWindowProperties();
  const toggleBlurEffect = () => {
    setBlurEffectEnabled(!blurEffectEnabled());
  };

  return (
    <SettingsBlock
      icon="dvr"
      label={t("settings.interface.blurEffect")}
      description={t("settings.interface.blurEffectDescription")}
    >
      <Checkbox onChange={toggleBlurEffect} checked={blurEffectEnabled()} />
    </SettingsBlock>
  );
}
function AdvancedMarkup() {
  const [enabled, setEnabled] = useLocalStorage(
    StorageKeys.DISABLED_ADVANCED_MARKUP,
    false
  );

  return (
    <SettingsBlock
      icon="dvr"
      label={t("settings.interface.disableAdvancedMarkupBar")}
      description={t("settings.interface.disableAdvancedMarkupBarDescription")}
    >
      <Checkbox onChange={setEnabled} checked={enabled()} />
    </SettingsBlock>
  );
}

function CustomizeColors() {
  return (
    <div>
      <SettingsBlock
        icon="palette"
        label={t("settings.interface.customizeColors")}
        description={t("settings.interface.customizeColorsDescription")}
        header
      />
      <For each={Object.entries(currentTheme())}>
        {([name, value], i) => (
          <SettingsBlock
            icon="colors"
            class={css`
              text-transform: capitalize;
            `}
            label={name.replaceAll("-", " ")}
            borderBottomRadius={i() === Object.keys(currentTheme()).length - 1}
            borderTopRadius={false}
          >
            <Show when={customColors()[name]}>
              <Button
                iconName="restart_alt"
                padding={2}
                onClick={() => setThemeColor(name, undefined)}
              />
            </Show>
            <ColorPicker
              color={value}
              onChange={(v) => setThemeColor(name, v)}
            />
          </SettingsBlock>
        )}
      </For>
    </div>
  );
}
