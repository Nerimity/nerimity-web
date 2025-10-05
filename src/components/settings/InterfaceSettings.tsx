import { createEffect, For, Show } from "solid-js";
import { css, styled } from "solid-styled-components";

import useStore from "@/chat-api/store/useStore";
import { StorageKeys, useLocalStorage } from "@/common/localStorage";
import Checkbox from "../ui/Checkbox";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "i18next";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import { useWindowProperties } from "@/common/useWindowProperties";
import {
  themePresets,
  applyTheme,
  currentTheme,
  customColors,
  setThemeColor,
} from "@/common/themes";
import { ColorPicker } from "../ui/color-picker/ColorPicker";
import Button from "../ui/Button";
import env from "@/common/env";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

const ThemeGrid = styled("div")`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 8px;

  @media (max-width: 600px) {
    width: 100%;
    grid-template-columns: 1fr;
  }
`;

const ThemeCard = styled("div")<{ colors: Record<string, string> }>`
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  padding: 12px;
  background-color: ${({ colors }) => colors["pane-color"] || "#f5f5f5"};
  color: ${({ colors }) => colors["text-color"] || "#333"};
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }

  .theme-name {
    font-weight: bold;
    margin-bottom: 4px;
    text-transform: capitalize;
    font-size: 14px;
  }

  .maintainers {
    font-size: 12px;
    opacity: 0.7;
    font-style: italic;
    margin-bottom: 8px;
  }

  .color-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding-bottom: 8px;
    margin-bottom: auto;

    div {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      border: 1px solid #ccc;
      background-color: ${({ colors }) => colors["background-color"] || "#eee"};
    }
  }

  @media (max-width: 600px) {
    padding: 10px;

    .color-preview div {
      width: 16px;
      height: 16px;
    }

    button {
      font-size: 12px;
      padding: 4px 6px;
    }
  }
`;

export default function InterfaceSettings() {
  const { header } = useStore();

  createEffect(() => {
    header.updateHeader({
      title: t("settings.drawer.title") + " - " + t("settings.drawer.interface"),
      iconName: "settings",
    });
  });

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title={t("dashboard.title")} />
        <BreadcrumbItem title={t("settings.drawer.interface")} />
      </Breadcrumb>
      <ThemesBlock />
      <BlurEffect />
      <AdvancedMarkup />
      <CustomizeColors />
      <SettingsBlock icon="code" label={t("settings.interface.customCSS")} href="./custom-css" />
      <ErudaBlock />
    </Container>
  );
}

// TODO: Make this look better on mobile before pushing to live
export function ThemesBlock() {
  return (
    <SettingsBlock
      icon="style"
      label={t("settings.interface.themes")}
      description={t("settings.interface.themesDescription")}
      class={css`
        && {
          flex-direction: column;
          align-items: start;
        }
      `}
    >
      <ThemeGrid>
        <For each={Object.entries(themePresets)}>
          {([name, { colors, maintainers }]) => {
            const displayColors =
              Object.keys(colors).length === 0 ? currentTheme() : colors;

            return (
              <ThemeCard colors={displayColors}>
                <div class="theme-name">{name}</div>
                <Show when={maintainers.length > 0}>
                  <div class="maintainers">
                    {t("settings.interface.maintainers")}:{" "}
                    {maintainers.join(", ")}
                  </div>
                </Show>
                <div class="color-preview">
                  <For each={Object.values(displayColors)}>
                    {(color) => <div style={{ "background-color": color }} />}
                  </For>
                </div>
                <Button
                  label={t("settings.interface.apply")}
                  size="small"
                  onClick={() => applyTheme(name)}
                />
              </ThemeCard>
            );
          }}
        </For>
      </ThemeGrid>
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
