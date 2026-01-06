import { Show } from "solid-js";
import { cn } from "@/common/classNames";
import Button from "./Button";
import style from "./FloatingSaveChanges.module.css";
import { t } from "@nerimity/i18lite";

export const FloatingSaveChanges = (props: {
  hasChanges: boolean | number;
  isSaving: boolean;
  onSave: () => void;
  onUndo?: () => void;
  error?: string | null;
}) => {
  const saveLabel = () =>
    props.isSaving ? t("general.saving") : t("general.saveChangesButton");

  return (
    <div class={cn(style.container, props.hasChanges && style.show)}>
      <Show when={props.error}>
        <div class={style.error}>{props.error}</div>
      </Show>
      <div class={style.buttons}>
        <Show when={props.onUndo}>
          <Button
            label="Undo"
            iconName="undo"
            type="hover_border"
            alert
            margin={0}
            textSize={12}
            iconSize={18}
            onClick={props.onUndo}
          />
        </Show>
        <Button
          onClick={props.onSave}
          label={saveLabel()}
          iconName="save"
          primary
          margin={0}
        />
      </div>
    </div>
  );
};
