import { createEffect, For, Show } from "solid-js";

import useStore from "@/chat-api/store/useStore";
import { StorageKeys, useLocalStorage } from "@/common/localStorage";
import Checkbox from "../ui/Checkbox";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "@nerimity/i18lite";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import { useWindowProperties } from "@/common/useWindowProperties";
import {
  themePresets,
  applyTheme,
  currentTheme,
  customColors,
  setThemeColor,
  DefaultTheme,
} from "@/common/themes";
import { ColorPicker } from "../ui/color-picker/ColorPicker";
import Button from "../ui/Button";
import env from "@/common/env";
import style from "./InterfaceSettings.module.css";

export default function InterfaceSettings() {
  const { header } = useStore();

  createEffect(() => {
    header.updateHeader({
      title:
        t("settings.drawer.title") + " - " + t("settings.drawer.interface"),
      iconName: "settings",
    });
  });

  return (
    <div class={style.container}>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title={t("dashboard.title")} />
        <BreadcrumbItem title={t("settings.drawer.interface")} />
      </Breadcrumb>
      <ThemesBlock />
      <BlurEffect />
      <AdvancedMarkup />
      <CustomizeColors />
      <SettingsBlock
        icon="code"
        label={t("settings.interface.customCSS")}
        href="./custom-css"
      />
      <ErudaBlock />
    </div>
  );
}

// TODO: Make this look better on mobile before pushing to live
export function ThemesBlock() {
  return (
    <SettingsBlock
      icon="style"
      label={t("settings.interface.themes")}
      description={t("settings.interface.themesDescription")}
      class={style.themeSettingsBlock}
    >
      <div class={style.themeGrid}>
        <For each={Object.entries(themePresets)}>
          {([name, { colors, maintainers }]) => {
            const displayColors =
              Object.keys(colors).length === 0
                ? currentTheme()
                : { ...DefaultTheme, ...colors };

            return (
              <div
                class={style.themeCard}
                style={{
                  "background-color": colors["pane-color"],
                  color: colors["text-color"],
                }}
              >
                <div class={style.themeName}>{name}</div>
                <Show when={maintainers.length > 0}>
                  <div class={style.maintainers}>
                    {t("settings.interface.maintainers")}:{" "}
                    {maintainers.join(", ")}
                  </div>
                </Show>
                <div class={style.colorPreview}>
                  <For each={Object.values(displayColors)}>
                    {(color) => (
                      <div
                        class={style.colorBlock}
                        style={{ "background-color": color }}
                      />
                    )}
                  </For>
                </div>
                <Button
                  label={t("settings.interface.apply")}
                  onClick={() => applyTheme(name)}
                />
              </div>
            );
          }}
        </For>
      </div>
    </SettingsBlock>
  );
}

function ErudaBlock() {
  return (
    <SettingsBlock
      icon="bug_report"
      label={t("settings.interface.enableEruda")}
      description={t("settings.interface.enableErudaDescription")}
    >
      <Button
        label={t("settings.interface.enableOnce")}
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
            class={style.themeItem}
            label={name.replaceAll("-", " ")}
            borderBottomRadius={i() === Object.keys(currentTheme()).length - 1}
            borderTopRadius={false}
          >
            <Show when={customColors()[name] && DefaultTheme[name] !== value}>
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
