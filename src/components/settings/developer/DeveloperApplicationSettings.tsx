import { For, Show, createEffect, createSignal, onMount } from "solid-js";
import { css, styled } from "solid-styled-components";

import useStore from "@/chat-api/store/useStore";

import { t } from "@nerimity/i18lite";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Icon from "@/components/ui/icon/Icon";
import Button from "@/components/ui/Button";
import {
  createAppBotUser,
  deleteApp,
  getApplication,
  refreshAppClientSecret,
  updateApp,
} from "@/chat-api/services/ApplicationService";
import { RawApplication } from "@/chat-api/RawData";
import { useMatch, useNavigate, useParams } from "solid-navigator";
import Input from "@/components/ui/input/Input";
import { createUpdatedSignal } from "@/common/createUpdatedSignal";
import DeleteConfirmModal from "@/components/ui/delete-confirm-modal/DeleteConfirmModal";
import { toast, useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import Text from "@/components/ui/Text";
import {
  addBit,
  APPLICATION_SCOPES,
  Bitwise,
  hasBit,
  removeBit,
} from "@/chat-api/Bitwise";
import env from "@/common/env";
import { FlexRow } from "@/components/ui/Flexbox";
import { CustomLink } from "@/components/ui/CustomLink";
import Checkbox from "@/components/ui/Checkbox";
import DropDown from "@/components/ui/drop-down/DropDown";
import { useExperiment } from "@/common/experiments";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

export default function DeveloperApplicationSetting() {
  const { header } = useStore();
  const params = useParams<{ id: string }>();

  const route = useMatch(
    () => "/app/settings/developer/applications/:id/:tab?"
  );

  createEffect(() => {
    header.updateHeader({
      title: t("settings.drawer.title") + " - " + t("settings.drawer.developer"),
      iconName: "settings",
    });
  });

  const [application, setApplication] = createSignal<RawApplication | null>(
    null
  );

  onMount(async () => {
    const app = await getApplication(params.id);
    setApplication(app);
  });

  const tab = () => route()?.params.tab;

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title={t("dashboard.title")} />
        <BreadcrumbItem
          href="/app/settings/developer"
          title={t("settings.drawer.developer")}
        />
        <BreadcrumbItem
          href="/app/settings/developer/applications"
          title={t("settings.drawer.applications")}
        />
        <BreadcrumbItem
          href={`/app/settings/developer/applications/${params.id}`}
          title={application() ? application()!.name : "loading..."}
        />
        <Show when={tab() === "oauth2"}>
          <BreadcrumbItem title="OAuth2" />
        </Show>
      </Breadcrumb>

      <Show when={application()}>
        <Show when={!tab()}>
          <EditDeveloperApplication
            application={application()!}
            setApplication={setApplication}
          />
        </Show>
        <Show when={tab() === "oauth2"}>
          <EditApplicationOauth2
            application={application()!}
            setApplication={setApplication}
          />
        </Show>
      </Show>
    </Container>
  );
}

const EditDeveloperApplication = (props: {
  application: RawApplication;
  setApplication: (app: RawApplication) => void;
}) => {
  const application = () => props.application;

  // const { experiment } = useExperiment(() => "DEVELOPER_OAUTH2_SETTINGS");

  const params = useParams<{ id: string }>();
  const [requestSent, setRequestSent] = createSignal(false);

  const defaultInput = () => ({
    name: application()?.name || "",
  });

  const [inputValues, updatedInputValues, setInputValue] =
    createUpdatedSignal(defaultInput);

  const navigate = useNavigate();
  const [error, setError] = createSignal<string | null>(null);

  const requestStatus = () => (requestSent() ? t("general.saving") : t("general.saveChangesButton"));

  const createBot = async () => {
    await createAppBotUser(params.id);
    navigate("./bot");
  };

  const onSaveClicked = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError(null);

    await updateApp(params.id, updatedInputValues())
      .then((newApp) => {
        props.setApplication({ ...application()!, ...newApp });
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setRequestSent(false));
  };

  return (
    <>
      <SettingsBlock icon="edit" label={t("settings.developer.name")}>
        <Input
          value={inputValues().name}
          onText={(v) => setInputValue("name", v)}
        />
      </SettingsBlock>
      <SettingsBlock icon="id_card" label={t("settings.developer.appClientId")}>
        <Input value={application()!.id} disabled />
      </SettingsBlock>

      <SettingsBlock
        href={application()?.botUserId ? "./bot" : undefined}
        icon="smart_toy"
        label={t("settings.developer.botUser")}
        description={
          application()?.botUserId ? t("settings.developer.editBotUser") : t("settings.developer.createBotUser")
        }
      >
        <Show when={!application()?.botUserId}>
          <Button label={t("settings.developer.createBotUserButton")} iconName="add" onClick={createBot} />
        </Show>
        <Show when={application()?.botUserId}>
          <Icon name="keyboard_arrow_right" />
        </Show>
      </SettingsBlock>

      {/* <Show when={experiment()}> */}
      <SettingsBlock
        href="./oauth2"
        icon="lock"
        label="OAuth2"
        description={t("settings.developer.oauth2.description")}
      />
      {/* </Show> */}

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
          onClick={onSaveClicked}
        />
      </Show>

      <DeleteApplicationBlock id={params.id} name={application()!.name} />
    </>
  );
};

const EditApplicationOauth2 = (props: {
  application: RawApplication;
  setApplication: (app: RawApplication) => void;
}) => {
  const [requestSent, setRequestSent] = createSignal(false);

  let refreshClicked = false;
  const onRefreshClick = async () => {
    if (refreshClicked) return;
    refreshAppClientSecret(props.application.id)
      .then((res) => {
        props.setApplication(res);
        toast(t("settings.developer.oauth2.secretRefreshed"));
      })
      .catch((err) => toast(err.message))
      .finally(() => (refreshClicked = false));
  };

  const copyToken = async () => {
    navigator.clipboard.writeText(props.application.clientSecret!);
    toast(t("settings.developer.oauth2.secretCopied"));
  };

  const defaultInput = () => ({
    redirectUris: [...props.application.redirectUris, ""],
  });

  const [inputValues, updatedInputValues, setInputValue] =
    createUpdatedSignal(defaultInput);

  const urisLength = () => inputValues().redirectUris.length;

  const requestStatus = () => (requestSent() ? t("general.saving") : t("general.saveChangesButton"));

  const onSaveClicked = async () => {
    if (requestSent()) return;
    setRequestSent(true);

    const redirectUris = inputValues().redirectUris.filter((uri) => !!uri);

    await updateApp(props.application.id, {
      ...updatedInputValues(),
      redirectUris,
    })
      .then((newApp) => {
        props.setApplication({ ...props.application, ...newApp });
      })
      .catch((err) => toast(err.message))
      .finally(() => setRequestSent(false));
  };

  return (
    <>
      <SettingsBlock
        icon="menu_book"
        href="https://docs.nerimity.com/endpoints/oauth2/ExchangeCode"
        label={t("settings.developer.oauth2.documentation")}
        hrefBlank
      />
      <SettingsBlock icon="id_card" label={t("settings.developer.oauth2.clientId")}>
        <Input value={props.application.id} disabled />
      </SettingsBlock>

      <SettingsBlock
        icon="key"
        label={t("settings.developer.oauth2.clientSecret")}
        class={css`
          margin-bottom: 20px;
        `}
      >
        <Button onClick={onRefreshClick} label={t("settings.developer.oauth2.refreshButton")} iconName="refresh" />
        <Button onClick={copyToken} label={t("inputFieldActions.copy")} iconName="content_copy" />
      </SettingsBlock>

      <div>
        <SettingsBlock icon="link" label={t("settings.developer.oauth2.redirectUris")} header />
        <For each={new Array(urisLength()).fill(0)}>
          {(_, i) => (
            <SettingsBlock
              icon="link"
              label={t("settings.developer.oauth2.uri", { count: (i() + 1) })}
              borderTopRadius={false}
              borderBottomRadius={i() === urisLength() - 1}
            >
              <Input
                value={inputValues().redirectUris[i()]}
                class={css`
                  flex: 1;
                `}
                placeholder="https://example.com/redirect"
                onText={(v) => {
                  const newUris = [...inputValues().redirectUris];
                  newUris[i()] = v;
                  if (newUris[newUris.length - 1]) newUris.push("");
                  if (!newUris[newUris.length - 2]) newUris.pop();
                  setInputValue("redirectUris", newUris);
                }}
              />
            </SettingsBlock>
          )}
        </For>
      </div>

      <Show when={Object.keys(updatedInputValues()).length}>
        <Button
          iconName="save"
          label={requestStatus()}
          class={css`
            align-self: flex-end;
          `}
          onClick={onSaveClicked}
        />
      </Show>

      <GenerateOuth2Link application={props.application} />
    </>
  );
};

const GenerateOuth2Link = (props: { application: RawApplication }) => {
  const [permissions, setPermissions] = createSignal(
    APPLICATION_SCOPES.USER_INFO.bit
  );
  const [redirectUri, setRedirectUri] = createSignal(
    props.application.redirectUris[0] || ""
  );

  const permissionsList = Object.values(APPLICATION_SCOPES) as Bitwise[];

  const link = () => {
    const enabledScopes = [];

    for (const permission of Object.entries(APPLICATION_SCOPES)) {
      if (hasBit(permissions(), permission[1].bit)) {
        enabledScopes.push(permission[0]);
      }
    }

    const url = new URL(`${env.APP_URL}/authorize`);

    url.searchParams.set("clientId", props.application.id);
    if (enabledScopes.length)
      url.searchParams.set("scopes", enabledScopes.join(" "));

    if (redirectUri()) url.searchParams.set("redirectUri", redirectUri());

    return url.href;
  };
  const onPermissionChanged = (checked: boolean, bit: number) => {
    if (checked) {
      setPermissions(addBit(permissions(), bit));
    } else {
      setPermissions(removeBit(permissions(), bit));
    }
  };
  return (
    <div>
      <SettingsBlock
        icon="security"
        label={t("settings.developer.oauth2.generateLink")}
        header={true}
        class={css`
          gap: 8px;
        `}
      >
        <FlexRow
          itemsCenter
          gap={4}
          style={{
            background: "rgba(0,0,0,0.4)",
            "padding-left": "8px",
            "line-break": "normal",
            "text-wrap": "nowrap",
            "border-radius": "8px",
          }}
        >
          <CustomLink
            style={{
              "font-size": "12px",
              overflow: "auto",
              "scrollbar-width": "none",
              "max-width": "500px",
            }}
            target="_blank"
            rel="noopener noreferrer"
            decoration
            href={link()}
          >
            {link()}
          </CustomLink>
          <Button
            iconName="content_copy"
            iconSize={18}
            onClick={() => navigator.clipboard.writeText(link())}
          />
        </FlexRow>
      </SettingsBlock>
      <SettingsBlock
        borderTopRadius={false}
        borderBottomRadius={false}
        icon="link"
        label={t("settings.developer.oauth2.redirectUri")}
      >
        <DropDown
          items={props.application.redirectUris.map((uri) => ({
            label: uri,
            id: uri,
          }))}
          selectedId={redirectUri()}
          onChange={(item) => setRedirectUri(item.id)}
        />
      </SettingsBlock>
      <For each={permissionsList}>
        {(permission, i) => (
          <SettingsBlock
            borderTopRadius={false}
            borderBottomRadius={i() === permissionsList.length - 1}
            icon={permission.icon}
            label={permission.name()}
            description={permission.description?.()}
          >
            <Checkbox
              checked={hasBit(permissions(), permission.bit)}
              onChange={(checked) =>
                onPermissionChanged(checked, permission.bit)
              }
            />
          </SettingsBlock>
        )}
      </For>
    </div>
  );
};

const deleteBlockStyles = css`
  margin-top: 50px;
  border: solid 1px var(--alert-color);
`;

function DeleteApplicationBlock(props: { id: string; name: string }) {
  const { createPortal } = useCustomPortal();
  const navigate = useNavigate();

  const onDeleteClick = async () => {
    let err = "";
    await deleteApp(props.id).catch((error) => {
      err = error.message;
    });

    if (!err) {
      navigate("../");
    }
    return err;
  };

  const onClick = () => {
    const ModalInfo = () => {
      return (
        <div style={{ "margin-bottom": "15px" }}>
          {t("settings.account.deletedInfo.title")}
          <div>{t("settings.account.deletedInfo.email")}</div>
          <div>{t("settings.account.deletedInfo.username")}</div>
          <div>{t("settings.account.deletedInfo.ip")}</div>
          <div>{t("settings.account.deletedInfo.bio")}</div>
          <div>{t("settings.developer.deleteApplication.andMore")}</div>
          <div style={{ "margin-top": "15px" }}>{t("settings.developer.deleteApplication.willNotGetDeleted")}</div>
          <div>{t("settings.account.deletedInfo.messages")}</div>
          <div>{t("settings.account.deletedInfo.posts")}</div>
          <div style={{ "margin-top": "5px", "font-size": "12px" }}>
            {t("settings.developer.deleteApplication.willNotGetDeletedDescription")}
          </div>
        </div>
      );
    };

    createPortal((close) => (
      <DeleteConfirmModal
        onDeleteClick={onDeleteClick}
        custom={<ModalInfo />}
        close={close}
        confirmText={props.name}
        title={t("settings.developer.deleteApplication.title")}
      />
    ));
  };

  return (
    <SettingsBlock
      class={deleteBlockStyles}
      icon="delete"
      label={t("settings.developer.deleteApplication.title")}
      description={t("general.cannotBeUndone")}
    >
      <Button
        onClick={onClick}
        iconSize={18}
        primary
        color="var(--alert-color)"
        iconName="delete"
        label={t("settings.developer.deleteApplication.deleteAppButton")}
      />
    </SettingsBlock>
  );
}
