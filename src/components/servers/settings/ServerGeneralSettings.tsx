import { useParams } from "solid-navigator";
import { createEffect, createSignal, onCleanup, Show, lazy } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import Input from "@/components/ui/input/Input";
import DropDown from "@/components/ui/drop-down/DropDown";
import Button from "@/components/ui/Button";
import { createUpdatedSignal } from "@/common/createUpdatedSignal";
import { deleteServer, updateServer } from "@/chat-api/services/ServerService";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import { Server } from "@/chat-api/store/useServers";
import DeleteConfirmModal from "@/components/ui/delete-confirm-modal/DeleteConfirmModal";
import {
  toast,
  useCustomPortal,
} from "@/components/ui/custom-portal/CustomPortal";
import Text from "@/components/ui/Text";
import { css, styled } from "solid-styled-components";
import { Notice } from "@/components/ui/Notice/Notice";
import { t } from "@nerimity/i18lite";
import FileBrowser, { FileBrowserRef } from "@/components/ui/FileBrowser";
import { reconcile } from "solid-js/store";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import RouterEndpoints from "@/common/RouterEndpoints";
import { ChannelType } from "@/chat-api/RawData";
import { setServerSettingsHeaderPreview } from "./settings-pane/serverSettingsHeaderPreview";
import {
  uploadAvatar,
  uploadBanner,
} from "@/chat-api/services/nerimityCDNService";
import { FloatingSaveChanges } from "@/components/ui/FloatingSaveChanges";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  padding: 10px;
`;

const ImageCropModal = lazy(() => import("@/components/ui/ImageCropModal"));

export default function ServerGeneralSettings() {
  const params = useParams<{ serverId: string }>();
  const { header, servers, channels, account } = useStore();
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal<null | string>(null);
  const { createPortal } = useCustomPortal();
  const [avatarFileBrowserRef, setAvatarFileBrowserRef] = createSignal<
    undefined | FileBrowserRef
  >();
  const [bannerFileBrowserRef, setBannerFileBrowserRef] = createSignal<
    undefined | FileBrowserRef
  >();

  const server = () => servers.get(params.serverId);

  const defaultInput = () => ({
    name: server()?.name || "",
    defaultChannelId: server()?.defaultChannelId || "",
    systemChannelId: server()?.systemChannelId || null,
    avatar: undefined as File | undefined,
    banner: undefined as File | undefined,
    avatarPoints: null as null | number[],
    bannerPoints: null as null | number[],
  });

  const [inputValues, updatedInputValues, setInputValue, undoUpdatedInput] =
    createUpdatedSignal(defaultInput);

  const dropDownChannels = () =>
    channels
      .getSortedChannelsByServerId(params.serverId)
      .filter((c) => c?.type !== ChannelType.CATEGORY)
      .map((channel) => ({
        id: channel!.id,
        label: channel!.name,
        onClick: () => {
          setInputValue("defaultChannelId", channel!.id);
        },
      }));

  const dropDownSystemChannels = () => {
    const list = channels
      .getSortedChannelsByServerId(params.serverId)
      .filter((c) => c?.type !== ChannelType.CATEGORY)
      .map((channel) => ({
        id: channel!.id,
        label: channel!.name,
        onClick: () => {
          setInputValue("systemChannelId", channel!.id);
        },
      }));

    return [
      {
        id: null,
        label: t("servers.settings.general.none"),
        onClick: () => {
          setInputValue("systemChannelId", null);
        },
      },
      ...list,
    ];
  };

  createEffect(() => {
    header.updateHeader({
      title:
        t("settings.drawer.title") +
        " - " +
        t("servers.settings.drawer.general"),
      serverId: params.serverId!,
      iconName: "settings",
    });
  });
  onCleanup(() => {
    setServerSettingsHeaderPreview(reconcile({}));
  });

  const onSaveButtonClicked = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError(null);
    const { avatar, banner, avatarPoints, bannerPoints, ...rest } =
      updatedInputValues();

    let avatarId;
    let bannerId;

    if (avatar) {
      const res = await uploadAvatar(server()?.id!, {
        file: avatar,
        points: avatarPoints!,
      }).catch((err) => {
        setError("Failed to update avatar. " + (err.message || err.error));
      });
      if (!res) {
        setRequestSent(false);
        return;
      }
      avatarId = res.fileId;
    }

    if (banner) {
      const res = await uploadBanner(server()?.id!, {
        file: banner,
        points: bannerPoints!,
      }).catch((err) => {
        setError("Failed to update banner. " + (err.message || err.error));
      });
      if (!res) {
        setRequestSent(false);
        return;
      }
      bannerId = res.fileId;
    }

    await updateServer(params.serverId!, { ...rest, bannerId, avatarId })
      .then(() => {
        setInputValue("avatar", undefined);
        setInputValue("avatarPoints", null);
        setInputValue("banner", undefined);
        setInputValue("bannerPoints", null);
        setServerSettingsHeaderPreview(reconcile({}));
      })
      .catch((err) => setError(err.message))
      .finally(() => setRequestSent(false));
  };

  const requestStatus = () =>
    requestSent() ? t("general.saving") : t("general.saveChangesButton");

  const showDeleteConfirm = () => {
    createPortal?.((close) => (
      <ServerDeleteConfirmModal close={close} server={server()!} />
    ));
  };

  const onCropped = (
    points: number[],
    type: "avatar" | "banner" = "avatar",
  ) => {
    const pointsKey = type === "banner" ? "bannerPoints" : "avatarPoints";
    setInputValue(pointsKey, points);
    setServerSettingsHeaderPreview({ [pointsKey]: points });
  };

  const onAvatarPick = (files: string[], rawFiles: FileList) => {
    const size = rawFiles[0]?.size || 0;
    const MAX_SIZE = 12; // 12 MB
    if (size > MAX_SIZE * 1024 * 1024) {
      toast(`File size must be less than ${MAX_SIZE}MB`);
      return;
    }
    if (files[0]) {
      createPortal((close) => (
        <ImageCropModal
          close={close}
          image={files[0]}
          onCropped={(p) => onCropped(p, "avatar")}
        />
      ));
      setInputValue("avatar", rawFiles[0]);
      setServerSettingsHeaderPreview({ avatar: files[0] });
    }
  };

  const onBannerPick = (files: string[], rawFiles: FileList) => {
    const size = rawFiles[0]?.size || 0;
    const MAX_SIZE = 12; // 12 MB
    if (size > MAX_SIZE * 1024 * 1024) {
      toast(`File size must be less than ${MAX_SIZE}MB`);
      return;
    }
    if (files[0]) {
      createPortal((close) => (
        <ImageCropModal
          type="banner"
          aspect={900 / 250}
          close={close}
          image={files[0]}
          onCropped={(p) => onCropped(p, "banner")}
        />
      ));
      setInputValue("banner", rawFiles[0]);
      setServerSettingsHeaderPreview({ banner: files[0] });
    }
  };

  const isServerCreator = () => account.user()?.id === server()?.createdById;

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem
          href={RouterEndpoints.SERVER_MESSAGES(
            params.serverId,
            server()?.defaultChannelId!,
          )}
          icon="home"
          title={server()?.name}
        />
        <BreadcrumbItem title={t("servers.settings.drawer.general")} />
      </Breadcrumb>
      <Show when={server()?.verified}>
        <Notice
          class={css`
            margin-bottom: 10px;
          `}
          type="warn"
          description={t("servers.settings.general.serverRenameNotice")}
        />
      </Show>

      <SettingsBlock
        icon="edit"
        label={t("servers.settings.general.serverName")}
      >
        <Input
          value={inputValues().name}
          onText={(v) => {
            setInputValue("name", v);
            setServerSettingsHeaderPreview({ name: v });
          }}
        />
      </SettingsBlock>
      <SettingsBlock
        icon="tag"
        label={t("servers.settings.general.defaultChannel")}
        description={t("servers.settings.general.defaultChannelDescription")}
      >
        <DropDown
          items={dropDownChannels()}
          selectedId={inputValues().defaultChannelId}
        />
      </SettingsBlock>

      <SettingsBlock
        icon="wysiwyg"
        label={t("servers.settings.general.systemMessages")}
        description={t("servers.settings.general.systemMessagesDescription")}
      >
        <DropDown
          items={dropDownSystemChannels()}
          selectedId={inputValues().systemChannelId}
        />
      </SettingsBlock>

      <SettingsBlock
        icon="wallpaper"
        label={t("general.avatarAndBanner.avatar")}
        description={t("general.avatarAndBanner.supportedFileTypes", {
          extensions: "JPG, PNG, GIF, WEBP",
          size: "12MB",
        })}
      >
        <FileBrowser
          accept="images"
          ref={setAvatarFileBrowserRef}
          base64
          onChange={onAvatarPick}
        />
        <Show when={inputValues().avatar}>
          <Button
            margin={0}
            color="var(--alert-color)"
            iconSize={18}
            iconName="close"
            onClick={() => {
              setInputValue("avatar", undefined);
              setInputValue("avatarPoints", null);
              setServerSettingsHeaderPreview({
                avatar: undefined,
                avatarPoints: undefined,
              });
            }}
          />
        </Show>
        <Button
          iconSize={18}
          iconName="attach_file"
          label={t("general.avatarAndBanner.browse")}
          onClick={avatarFileBrowserRef()?.open}
        />
      </SettingsBlock>

      <SettingsBlock
        icon="panorama"
        label={t("general.avatarAndBanner.banner")}
        description={t("general.avatarAndBanner.supportedFileTypes", {
          extensions: "JPG, PNG, GIF, WEBP",
          size: "12MB",
        })}
      >
        <FileBrowser
          accept="images"
          ref={setBannerFileBrowserRef}
          base64
          onChange={onBannerPick}
        />
        <Show when={inputValues().banner}>
          <Button
            margin={0}
            color="var(--alert-color)"
            iconSize={18}
            iconName="close"
            onClick={() => {
              setInputValue("banner", undefined);
              setInputValue("bannerPoints", null);
              setServerSettingsHeaderPreview({
                banner: undefined,
                bannerPoints: undefined,
              });
            }}
          />
        </Show>
        <Button
          iconSize={18}
          iconName="attach_file"
          label={t("general.avatarAndBanner.browse")}
          onClick={bannerFileBrowserRef()?.open}
        />
      </SettingsBlock>

      <Show when={isServerCreator()}>
        <SettingsBlock
          icon="delete"
          label={t("servers.settings.general.deleteThisServer")}
          description={t("general.cannotBeUndone")}
        >
          <Button
            label={t("servers.settings.general.deleteServerButton")}
            color="var(--alert-color)"
            onClick={showDeleteConfirm}
          />
        </SettingsBlock>
      </Show>

      <FloatingSaveChanges
        error={error()}
        hasChanges={Object.keys(updatedInputValues()).length}
        isSaving={requestSent()}
        onSave={onSaveButtonClicked}
        onUndo={() => {
          undoUpdatedInput();
        }}
      />
    </Container>
  );
}

export function ServerDeleteConfirmModal(props: {
  server: Server;
  close: () => void;
}) {
  const [error, setError] = createSignal<string | null>(null);

  createEffect(() => {
    if (!props.server) {
      props.close();
    }
  });

  const onDeleteClick = async () => {
    setError(null);
    let error = "";
    deleteServer(props.server.id).catch((e) => {
      error = e.message;
      setError(e);
    });
    return error;
  };

  return (
    <DeleteConfirmModal
      title={`${t("servers.settings.general.deleteThisServer")} ${
        props.server?.name
      }`}
      close={props.close}
      errorMessage={error()}
      confirmText={props.server?.name}
      onDeleteClick={onDeleteClick}
    />
  );
}
