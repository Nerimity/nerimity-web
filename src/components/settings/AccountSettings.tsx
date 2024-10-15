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
import { t } from "i18next";
import { CustomLink } from "../ui/CustomLink";
import {
  getStorageString,
  setStorageString,
  StorageKeys,
} from "@/common/localStorage";
import socketClient from "@/chat-api/socketClient";
import DeleteConfirmModal from "../ui/delete-confirm-modal/DeleteConfirmModal";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import useServers from "@/chat-api/store/useServers";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import { Notice } from "../ui/Notice/Notice";
import { RawChannelNotice, RawUser } from "@/chat-api/RawData";
import { setSettingsHeaderPreview } from "./SettingsPane";
import Icon from "../ui/icon/Icon";
import { AdvancedMarkupOptions } from "../advanced-markup-options/AdvancedMarkupOptions";
import { formatMessage } from "../message-pane/MessagePane";
import { logout } from "@/common/logout";
import Checkbox from "../ui/Checkbox";
import {
  uploadAvatar,
  uploadBanner,
} from "@/chat-api/services/nerimityCDNService";

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
      title: "Settings - Account",
      iconName: "settings",
    });
  });

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title="Dashboard" />
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
  });

  onCleanup(() => {
    setSettingsHeaderPreview(reconcile({}));
  });

  const [inputValues, updatedInputValues, setInputValue] =
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
        setError("Confirm password does not match.");
        setRequestSent(false);
        return;
      }

      if (updatedInputValues().newPassword!.length > 72) {
        setError("Password must be less than 72 characters.");
        setRequestSent(false);
        return;
      }
    }

    const { avatar, banner, avatarPoints, ...values } = {
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
        setError(err.message);
      });
      if (res) {
        avatarId = res.fileId;
      }
    }

    if (banner) {
      const res = await uploadBanner(props.bot?.id || account.user()?.id!, {
        file: banner,
      }).catch((err) => {
        setError(err.message);
      });
      if (res) {
        bannerId = res.fileId;
      }
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
        setSettingsHeaderPreview(reconcile({}));
        props.onUpdated?.();
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setRequestSent(false));
  };

  const requestStatus = () => (requestSent() ? "Saving..." : "Save Changes");

  const { createPortal } = useCustomPortal();

  const onCropped = (points: [number, number, number]) => {
    setInputValue("avatarPoints", points);
    setSettingsHeaderPreview({ avatarPoints: points });
  };

  const onAvatarPick = (files: string[], rawFiles: FileList) => {
    if (files[0]) {
      createPortal((close) => (
        <ImageCropModal close={close} image={files[0]} onCropped={onCropped} />
      ));
      setInputValue("avatar", rawFiles[0]);
      setSettingsHeaderPreview({ avatar: files[0] });
    }
  };

  const onBannerPick = (files: string[], rawFiles: FileList) => {
    if (files[0]) {
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
        title="Reset Password"
        actionButtonsArr={[{ label: "OK", onClick: close }]}
      >
        {res.message}
      </LegacyModal>
    ));
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
          icon="email"
          label="Email"
        >
          <Input
            value={inputValues().email}
            onText={(v) => setInputValue("email", v)}
          />
        </SettingsBlock>
      </Show>

      <SettingsBlock icon="face" label="Username">
        <Input
          value={inputValues().username}
          onText={(v) => setInputValue("username", v)}
        />
      </SettingsBlock>

      <SettingsBlock icon="local_offer" label="Tag">
        <Input
          class={css`
            width: 52px;
          `}
          value={inputValues().tag}
          onText={(v) => setInputValue("tag", v)}
        />
      </SettingsBlock>

      <SettingsBlock
        icon="wallpaper"
        label="Avatar"
        description="Supported: JPG, PNG, GIF, WEBP, Max 12 MB"
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
              setSettingsHeaderPreview({
                avatar: undefined,
                avatarPoints: undefined,
              });
            }}
          />
        </Show>
        <Button
          iconSize={18}
          iconName="attach_file"
          label="Browse"
          onClick={avatarFileBrowserRef()?.open}
        />
      </SettingsBlock>

      <SettingsBlock
        icon="panorama"
        label="Banner"
        description="Supported: JPG, PNG, GIF, WEBP, Max 12 MB"
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
              setSettingsHeaderPreview({ banner: undefined });
            }}
          />
        </Show>
        <Button
          iconSize={18}
          iconName="attach_file"
          label="Browse"
          onClick={bannerFileBrowserRef()?.open}
        />
      </SettingsBlock>

      <SettingsBlock
        icon="info"
        label="Profile"
        description="Edit your bio or colors"
        href="./profile"
      >
        <Icon name="keyboard_arrow_right" />
      </SettingsBlock>
      <Show when={!props.bot}>
        <ChangePasswordButton
          onClick={onChangePasswordClick}
          style={{ "margin-bottom": "5px" }}
        >
          Change Password
        </ChangePasswordButton>
        <ChangePasswordButton
          onClick={onForgotPasswordClick}
          style={{ "margin-bottom": "5px" }}
        >
          Forgot Password
        </ChangePasswordButton>
      </Show>

      <Show when={!props.bot && showResetPassword()}>
        <SettingsBlock
          icon="password"
          label="New Password"
          description="Changing your password will log you out everywhere else."
        >
          <Input
            type="password"
            value={inputValues().newPassword}
            onText={(v) => setInputValue("newPassword", v)}
          />
        </SettingsBlock>
        <SettingsBlock
          icon="password"
          label="Confirm New Password"
          description="Confirm your new password"
        >
          <Input
            type="password"
            value={inputValues().confirmNewPassword}
            onText={(v) => setInputValue("confirmNewPassword", v)}
          />
        </SettingsBlock>
      </Show>

      <Show when={!props.bot && Object.keys(updatedInputValues()).length}>
        <SettingsBlock icon="password" label="Confirm Password">
          <Input
            type="password"
            value={inputValues().password}
            onText={(v) => setInputValue("password", v)}
          />
        </SettingsBlock>
      </Show>

      <Show when={error()}>
        <Text
          size={12}
          color="var(--alert-color)"
          style={{ "margin-top": "5px" }}
        >
          {error()}
        </Text>
      </Show>
      <Show when={Object.keys(updatedInputValues()).length}>
        <Button
          iconName="save"
          label={requestStatus()}
          class={css`
            align-self: flex-end;
          `}
          onClick={onSaveButtonClicked}
        />
      </Show>

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
            We're sad to see you go :( If you didn't like something, please let
            us know in the official Nerimity server.
          </div>
          What will get deleted:
          <div>• Email</div>
          <div>• Username</div>
          <div>• IP Address</div>
          <div>• Bio</div>
          <div>• Your Messages</div>
          <div>• Your Posts</div>
          <Notice
            style={{ "margin-top": "15px" }}
            type="info"
            description="Your posts and messages may take weeks to delete."
          />
          <Checkbox
            style={{ "margin-top": "8px", "margin-bottom": "18px" }}
            checked={scheduleDeleteContent()}
            onChange={setScheduleDeleteContent}
            labelSize={14}
            label="Delete my posts and messages"
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
        title="Delete Account"
        password
      />
    ));
  };

  return (
    <SettingsBlock
      class={deleteAccountBlockStyles}
      icon="delete"
      label="Delete My Account"
      description="This cannot be undone!"
    >
      <Button
        onClick={onClick}
        iconSize={18}
        primary
        color="var(--alert-color)"
        iconName="delete"
        label="Delete My Account"
      />
    </SettingsBlock>
  );
}

function DeleteAccountNoticeModal(props: { close(): void }) {
  return (
    <LegacyModal
      title="Delete Account"
      icon="delete"
      actionButtons={
        <Button
          iconName="check"
          styles={{ "margin-left": "auto" }}
          label="Understood"
          onClick={props.close}
        />
      }
      maxWidth={300}
    >
      <Text style={{ padding: "10px" }}>
        You must leave/delete all servers before you can delete your account.
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
      return setError("Channel notice cannot be longer than 300 characters.");
    const res = await updateDMChannelNotice(
      formattedContent,
      props.botToken
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
        label="Channel Notice"
        class={NoticeBlockStyle}
        description="Shows when the user is about to chat for the first time. Changes apply after reload."
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
              label="Remove Notice"
              color="var(--alert-color)"
              iconName="delete"
              onClick={deleteNotice}
            />
          </Show>
          <Show when={updatedInputValues().content}>
            <Button label="Save" iconName="save" onClick={save} />
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
      description="Confirm your email"
      class={css`
        margin-bottom: 10px;
      `}
    >
      <div style={{ "margin-left": "auto" }} />
      <Button
        label={
          remainingTimeInSeconds()
            ? `Resend in ${remainingTimeInSeconds()}`
            : "Send Code"
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
        label="Cancel"
        color="var(--alert-color)"
      />
      <Button
        styles={{ flex: 1 }}
        iconName="check"
        label="Confirm"
        onClick={confirmClicked}
        primary
      />
    </FlexRow>
  );

  return (
    <LegacyModal
      ignoreBackgroundClick
      title="Confirm Email"
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
        <Text size={14}>Enter the 5 digit code sent to your email:</Text>

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
