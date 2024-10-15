import { For, createEffect, onMount } from "solid-js";
import { styled } from "solid-styled-components";

import useStore from "@/chat-api/store/useStore";

import { t } from "i18next";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Icon from "@/components/ui/icon/Icon";
import Button from "@/components/ui/Button";
import { createApplication, getApplications } from "@/chat-api/services/ApplicationService";
import { RawApplication } from "@/chat-api/RawData";
import { createStore, reconcile } from "solid-js/store";
import { useNavigate } from "solid-navigator";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;


export default function DeveloperApplicationsSettings() {
  const { header } = useStore();
  const navigate = useNavigate();
  createEffect(() => {
    header.updateHeader({
      title: "Settings - Developer Applications",
      iconName: "settings"
    });
  });

  const [applications, setApplications] = createStore<RawApplication[]>([]);

  onMount(async () => {
    const apps = await getApplications();
    setApplications(reconcile(apps));
  });


  const addNewApp = async () => {
    const app = await createApplication().catch(err => {
      alert(err.message); 
    });
    if (!app) return;
    navigate("/app/settings/developer/applications/" + app.id);
  };


  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href='/app' icon='home' title="Dashboard" />
        <BreadcrumbItem href="/app/settings/developer" title={t("settings.drawer.developer")} />
        <BreadcrumbItem title={t("settings.drawer.applications")} />
      </Breadcrumb>


      <div>
        <SettingsBlock icon="extension" label="Applications" header={applications.length !== 0} description={`${applications.length}/10`}>
          <Button iconName="add" label="Add" onClick={addNewApp} />
        </SettingsBlock>

        <For each={applications}>
          {(app, i) => <SettingsBlock 
            icon="extension" 
            href={`./${app.id}`} 
            borderTopRadius={false} 
            borderBottomRadius={i() === applications.length - 1} 
            children={<Icon name="keyboard_arrow_right" />} 
            label={app.name} />}
        </For>
      </div>


    </Container>
  );
}

