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

import ItemContainer from "../ui/Item";
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
      title: "Settings - Notifications",
      iconName: "settings",
    });
  });

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title="Dashboard" />
        <BreadcrumbItem title={t("settings.drawer.interface")} />
      </Breadcrumb>
      <BlurEffect />
      <AdvancedMarkup />
      <CustomizeColors />
      <SettingsBlock icon="code" label="Custom CSS" href="./custom-css" />
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
      label="Blur Effect"
      description="Enables transparent blur effect. Disabled by default on mobile. Can cause performance issues."
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
      label="Disable Advanced Markup Bar"
      description="Disable advanced markup bar from text channels."
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
        label="Customize Colors"
        description="Customize the colors of the interface."
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
