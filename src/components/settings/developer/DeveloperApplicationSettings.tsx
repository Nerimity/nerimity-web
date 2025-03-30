import { For, Show, createEffect, createSignal, onMount } from "solid-js";
import { css, styled } from "solid-styled-components";

import useStore from "@/chat-api/store/useStore";

import { t } from "i18next";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Icon from "@/components/ui/icon/Icon";
import Button from "@/components/ui/Button";
import { createAppBotUser, createApplication, deleteApp, getApplication, getApplications, updateApp } from "@/chat-api/services/ApplicationService";
import { RawApplication } from "@/chat-api/RawData";
import { createStore, reconcile } from "solid-js/store";
import { useNavigate, useParams } from "solid-navigator";
import Input from "@/components/ui/input/Input";
import { createUpdatedSignal } from "@/common/createUpdatedSignal";
import { CustomLink } from "@/components/ui/CustomLink";
import DeleteConfirmModal from "@/components/ui/delete-confirm-modal/DeleteConfirmModal";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import Text from "@/components/ui/Text";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;


export default function DeveloperApplicationSetting() {
  const { header } = useStore();
  const params = useParams<{id: string}>();
  const navigate = useNavigate();
  const [error, setError] = createSignal<string | null>(null);
  const [requestSent, setRequestSent] = createSignal(false);

  createEffect(() => {
    header.updateHeader({
      title: t("settings.drawer.title") + " - " + t("settings.drawer.developer") + " - " + t("settings.developer.application"),
      iconName: "settings"
    });
  });

  const [application, setApplication] = createSignal<RawApplication | null>(null);

  onMount(async () => {
    const app = await getApplication(params.id);
    setApplication(app);
  });


  const defaultInput = () => ({
    name: application()?.name || ""

  });

  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput);
  const requestStatus = () => requestSent() ? t("settings.account.saving") : t("settings.account.saveChangesButton");

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
        setApplication({...application()!, ...newApp});
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setRequestSent(false));
  };


  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href='/app' icon='home' title={t("dashboard.title")} />
        <BreadcrumbItem href="/app/settings/developer" title={t("settings.drawer.developer")} />
        <BreadcrumbItem href="/app/settings/developer/applications" title={t("settings.drawer.applications")} />
        <BreadcrumbItem title={application() ? application()!.name : "loading..."} />
      </Breadcrumb>


  
      <Show when={application()}>
        <SettingsBlock icon='edit' label={t("settings.developer.botName")}>
          <Input value={inputValues().name} onText={(v) => setInputValue("name", v)}/>
        </SettingsBlock>

        <SettingsBlock 
          href={application()?.botUserId ? "./bot" : undefined} 
          icon='smart_toy' 
          label={t("profile.badges.bot")}
          description={application()?.botUserId ? t("settings.developer.editBotButton") : t("settings.developer.createNew")}>
          <Show when={!application()?.botUserId}>
            <Button label={t("settings.developer.createButton")} iconName= "add" onClick={createBot} />
          </Show>
          <Show when={application()?.botUserId}>
            <Icon name="keyboard_arrow_right" />
          </Show>
        </SettingsBlock>
  

        <Show when={error()}><Text size={12} color="var(--alert-color)" style={{ "margin-top": "5px" }}>{error()}</Text></Show>
        <Show when={Object.keys(updatedInputValues()).length}>
          <Button iconName='save' label={requestStatus()} class={css`align-self: flex-end;`} onClick={onSaveClicked} />
        </Show>

        <DeleteApplicationBlock id={params.id} name={application()!.name} />

      </Show>

    </Container>
  );
}

const deleteBlockStyles = css`
  margin-top: 50px;
  border: solid 1px var(--alert-color);
`;


function DeleteApplicationBlock(props: {id: string, name: string}) {
  const {createPortal} = useCustomPortal();
  const navigate = useNavigate();


  const onDeleteClick = async () => {
    let err = "";
    await deleteApp(props.id).catch(error => {
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
        <div style={{"margin-bottom": "15px"}}>
          {t("settings.developer.deleteApp.willBeDeleted")}
          <div >{t("settings.developer.deleteApp.email")}</div>
          <div>{t("settings.developer.deleteApp.username")}</div>
          <div>{t("settings.developer.deleteApp.ipAddress")}</div>
          <div>{t("settings.developer.deleteApp.bio")}</div>
          <div >{t("settings.developer.deleteApp.more")}</div>
          <div style={{"margin-top": "15px"}}>{t("settings.developer.deleteApp.willNotBeDeleted")}</div>
          <div>{t("settings.developer.deleteApp.messages")}</div>
          <div>{t("settings.developer.deleteApp.posts")}</div>
          <div style={{"margin-top": "5px", "font-size": "12px"}}>{t("settings.developer.deleteApp.notDeletedNotice")}</div>
        </div>
      );
    };

    createPortal(close => <DeleteConfirmModal onDeleteClick={onDeleteClick} custom={<ModalInfo/>} close={close} confirmText={props.name} title={t("settings.developer.deleteApp.title")} />);
  };
  
  return (
    <SettingsBlock class={deleteBlockStyles} icon='delete' label={t("settings.developer.deleteApp.title")} description={t("settings.developer.deleteApp.description")}>
      <Button onClick={onClick} iconSize={18} primary color='var(--alert-color)' iconName='delete' label={t("settings.developer.deleteApp.confirm")} />
    </SettingsBlock>
  );
}