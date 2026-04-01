import { createMemo, For, Show } from "solid-js";
import { cn, conditionalClass } from "@/common/classNames";
import { t } from "@nerimity/i18lite";
import Button from "../ui/Button";
import { applyTheme, DefaultTheme, ThemePreset } from "@/common/themes";
import style from "./ThemeCard.module.css";

export default function ThemeCard(props: {
  name: string;
  themeObj: ThemePreset;
  explore?: boolean;
}) {
  const theme = createMemo(() => {
    const themeColors = props.themeObj.colors || {};
    const colors = { ...DefaultTheme, ...themeColors };
    return {
      maintainers: props.themeObj.maintainers || [],
      colors
    };
  });

  return (
    <div
      class={cn(
        style.themeCard,
        conditionalClass(props.explore, style.explore)
      )}
      style={{
        background: theme().colors["pane-color"],
        color: theme().colors["text-color"]
      }}
    >
      <div class={style.themeName}>{props.name}</div>
      <Show when={theme().maintainers.length}>
        <div class={style.maintainers}>
          {t("settings.interface.maintainers")}:{" "}
          {theme().maintainers.join(", ")}
        </div>
      </Show>
      <div class={style.colorPreview}>
        <For each={Object.values(theme().colors)}>
          {(color) => (
            <div
              class={style.colorBlock}
              style={{ "background-color": color }}
            />
          )}
        </For>
      </div>
      <Button
        color={theme().colors["primary-color"]}
        label={t("settings.interface.apply")}
        onClick={() => applyTheme(props.name, props.themeObj)}
      />
    </div>
  );
}
