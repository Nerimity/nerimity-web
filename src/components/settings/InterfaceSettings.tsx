import { createEffect, createSignal, For, Show } from "solid-js";
import Text from "@/components/ui/Text";
import { css, styled } from "solid-styled-components";
import {
  getCurrentLanguage,
  getLanguage,
  Language,
  languages,
  setCurrentLanguage,
} from "@/locales/languages";

import ItemContainer from "../ui/LegacyItem";
import twemoji from "twemoji";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import useStore from "@/chat-api/store/useStore";
import { useTransContext } from "@mbarzda/solid-i18next";
import env from "@/common/env";
import { emojiUnicodeToShortcode, unicodeToTwemojiUrl } from "@/emoji";
import { Emoji } from "../markup/Emoji";
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
import { playMessageNotification } from "@/common/Sound";
import { useWindowProperties } from "@/common/useWindowProperties";
import { currentTheme, customColors, setThemeColor } from "@/common/themes";
import { ColorPicker } from "../ui/color-picker/ColorPicker";
import Button from "../ui/Button";

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
      <BlurEffect />
      <AdvancedMarkup />
      <CustomizeColors />
      <SettingsBlock icon="code" label={t("settings.interface.customCss")} href="./custom-css" />
    </Container>
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
  const [enabled, setEnabled] = useReactiveLocalStorage(
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
