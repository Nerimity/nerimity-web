import style from "./EditFolderModal.module.css";

import useStore from "@/chat-api/store/useStore";
import { createEffect, createSignal, Show } from "solid-js";
import { Modal } from "../ui/modal";
import { ColorPicker, ColorPickerRef } from "../ui/color-picker/ColorPicker";
import Input from "../ui/input/Input";
import Text from "../ui/Text";
import { ServerFolderItem } from "./ServerList";
import Icon from "../ui/icon/Icon";
import {
  updateServerFolderExtra,
} from "@/chat-api/services/ServerService";
import { t } from "@nerimity/i18lite";

export const EditFolderModal = (props: {
  close: () => void;
  folderId?: string;
}) => {
  const folderId = props.folderId;

  let colorPickerRef: ColorPickerRef | undefined;

  const store = useStore();

  const [folderName, setFolderName] = createSignal("");
  const [folderColor, setFolderColor] = createSignal("");
  const [error, setError] = createSignal("");
  const [requestSent, setRequestSent] = createSignal(false);

  const [folderHover, setFolderHover] = createSignal(false);

  const folder = () =>
    store.account.user()?.serverFolders?.find((f) => f.id === folderId);

  createEffect(() => {
    setFolderName(folder()?.name || "");
    setFolderColor(folder()?.color || "");
  });

  const handleSaveClick = async () => {
    if (requestSent()) return;
    setError("");
    const folderNameValue = folderName().trim();

    if (!folderNameValue) {
      setError(t("editFolderModal.errors.emptyName"));
      return;
    }
    setRequestSent(true);

    updateServerFolderExtra(folderId!, {
      name: folderNameValue,
      color: folderColor(),
    })
      .then(() => {
        props.close();
      })
      .catch((err) => {
        setError(err.message);
        setRequestSent(false);
      });
  };

  return (
    <Modal.Root close={props.close}>
      <Modal.Header title={t("editFolderModal.title")} icon="edit" />
      <Modal.Body class={style.modalBody}>
        <div class={style.colorAndName}>
          <ColorPicker
            alpha
            hide
            ref={colorPickerRef}
            color={folderColor()}
            onDone={setFolderColor}
          />
          <div
            class={style.folderOuter}
            onMouseEnter={() => setFolderHover(true)}
            onMouseLeave={() => setFolderHover(false)}
            onClick={() => colorPickerRef?.openModal()}
          >
            <div class={style.folderInner}>
              <Show when={folderHover()}>
                <Icon
                  class={style.paletteIcon}
                  name="palette"
                  color={folderColor()}
                  size={18}
                />
              </Show>
              <ServerFolderItem
                openedWithoutList={!folderHover()}
                size={40}
                folder={{
                  id: folderId!,
                  name: folderName(),
                  color: folderColor(),
                  serverIds: [],
                }}
              />
            </div>
          </div>
          <Input
            class={style.input}
            placeholder={t("editFolderModal.placeholder")}
            value={folderName()}
            onText={setFolderName}
          />
        </div>
        <Show when={error()}>
          <Text size={14} color="var(--alert-color)">
            {error()}
          </Text>
        </Show>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Button
          label={t("editFolderModal.cancelButton")}
          alert
          iconName="close"
          onClick={props.close}
        />
        <Modal.Button
          label={requestSent() ? t("editFolderModal.saving") : t("editFolderModal.save")}
          primary
          iconName="save"
          onClick={handleSaveClick}
          disabled={requestSent()}
        />
      </Modal.Footer>
    </Modal.Root>
  );
};
