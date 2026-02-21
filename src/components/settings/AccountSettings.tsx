import {
  createEffect,
  createSignal,
  lazy,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import useStore from "@/chat-api/store/useStore";
import Input from "@/components/ui/input/Input";
import Button from "@/components/ui/Button";
import { createUpdatedSignal } from "@/common/createUpdatedSignal";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Text from "@/components/ui/Text";
import { css, styled } from "solid-styled-components";
import {
  deleteAccount,
  deleteDMChannelNotice,
  getDMChannelNotice,
  resetPassword,
  sendEmailConfirmCode,
  sendResetPassword,
  updateDMChannelNotice,
  updateUser,
  verifyEmailConfirmCode,
} from "@/chat-api/services/UserService";
import FileBrowser, { FileBrowserRef } from "../ui/FileBrowser";
import { reconcile } from "solid-js/store";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "@nerimity/i18lite";
import { CustomLink } from "../ui/CustomLink";
import {
  getStorageString,
  setStorageString,
  StorageKeys,
} from "@/common/localStorage";
import socketClient from "@/chat-api/socketClient";
import DeleteConfirmModal from "../ui/delete-confirm-modal/DeleteConfirmModal";
import { toast, useCustomPortal } from "../ui/custom-portal/CustomPortal";
import useServers from "@/chat-api/store/useServers";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import { Notice } from "../ui/Notice/Notice";
import { RawChannelNotice, RawUser } from "@/chat-api/RawData";
import { setSettingsHeaderPreview } from "./settingsHeaderPreview";
import Icon from "../ui/icon/Icon";
import { AdvancedMarkupOptions } from "../advanced-markup-options/AdvancedMarkupOptions";
import { formatMessage } from "../message-pane/MessagePane";
import { logout } from "@/common/logout";
import Checkbox from "../ui/Checkbox";
import {
  uploadAvatar,
  uploadBanner,
} from "@/chat-api/services/nerimityCDNService";
import { FloatingSaveChanges } from "../ui/FloatingSaveChanges";
import ImageSelector from "../ui/ImageSelector";

const ImageCropModal = lazy(() => import("../ui/ImageCropModal"));

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  padding: 10px;
`;

export default function AccountSettings() {
  const { header } = useStore();

  createEffect(() => {
    header.updateHeader({
      title: t("settings.drawer.title") + " - " + t("settings.drawer.account"),
      iconName: "settings",
    });
  });

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title={t("dashboard.title")} />
        <BreadcrumbItem
          title={t("settings.drawer.account")}
          href="../account"
        />
      </Breadcrumb>

      <EditAccountPage />
    </Container>
  );
}

const ChangePasswordButton = styled("button")`
  color: var(--primary-color);
  background-color: transparent;
  border: none;
  align-self: flex-start;
  cursor: pointer;
  user-select: none;
  &:hover {
    text-decoration: underline;
  }
`;

export function EditAccountPage(props: {
  bot?: RawUser;
  botToken?: string | null;
  onUpdated?: () => void;
}) {
  const { account } = useStore();
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal<null | string>(null);
  const [avatarFileBrowserRef, setAvatarFileBrowserRef] = createSignal<
    undefined | FileBrowserRef
  >();
  const [bannerFileBrowserRef, setBannerFileBrowserRef] = createSignal<
    undefined | FileBrowserRef
  >();

  const [showResetPassword, setShowResetPassword] = createSignal(false);

  const user = () => props.bot || account.user();


  const defaultInput = () => ({
    email: user()?.email || "",
    username: user()?.username || "",
    tag: user()?.tag || "",
    password: "",
    newPassword: "",
    confirmNewPassword: "",
    avatar: undefined as File | undefined,
    banner: undefined as File | undefined,
    avatarPoints: null as null | number[],
    bannerPoints: null as null | number[],
  });

  onCleanup(() => {
    setSettingsHeaderPreview(reconcile({}));
  });

  const [inputValues, updatedInputValues, setInputValue, undoUpdatedValues] =
    createUpdatedSignal(defaultInput);

  const onSaveButtonClicked = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError(null);

    if (updatedInputValues().newPassword) {
      if (
        updatedInputValues().newPassword !==
        updatedInputValues().confirmNewPassword
      ) {
        setError(t("resetPassword.passwordsDoNotMatch"));
        setRequestSent(false);
        return;
      }

      if (updatedInputValues().newPassword!.length > 72) {
        setError(t("resetPassword.passwordTooLong"));
        setRequestSent(false);
        return;
      }
    }

    if (
      !updatedInputValues().password &&
      !props.bot &&
      (updatedInputValues().newPassword ||
        updatedInputValues().username ||
        updatedInputValues().tag ||
        updatedInputValues().email)
    ) {
      createPortal((close) => (
        <ConfirmPasswordModal
          close={close}
          onConfirm={(password) => {
            if (!password.trim()) return;
            setInputValue("password", password);
            onSaveButtonClicked();
            close();
          }}
        />
      ));
      setRequestSent(false);
      return;
    }

    const { avatar, banner, avatarPoints, bannerPoints, ...values } = {
      ...updatedInputValues(),
      socketId: socketClient.id(),
      confirmNewPassword: undefined,
    };

    let avatarId;
    let bannerId;

    if (avatar) {
      const res = await uploadAvatar(props.bot?.id || account.user()?.id!, {
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
    } else if (avatar === null) {
      avatarId = null;
    }

    if (banner) {
      const res = await uploadBanner(props.bot?.id || account.user()?.id!, {
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
    } else if (banner === null) {
      bannerId = null;
    }

    await updateUser({ ...values, bannerId, avatarId }, props.botToken)
      .then((res) => {
        if (!props.bot) {
          if (res.newToken) {
            setStorageString(StorageKeys.USER_TOKEN, res.newToken);
            socketClient.updateToken(res.newToken);
          }
          if (values.email && values.email !== account.user()?.email) {
            account.setUser({ emailConfirmed: false });
          }
        }
        setShowResetPassword(false);
        setInputValue("password", "");
        setInputValue("newPassword", "");
        setInputValue("confirmNewPassword", "");
        setInputValue("avatar", undefined);
        setInputValue("avatarPoints", null);
        setInputValue("banner", undefined);
        setInputValue("bannerPoints", null);
        setSettingsHeaderPreview(reconcile({}));
        props.onUpdated?.();
      })
      .catch((err) => {
        setError(err.message);
        setInputValue("password", "");
      })
      .finally(() => setRequestSent(false));
  };

  const { createPortal } = useCustomPortal();

  const onCropped = (
    points: number[],
    type: "avatar" | "banner" = "avatar",
  ) => {
    const pointsKey = type === "banner" ? "bannerPoints" : "avatarPoints";

    setInputValue(pointsKey, points);
    setSettingsHeaderPreview({ [pointsKey]: points });
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
      setSettingsHeaderPreview({ avatar: files[0] });
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
          close={close}
          image={files[0]}
          onCropped={(p) => onCropped(p, "banner")}
        />
      ));
      setInputValue("banner", rawFiles[0]);
      setSettingsHeaderPreview({ banner: files[0] });
    }
  };

  const onChangePasswordClick = () => {
    setInputValue("newPassword", "");
    setInputValue("confirmNewPassword", "");
    setShowResetPassword(!showResetPassword());
  };

  const [forgotPasswordSent, setForgotPasswordSent] = createSignal(false);

  const onForgotPasswordClick = async () => {
    if (forgotPasswordSent()) return;
    setTimeout(() => {
      setForgotPasswordSent(false);
    }, 5000);

    const res = await sendResetPassword(user()?.email!);
    setForgotPasswordSent(true);
    createPortal((close) => (
      <LegacyModal
        close={close}
        ignoreBackgroundClick
        title={t("resetPassword.title")}
        actionButtonsArr={[{ label: "OK", onClick: close }]}
      >
        {res.message}
      </LegacyModal>
    ));
  };

  const [showEmail, setShowEmail] = createSignal(false);
  const [emailInputRef, setEmailInputRef] = createSignal<HTMLInputElement>();
  const hiddenEmail = () => {
    if (!account.user()?.email) return "";
    const emailSplit = account.user()?.email.split("@");

    const astricts = emailSplit?.[0]
      ?.split("")
      .map(() => "*")
      .join("");
    return `${astricts}@${emailSplit?.[1]}`;
  };

  return (
    <>
      <Show
        when={!props.bot && account.user() && !account.user()?.emailConfirmed}
      >
        <ConfirmEmailNotice />
      </Show>
      <Show when={!props.bot}>
        <SettingsBlock
          class={css`
            position: relative;
            z-index: 111;
          `}
          icon="mail"
          label={t("general.accountData.email")}
        >
          <div
            class={css`
              position: relative;
            `}
          >
            <Show when={!showEmail()}>
              <div
                onClick={() => {
                  setShowEmail(true);
                  emailInputRef()?.focus();
                }}
                class={css`
                  position: absolute;
                  inset: 0;
                  z-index: 11111;
                `}
              />
            </Show>
            <Input
              disabled={!showEmail()}
              ref={setEmailInputRef}
              value={!showEmail() ? hiddenEmail() : inputValues().email}
              onText={(v) => setInputValue("email", v)}
              suffix={
                <Show when={!showEmail()}>
                  <Button iconName="edit" iconSize={16} />
                </Show>
              }
            />
          </div>
        </SettingsBlock>
      </Show>

      <SettingsBlock icon="face" label={t("general.accountData.username")}>
        <Input
          value={inputValues().username}
          onText={(v) => setInputValue("username", v)}
        />
      </SettingsBlock>
      <Show when={props.bot}>
        <SettingsBlock icon="id_card" label={t("settings.account.botID")}>
          <Input value={props.bot?.id} disabled />
        </SettingsBlock>
      </Show>

      <SettingsBlock icon="sell" label={t("settings.account.tag")}>
        <Input
          class={css`
            width: 5em;
          `}
          value={inputValues().tag}
          maxLength={4}
          onText={(v) => setInputValue("tag", v)}
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
        <ImageSelector
          onChange={onAvatarPick}
          onRevert={() => {
            setInputValue("avatar", undefined);
            setInputValue("avatarPoints", null);
            setSettingsHeaderPreview({
              avatar: undefined,
              avatarPoints: undefined,
            });
          }}
          onDelete={() => {
            setInputValue("avatar", null);
            setInputValue("avatarPoints", null);
            setSettingsHeaderPreview({
              avatar: null,
              avatarPoints: undefined,
            });
          }}
          newValue={() => inputValues().avatar}
          hasExistingValue={!!user()?.avatar}
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
        <ImageSelector
          onChange={onBannerPick}
          onRevert={() => {
            setInputValue("banner", undefined);
            setInputValue("bannerPoints", null);
            setSettingsHeaderPreview({
              banner: undefined,
              bannerPoints: undefined,
            });
          }}
          onDelete={() => {
            setInputValue("banner", null);
            setInputValue("bannerPoints", null);
            setSettingsHeaderPreview({
              banner: null,
              bannerPoints: undefined,
            });
          }}
          newValue={() => inputValues().banner}
          hasExistingValue={!!user()?.banner}
        />
      </SettingsBlock>


      <Show when={props.bot}>
        <SettingsBlock
          icon="person"
          label={t("settings.account.profile")}
          href="./profile"
        />
      </Show>

      <Show when={!props.bot}>
        <SettingsBlock
          icon="info"
          label="Looking for Profile Settings?"
          description="Profile Settings has been moved to the settings drawer on the left."
          href="/app/settings/profile"
        />
        <ChangePasswordButton
          onClick={onChangePasswordClick}
          style={{ "margin-bottom": "5px" }}
        >
          {t("settings.account.changePassword")}
        </ChangePasswordButton>
        <ChangePasswordButton
          onClick={onForgotPasswordClick}
          style={{ "margin-bottom": "5px" }}
        >
          {t("settings.account.forgotPassword")}
        </ChangePasswordButton>
      </Show>

      <Show when={!props.bot && showResetPassword()}>
        <SettingsBlock
          icon="password"
          label={t("settings.account.newPassword")}
          description={t("settings.account.newPasswordDescription")}
        >
          <Input
            type="password"
            value={inputValues().newPassword}
            onText={(v) => setInputValue("newPassword", v)}
          />
        </SettingsBlock>
        <SettingsBlock
          icon="password"
          label={t("settings.account.confirmNewPassword")}
          description={t("settings.account.confirmNewPasswordDescription")}
        >
          <Input
            type="password"
            value={inputValues().confirmNewPassword}
            onText={(v) => setInputValue("confirmNewPassword", v)}
          />
        </SettingsBlock>
      </Show>

      {/* <Show when={!props.bot && Object.keys(updatedInputValues()).length}>
        <SettingsBlock
          icon="password"
          label={t("settings.account.confirmCurrentPassword")}
        >
          <Input
            type="password"
            value={inputValues().password}
            onText={(v) => setInputValue("password", v)}
          />
        </SettingsBlock>
      </Show> */}

      <FloatingSaveChanges
        hasChanges={Object.keys(updatedInputValues()).length}
        isSaving={requestSent()}
        onSave={onSaveButtonClicked}
        error={error()}
        onUndo={() => {
          undoUpdatedValues();
          setSettingsHeaderPreview(reconcile({}));
        }}
      />
      <ChannelNoticeBlock botToken={props.botToken} />

      <Show when={!props.bot}>
        <DeleteAccountBlock />
      </Show>
    </>
  );
}

const deleteAccountBlockStyles = css`
  margin-top: 50px;
  border: solid 1px var(--alert-color);
`;

function DeleteAccountBlock() {
  const { createPortal } = useCustomPortal();
  const [scheduleDeleteContent, setScheduleDeleteContent] = createSignal(true);
  const { array } = useServers();

  const serverCount = () => array().length;

  const onDeleteClick = async (password: string) => {
    let err = "";
    await deleteAccount(password, scheduleDeleteContent()).catch((error) => {
      err = error.message;
    });
    if (!err) {
      logout();
    }
    return err;
  };

  const onClick = () => {
    const ModalInfo = () => {
      return (
        <div style={{ "margin-top": "-12px", "font-size": "14px" }}>
          <div style={{ "margin-bottom": "12px" }}>
            {t("settings.account.deletionNotice")}
          </div>
          {t("settings.account.deletedInfo.title")}
          <div>{t("settings.account.deletedInfo.email")}</div>
          <div>{t("settings.account.deletedInfo.username")}</div>
          <div>{t("settings.account.deletedInfo.ip")}</div>
          <div>{t("settings.account.deletedInfo.bio")}</div>
          <div>{t("settings.account.deletedInfo.messages")}</div>
          <div>{t("settings.account.deletedInfo.posts")}</div>
          <Notice
            style={{ "margin-top": "15px" }}
            type="info"
            description={t("settings.account.postsAndMessagesNotice")}
          />
          <Checkbox
            style={{ "margin-top": "8px", "margin-bottom": "18px" }}
            checked={scheduleDeleteContent()}
            onChange={setScheduleDeleteContent}
            labelSize={14}
            label={t("settings.account.deleteCheckbox")}
          />
        </div>
      );
    };
    if (serverCount()) {
      createPortal((close) => <DeleteAccountNoticeModal close={close} />);
      return;
    }
    createPortal((close) => (
      <DeleteConfirmModal
        onDeleteClick={onDeleteClick}
        custom={<ModalInfo />}
        close={close}
        confirmText="account"
        title={t("settings.account.deleteAccount")}
        password
      />
    ));
  };

  return (
    <SettingsBlock
      class={deleteAccountBlockStyles}
      icon="delete"
      label={t("settings.account.deleteAccount")}
      description={t("general.cannotBeUndone")}
    >
      <Button
        onClick={onClick}
        iconSize={18}
        primary
        color="var(--alert-color)"
        iconName="delete"
        label={t("settings.account.deleteAccount")}
      />
    </SettingsBlock>
  );
}

function DeleteAccountNoticeModal(props: { close(): void }) {
  return (
    <LegacyModal
      title={t("settings.account.deleteAccount")}
      icon="delete"
      actionButtons={
        <Button
          iconName="check"
          styles={{ "margin-left": "auto" }}
          label={t("settings.account.understoodButton")}
          onClick={props.close}
        />
      }
      maxWidth={300}
    >
      <Text style={{ padding: "10px" }}>
        {t("settings.account.deleteAccountNotice")}
      </Text>
    </LegacyModal>
  );
}

const NoticeBlockStyle = css`
  && {
    height: initial;
    min-height: initial;
    align-items: start;
    flex-direction: column;
    flex: 0;
    padding-top: 15px;
    align-items: stretch;
  }
  .advancedMarkupOptions {
    margin-left: 35px;
    margin-top: 5px;
  }
  .inputContainer {
    margin-left: 35px;
  }
  textarea {
    min-height: 100px;
  }
`;

function ChannelNoticeBlock(props: { botToken?: string | null }) {
  const [error, setError] = createSignal<string>("");
  const [channelNotice, setChannelNotice] =
    createSignal<RawChannelNotice | null>(null);
  const [inputRef, setInputRef] = createSignal<HTMLInputElement | null>(null);

  const defaultInput = () => ({
    content: channelNotice()?.content || "",
  });

  const [inputValues, updatedInputValues, setInputValue] =
    createUpdatedSignal(defaultInput);

  onMount(async () => {
    const res = await getDMChannelNotice(props.botToken);
    if (!res) return;
    setChannelNotice(res.notice);
  });

  const save = async () => {
    setError("");
    const formattedContent = formatMessage(inputValues().content.trim());
    if (formattedContent.length > 300)
      return setError(t("settings.account.channelNoticeTooLong"));
    const res = await updateDMChannelNotice(
      formattedContent,
      props.botToken,
    ).catch((err) => {
      setError(err.message);
    });
    if (!res) return;
    setChannelNotice(res.notice);
    setInputValue("content", res.notice.content);
  };

  const deleteNotice = async () => {
    const res = await deleteDMChannelNotice(props.botToken).catch((err) => {
      setError(err.message);
    });
    if (!res) return;
    setChannelNotice(null);
    setInputValue("content", "");
  };

  return (
    <div
      style={{
        "margin-bottom": "35px",
        "padding-bottom": "30px",
        "border-bottom": "solid 1px rgba(255,255,255,0.2)",
      }}
    >
      <SettingsBlock
        icon="info"
        label={t("settings.account.channelNotice")}
        class={NoticeBlockStyle}
        description={t("settings.account.channelNoticeDescription")}
      >
        <Text size={12} style={{ "margin-left": "38px", "margin-top": "5px" }}>
          ({inputValues().content.length} / 300)
        </Text>
        <AdvancedMarkupOptions
          class="advancedMarkupOptions"
          inputElement={inputRef()!}
          updateText={(v) => setInputValue("content", v)}
        />
        <Input
          ref={setInputRef}
          class="inputContainer"
          type="textarea"
          value={inputValues().content}
          onText={(v) => setInputValue("content", v)}
        />
        <Show when={error()}>
          <Text style={{ "margin-left": "40px" }} color="var(--alert-color)">
            {error()}
          </Text>
        </Show>

        <div
          style={{
            display: "flex",
            "align-self": "flex-end",
            "margin-top": "15px",
          }}
        >
          <Show when={channelNotice()?.content}>
            <Button
              label={t("servers.settings.channel.removeNoticeButton")}
              color="var(--alert-color)"
              iconName="delete"
              onClick={deleteNotice}
            />
          </Show>
          <Show when={updatedInputValues().content}>
            <Button
              label={t("general.saveButton")}
              iconName="save"
              onClick={save}
            />
          </Show>
        </div>
      </SettingsBlock>
    </div>
  );
}

let lastConfirmClickedTime: number | null = null;

const ConfirmEmailNotice = () => {
  const [now, setNow] = createSignal(Date.now());
  const { createPortal } = useCustomPortal();

  onMount(() => {
    const timerId = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    onCleanup(() => {
      clearInterval(timerId);
    });
  });

  const remainingTimeInSeconds = () => {
    const n = now();
    if (!lastConfirmClickedTime) return 0;
    const time = 60 - (n - lastConfirmClickedTime) / 1000;
    if (time < 0) return 0;
    return Math.round(time);
  };

  const onSendCodeClick = async () => {
    if (remainingTimeInSeconds()) {
      return;
    }
    lastConfirmClickedTime = Date.now();
    setNow(Date.now());

    const res = await sendEmailConfirmCode().catch((err) => {
      const ttl = err.ttl;
      if (!ttl) return;
      lastConfirmClickedTime = Date.now() - (60000 - ttl);
      setNow(Date.now());
    });
    if (!res) return;

    lastConfirmClickedTime = Date.now();
    setNow(Date.now());

    createPortal((close) => (
      <ConfirmEmailModal message={res.message} close={close} />
    ));
  };

  return (
    <Notice
      type="warn"
      description={t("settings.account.confirmEmail")}
      class={css`
        margin-bottom: 10px;
      `}
    >
      <div style={{ "margin-left": "auto" }} />
      <Button
        label={
          remainingTimeInSeconds()
            ? t("settings.account.resendIn", { time: remainingTimeInSeconds() })
            : t("settings.account.sendCodeButton")
        }
        primary
        margin={0}
        onClick={onSendCodeClick}
      />
    </Notice>
  );
};

const ConfirmEmailModal = (props: { close(): void; message: string }) => {
  const { account } = useStore();
  const [code, setCode] = createSignal("");
  const [errorMessage, setErrorMessage] = createSignal("");

  const confirmClicked = async () => {
    setErrorMessage("");
    const res = await verifyEmailConfirmCode(code()).catch((err) => {
      setErrorMessage(err.message);
    });
    if (res?.status) {
      props.close();
      account.setUser({ emailConfirmed: true });
    }
  };

  const actionButtons = (
    <FlexRow style={{ flex: 1 }}>
      <Button
        onClick={props.close}
        styles={{ flex: 1 }}
        iconName="close"
        label={t("general.cancelButton")}
        color="var(--alert-color)"
      />
      <Button
        styles={{ flex: 1 }}
        iconName="check"
        label={t("general.confirmButton")}
        onClick={confirmClicked}
        primary
      />
    </FlexRow>
  );

  return (
    <LegacyModal
      ignoreBackgroundClick
      title={t("settings.account.confirmEmail")}
      close={props.close}
      actionButtons={actionButtons}
    >
      <FlexColumn
        class={css`
          align-items: center;
          margin: 10px;
        `}
        gap={10}
      >
        <Text color="var(--success-color)">{props.message}</Text>
        <Text size={14}>{t("settings.account.enterCode")}</Text>

        <Input
          value={code()}
          onText={setCode}
          placeholder="_ _ _ _ _"
          class={css`
            width: 140px;
            input {
              font-size: 30px;
            }
          `}
        />
        <Text color="var(--alert-color)" size={14}>
          {errorMessage()}
        </Text>
      </FlexColumn>
    </LegacyModal>
  );
};
const ConfirmPasswordModal = (props: {
  close(): void;
  onConfirm(password: string): void;
}) => {
  const [password, setPassword] = createSignal("");

  const actionButtons = (
    <FlexRow style={{ flex: 1 }}>
      <Button
        onClick={props.close}
        styles={{ flex: 1 }}
        iconName="close"
        label={t("general.cancelButton")}
        color="var(--alert-color)"
      />
      <Button
        styles={{ flex: 1 }}
        iconName="check"
        label={t("general.confirmButton")}
        onClick={() => props.onConfirm(password())}
        primary
      />
    </FlexRow>
  );

  return (
    <LegacyModal
      ignoreBackgroundClick
      title={t("registerPage.confirmPassword")}
      close={props.close}
      actionButtons={actionButtons}
    >
      <FlexColumn
        class={css`
          align-items: center;
          margin: 10px;
        `}
        gap={10}
      >
        <Text size={14}>{t("settings.account.confirmPasswordToContinue")}</Text>

        <Input value={password()} onText={setPassword} type="password" />
      </FlexColumn>
    </LegacyModal>
  );
};
