import { For, Show, createEffect, createSignal, onMount } from "solid-js";
import { styled } from "solid-styled-components";

import useStore from "@/chat-api/store/useStore";

import { t } from "i18next";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Icon from "@/components/ui/icon/Icon";
import Button from "@/components/ui/Button";
import { createApplication, getApplication, getApplications } from "@/chat-api/services/ApplicationService";
import { RawApplication } from "@/chat-api/RawData";
import { createStore, reconcile } from "solid-js/store";
import { useNavigate, useParams } from "solid-navigator";
import Input from "@/components/ui/input/Input";
import { createUpdatedSignal } from "@/common/createUpdatedSignal";
import { CustomLink } from "@/components/ui/CustomLink";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;


export default function DeveloperApplicationsSetting() {
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


  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href='/app' icon='home' title="Dashboard" />
        <BreadcrumbItem href="/app/settings/developer" title={t("settings.drawer.developer")} />
        <BreadcrumbItem href="/app/settings/developer/applications" title={t("settings.drawer.applications")} />
        <BreadcrumbItem href="/app/settings/developer/applications" title={application() ? application()!.name : "loading..."} />
      </Breadcrumb>


  
      <SettingsBlock icon='edit' label='Name'>
        <Input value={inputValues().name} onText={(v) => setInputValue("name", v)}/>
      </SettingsBlock>

      <SettingsBlock icon='smart_toy' label='Bot User' description="Create or edit a bot user.">
        <CustomLink href="./bot">
          <Button 
            label={application()?.botUserId ? "Edit" :  "Create"} 
            iconName={application()?.botUserId ? "edit" : "add"} 
          />
        </CustomLink>
      </SettingsBlock>
  

      <Show when={Object.keys(updatedInputValues()).length}>
        <Button label="Save" iconName="save"/>
      </Show>


    </Container>
  );
}

