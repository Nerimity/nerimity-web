import { createEffect, createSignal } from "solid-js";
import { styled } from "solid-styled-components";

import useStore from "@/chat-api/store/useStore";

import { t } from "@nerimity/i18lite";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Icon from "@/components/ui/icon/Icon";
import Checkbox from "@/components/ui/Checkbox";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

export default function DeveloperSettings() {
  const { header } = useStore();

  const getInitialCookieValue = () => {
    const match = document.cookie.split('; ').find(row => row.startsWith('useLatestURL='));
    return match ? match.split('=')[1] === 'true' : false;
  };

  const [useLatest, setUseLatest] = createSignal(getInitialCookieValue());

  const handleToggleCookie = (checked: boolean) => {
    setUseLatest(checked);
    const domain = window.location.hostname.includes("nerimity.com") ? "domain=.nerimity.com;" : "";
    document.cookie = `useLatestURL=${checked}; path=/; max-age=315360000; ${domain}`;
  };

  createEffect(() => {
    header.updateHeader({
      title: t("settings.drawer.title") + " - " + t("settings.drawer.developer"),
      iconName: "settings",
    });
  });

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title={t("dashboard.title")} />
        <BreadcrumbItem title={t("settings.drawer.developer")} />
      </Breadcrumb>

      <SettingsBlock
        icon="update"
        label={t("settings.developer.useLatestUrl")}
        description={<>{t("settings.developer.useLatestUrlDescription")} <span style={{ "font-weight": "800" }}>{t("settings.developer.useLatestUrlWarning")}</span></>}
        children={
          <Checkbox checked={useLatest()} onChange={handleToggleCookie} />
        }
      />

      <SettingsBlock
        href="./applications"
        icon="extension"
        label={t("settings.drawer.applications")}
        description={t("settings.developer.applicationsDescription")}
        children={<Icon name="keyboard_arrow_right" />}
      />
      <SettingsBlock
        href="https://docs.nerimity.com"
        hrefBlank
        icon="menu_book"
        label={t("settings.developer.apiDocumentation")}
        children={<Icon name="open_in_new" style={{ "margin-right": "6px" }} />}
      />
    </Container>
  );
}
