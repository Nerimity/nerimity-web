import { createEffect } from "solid-js";
import { styled } from "solid-styled-components";

import useStore from "@/chat-api/store/useStore";

import { t } from "i18next";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Icon from "@/components/ui/icon/Icon";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;


export default function DeveloperSettings() {
  const { header } = useStore();

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Developer",
      iconName: "settings"
    });
  });



  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href='/app' icon='home' title={t("dashboard.title")} />
        <BreadcrumbItem title={t("settings.drawer.developer")} />
      </Breadcrumb>

      <SettingsBlock href="./applications" icon="extension" label="Applications" description="Create Nerimity Bots." children={<Icon name="keyboard_arrow_right" />}  />
      <SettingsBlock href="https://github.com/Nerimity/nerimity-api-docs" hrefBlank icon="article" label="API Documentation (incomplete)" children={<Icon name="launch" style={{"margin-right": "6px"}} />}  />

    </Container>
  );
}

