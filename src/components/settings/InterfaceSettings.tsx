import { createEffect, For, Show } from "solid-js";

import useStore from "@/chat-api/store/useStore";
import {
  rightDrawerMode,
  StorageKeys,
  useChatBarOptions,
  useLocalStorage
} from "@/common/localStorage";
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
  setCustomColors,
  updateTheme,
  ThemeTokens
} from "@/common/themes";
import { ColorPicker } from "../ui/color-picker/ColorPicker";
import Button from "../ui/Button";
import env from "@/common/env";
import style from "./InterfaceSettings.module.css";
import { useNavigate } from "solid-navigator";
import { FlexColumn } from "../ui/Flexbox";
import { timeFormat, setTimeFormat } from "@/common/date";
import { toast } from "../ui/custom-portal/CustomPortal";
import { RadioBoxItem } from "../ui/RadioBox";

export default function InterfaceSettings() {
  const { header } = useStore();
  const { isMobileAgent } = useWindowProperties();

  createEffect(() => {
    header.updateHeader({
      title:
        t("settings.drawer.title") + " - " + t("settings.drawer.interface"),
      iconName: "settings"
    });
  });

  return (
    <div class={style.container}>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title={t("dashboard.title")} />
        <BreadcrumbItem title={t("settings.drawer.interface")} />
      </Breadcrumb>
      <ThemesBlock />
      <TimeFormatSetting />
      <BlurEffect />
      <ReduceAnimations />
      <ChatBar />
      <Show when={isMobileAgent()}>
        <RightDrawerModeBlock />
      </Show>
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

export function ThemesBlock() {
  const navigate = useNavigate();

  return (
    <SettingsBlock
      icon="style"
      label={t("explore.drawer.themes")}
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
                  color: colors["text-color"] || DefaultTheme["text-color"]
                }}
              >
                <div class={style.themeName}>{name}</div>
                <Show when={maintainers.length}>
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

        <div
          class={style.themeCard}
          style={{
            "background-color": "rgba(255,255,255,0.05)",
            "backdrop-filter": "blur(6px)",
            display: "flex",
            "flex-direction": "column",
            "justify-content": "center",
            "align-items": "center",
            position: "relative",
            transition: "transform 0.2s, opacity 0.2s",
            border: "1px dashed rgba(255, 255, 255, 0.3)"
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLDivElement).style.transform =
              "translateY(-3px)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLDivElement).style.transform =
              "translateY(0)")
          }
        >
          <div
            style={{
              "font-weight": "bold",
              "font-size": "1rem",
              "text-align": "center"
            }}
          >
            {t("explore.drawer.title")}
          </div>
          <div
            style={{
              "text-align": "center",
              "margin-top": "4px",
              "font-size": "0.75rem"
            }}
          >
            {t("explore.themes.unlockDescription")}
          </div>

          <Button
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              border: "none",
              background: "transparent",
              cursor: "pointer"
            }}
            onClick={() => navigate("/app/explore/themes")}
            iconName="explore"
          />
        </div>
      </div>
    </SettingsBlock>
  );
}

function TimeFormatSetting() {
  const toggleTimeFormat = () => {
    setTimeFormat(timeFormat() === "12hr" ? "24hr" : "12hr");
  };

  return (
    <SettingsBlock
      icon="schedule"
      label={t("settings.interface.timeTitle")}
      description={t(
        timeFormat() === "24hr"
          ? t("settings.interface.24HourFormatDescription")
          : t("settings.interface.12HourFormatDescription")
      )}
    >
      <Checkbox checked={timeFormat() === "12hr"} onChange={toggleTimeFormat} />
    </SettingsBlock>
  );
}

function ChatBar() {
  const { isMobileAgent } = useWindowProperties();
  const [chatBarOptions, setChatBarOptions] = useChatBarOptions();
  const [enabled, setEnabled] = useLocalStorage(
    StorageKeys.DISABLED_ADVANCED_MARKUP,
    false
  );
  const options = [
    {
      id: "vm",
      icon: "mic",
      label: t("settings.interface.voiceMessage")
    },
    {
      id: "gif",
      icon: "gif",
      label: t("settings.interface.gifPicker")
    },
    {
      id: "emoji",
      icon: "face",
      label: t("settings.interface.emojiPicker")
    },
    ...(!isMobileAgent()
      ? [
          {
            id: "send",
            icon: "send",
            label: t("settings.interface.sendButton")
          } as const
        ]
      : [])
  ] as const;

  type OptionIds = ["vm", "gif", "emoji", "send"];

  return (
    <FlexColumn>
      <SettingsBlock
        icon="chat"
        label={t("settings.interface.chatBarOptions")}
        header
      />
      <For each={options}>
        {({ icon, label, id }) => (
          <SettingsBlock
            icon={icon}
            label={label}
            borderTopRadius={false}
            borderBottomRadius={false}
            onClick={() => {
              const options = chatBarOptions() as unknown as OptionIds[];
              if (chatBarOptions().includes(id)) {
                setChatBarOptions(
                  options.filter(
                    (i) => i !== (id as unknown as OptionIds)
                  ) as unknown as OptionIds
                );
              } else {
                setChatBarOptions([
                  ...chatBarOptions(),
                  id
                ] as unknown as OptionIds);
              }
            }}
          >
            <Checkbox checked={chatBarOptions().includes(id)} />
          </SettingsBlock>
        )}
      </For>
      <SettingsBlock
        icon="mobile_dots"
        label={t("settings.interface.disableAdvancedMarkupBar")}
        description={t(
          "settings.interface.disableAdvancedMarkupBarDescription"
        )}
        borderTopRadius={false}
      >
        <Checkbox onChange={setEnabled} checked={enabled()} />
      </SettingsBlock>
    </FlexColumn>
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
      icon="blur_on"
      label={t("settings.interface.blurEffect")}
      description={t("settings.interface.blurEffectDescription")}
    >
      <Checkbox onChange={toggleBlurEffect} checked={blurEffectEnabled()} />
    </SettingsBlock>
  );
}

function ReduceAnimations() {
  const { reduceMotion, setReduceMotionMode } = useWindowProperties();
  const toggleReduceMotion = () => {
    setReduceMotionMode(reduceMotion() ? "disabled" : "enabled");
  };

  // Note: this doesn't currently expose a way to set the mode back to
  // auto; this is a setting most users will only change once, and they
  // rarely change their system settings.
  return (
    <SettingsBlock
      icon="animated_images"
      label={t("settings.interface.reduceAnimations")}
      description={t("settings.interface.reduceAnimationsDescription")}
    >
      <Checkbox onChange={toggleReduceMotion} checked={reduceMotion()} />
    </SettingsBlock>
  );
}

function CustomizeColors() {
  const copyThemeClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(currentTheme()));
    toast(t("settings.interface.exportModal"));
  };

  const importTheme = () => {
    const theme = JSON.parse(
      prompt(t("settings.interface.importModal"))! as string
    ) as Theme;
    setCustomColors(theme);
    updateTheme();
  };

  return (
    <div>
      <SettingsBlock
        icon="palette"
        label={t("settings.interface.customizeColors")}
        description={t("settings.interface.customizeColorsDescription")}
        header
      >
        <Button
          label={t("settings.interface.exportButton")}
          iconName="content_copy"
          onClick={copyThemeClipboard}
        />
        <Button
          label={t("settings.interface.importButton")}
          iconName="content_paste"
          onClick={importTheme}
        />
      </SettingsBlock>
      <For each={ThemeTokens}>
        {(token, i) => (
          <>
            <Show
              when={
                i() === 0 || ThemeTokens[i() - 1]?.category !== token.category
              }
            >
              <div class={style.tokenCategory}>{token.category}</div>
            </Show>
            <SettingsBlock
              icon="colors"
              class={style.themeItem}
              label={token.key.replaceAll("-", " ")}
              borderBottomRadius={
                i() === Object.keys(currentTheme()).length - 1
              }
              borderTopRadius={false}
            >
              <Show
                when={
                  currentTheme()[token.key] &&
                  DefaultTheme[token.key] !== currentTheme()[token.key]
                }
              >
                <Button
                  iconName="restart_alt"
                  padding={2}
                  onClick={() => setThemeColor(token.key, undefined)}
                />
              </Show>
              <ColorPicker
                alpha
                tabs={
                  "allowGradient" in token ? ["gradient", "solid"] : ["solid"]
                }
                color={currentTheme()[token.key]}
                onChange={(v) => setThemeColor(token.key, v)}
              />
            </SettingsBlock>
          </>
        )}
      </For>
    </div>
  );
}

function RightDrawerModeBlock() {
  const [mode, setMode] = rightDrawerMode;
  return (
    <FlexColumn>
      <SettingsBlock
        icon="right_panel_open"
        label={t("settings.interface.rightDrawerMode")}
        header
      />

      <SettingsBlock
        label={t("settings.interface.swipeToOpen")}
        description={t("settings.interface.swipeToOpenDescription")}
        icon="swipe"
        borderTopRadius={false}
        borderBottomRadius={false}
        onClick={() => {
          setMode("SWIPE");
        }}
      >
        <RadioBoxItem
          selected={mode() === "SWIPE"}
          item={{ id: 0, label: "" }}
        />
      </SettingsBlock>
      <SettingsBlock
        label={t("settings.interface.headerTapToOpen")}
        description={t("settings.interface.headerTapToOpenDescription")}
        icon="highlight_mouse_cursor"
        borderTopRadius={false}
        onClick={() => {
          setMode("HEADER_CLICK");
        }}
      >
        <RadioBoxItem
          selected={mode() === "HEADER_CLICK"}
          item={{ id: 0, label: "" }}
        />
      </SettingsBlock>
    </FlexColumn>
  );
}
