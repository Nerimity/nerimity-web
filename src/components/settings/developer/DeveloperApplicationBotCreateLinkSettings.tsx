import { For, Show, createEffect, createSignal, onMount } from "solid-js";
import { css, styled } from "solid-styled-components";

import useStore from "@/chat-api/store/useStore";

import { t } from "i18next";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Icon from "@/components/ui/icon/Icon";
import Button from "@/components/ui/Button";
import { createAppBotUser, createApplication, getApplication, getApplications, updateAppBotUser } from "@/chat-api/services/ApplicationService";
import { RawApplication } from "@/chat-api/RawData";
import { createStore, reconcile } from "solid-js/store";
import { useLocation, useNavigate, useParams } from "solid-navigator";
import Input from "@/components/ui/input/Input";
import { createUpdatedSignal } from "@/common/createUpdatedSignal";
import { CustomLink } from "@/components/ui/CustomLink";
import Text from "@/components/ui/Text";
import { Bitwise, ROLE_PERMISSIONS, addBit, hasBit, removeBit } from "@/chat-api/Bitwise";
import Checkbox from "@/components/ui/Checkbox";
import env from "@/common/env";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;


export default function DeveloperApplicationBotCreateLinkSettings() {
  const { header } = useStore();
  const params = useParams<{id: string}>();

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Developer Application Bot Create Link",
      iconName: "settings"
    });
  });

  const [application, setApplication] = createSignal<RawApplication | null>(null);

  onMount(async () => {
    const app = await getApplication(params.id);
    setApplication(app);
  });

  const [permissions, setPermissions] = createSignal(ROLE_PERMISSIONS.SEND_MESSAGE.bit);


  const onPermissionChanged = (checked: boolean, bit: number) => {
    if (checked) {
      setPermissions(addBit(permissions(), bit));
    }
    else {
      setPermissions(removeBit(permissions(), bit));
    }
  };

  const permissionsList = Object.values(ROLE_PERMISSIONS) as Bitwise[];

  const link = () => {
    return `${env.APP_URL}/bot/${params.id}?perms=${permissions()}`;
  };

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href='/app' icon='home' title="Dashboard" />
        <BreadcrumbItem href="/app/settings/developer" title={t("settings.drawer.developer")} />
        <BreadcrumbItem href="/app/settings/developer/applications" title={t("settings.drawer.applications")} />
        <BreadcrumbItem href="../../" title={application() ? application()!.name : "loading..."} />
        <BreadcrumbItem href="../" title="Bot" />
        <BreadcrumbItem title="Create Link" />
      </Breadcrumb>  
      <Show when={application()}>

        <div>
          <div>Link: <CustomLink decoration href={link()}>{link()}</CustomLink></div>
        </div>



        <div>
          <SettingsBlock icon="security" label={t("servers.settings.role.permissions")} description="Modify permissions for this link." header={true} />
          <For each={permissionsList}>
            {(permission, i) => (
              <SettingsBlock borderTopRadius={false} borderBottomRadius={i() === permissionsList.length - 1} icon={permission.icon} label={t(permission.name)} description={t(permission.description)}>
                <Checkbox checked={hasBit(permissions(), permission.bit)} onChange={checked => onPermissionChanged(checked, permission.bit)} />
              </SettingsBlock>
            )}

          </For>
        </div>




      </Show>

    </Container>
  );
}

