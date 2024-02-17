import { For, Show, createEffect, createSignal, onMount } from "solid-js";
import { css, styled } from "solid-styled-components";

import useStore from "@/chat-api/store/useStore";

import { t } from "i18next";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Icon from "@/components/ui/icon/Icon";
import Button from "@/components/ui/Button";
import { createAppBotUser, createApplication, deleteApp, getApplication, getApplications } from "@/chat-api/services/ApplicationService";
import { RawApplication } from "@/chat-api/RawData";
import { createStore, reconcile } from "solid-js/store";
import { useNavigate, useParams } from "solid-navigator";
import Input from "@/components/ui/input/Input";
import { createUpdatedSignal } from "@/common/createUpdatedSignal";
import { CustomLink } from "@/components/ui/CustomLink";
import DeleteConfirmModal from "@/components/ui/delete-confirm-modal/DeleteConfirmModal";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";

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
  createEffect(() => {
    header.updateHeader({
      title: "Settings - Developer Application",
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

  const createBot = async () => {
    await createAppBotUser(params.id);
    navigate("./bot");
  };


  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href='/app' icon='home' title="Dashboard" />
        <BreadcrumbItem href="/app/settings/developer" title={t("settings.drawer.developer")} />
        <BreadcrumbItem href="/app/settings/developer/applications" title={t("settings.drawer.applications")} />
        <BreadcrumbItem title={application() ? application()!.name : "loading..."} />
      </Breadcrumb>


  
      <Show when={application()}>
        <SettingsBlock icon='edit' label='Name'>
          <Input value={inputValues().name} onText={(v) => setInputValue("name", v)}/>
        </SettingsBlock>

        <SettingsBlock 
          href={application()?.botUserId ? "./bot" : undefined} 
          icon='smart_toy' 
          label='Bot User'
          description={application()?.botUserId ? "Edit bot" : "Create a new bot user."}>
          <Show when={!application()?.botUserId}>
            <Button label="Create" iconName= "add" onClick={createBot} />
          </Show>
          <Show when={application()?.botUserId}>
            <Icon name="keyboard_arrow_right" />
          </Show>
        </SettingsBlock>
  

        <Show when={Object.keys(updatedInputValues()).length}>
          <Button label="Save" iconName="save"/>
        </Show>

        <DeleteApplicationBlock id={params.id} name={application()?.name!} />

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
          What will get deleted:
          <div >• Email</div>
          <div>• Username</div>
          <div>• IP Address</div>
          <div>• Bio</div>
          <div >• And More</div>
          <div style={{"margin-top": "15px"}}>What will not get deleted:</div>
          <div>• Your Messages</div>
          <div>• Your Posts</div>
          <div style={{"margin-top": "5px", "font-size": "12px"}}>You may manually delete them before deleting your app.</div>
        </div>
      );
    };

    createPortal(close => <DeleteConfirmModal onDeleteClick={onDeleteClick} custom={<ModalInfo/>} close={close} confirmText={props.name} title='Delete Application' />);
  };
  
  return (
    <SettingsBlock class={deleteBlockStyles} icon='delete' label='Delete Application' description='This cannot be undone!'>
      <Button onClick={onClick} iconSize={18} primary color='var(--alert-color)' iconName='delete' label='Delete App' />
    </SettingsBlock>
  );
}