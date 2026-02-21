import { createSignal, Show } from "solid-js";
import FileBrowser, { FileBrowserRef } from "./FileBrowser";
import { t } from "@nerimity/i18lite";
import Button from "./Button";

export default function ImageSelector(props: {
  onChange?: (files: string[], rawFiles: FileList) => void;
  onRevert?: () => void;
  onDelete?: () => void;
  hasExistingValue?: boolean;
  newValue: () => any | null | undefined;
}) {
  const [fileBrowserRef, setFileBrowserRef] = createSignal<
    undefined | FileBrowserRef
  >();

  return (
    <>
      <FileBrowser
        accept="images"
        ref={setFileBrowserRef}
        base64
        onChange={props.onChange}
      />
      <div style={{ display: "flex", gap: "5px" }}>
        <Button
          margin={0}
          iconSize={18}
          iconName="attach_file"
          label={t("general.avatarAndBanner.browse")}
          onClick={fileBrowserRef()?.open}
        />
        <Show when={props.newValue() !== undefined}>
          <Button
            margin={0}
            color="var(--alert-color)"
            iconSize={18}
            iconName="undo"
            title={t("general.avatarAndBanner.revert")}
            onClick={props.onRevert}
          />
        </Show>
        <Show when={props.hasExistingValue && props.newValue() !== null}>
          <Button
            margin={0}
            color="var(--alert-color)"
            iconSize={18}
            iconName="delete"
            title={t("general.avatarAndBanner.remove")}
            onClick={props.onDelete}
          />
        </Show>
      </div>
    </>
  );
}
