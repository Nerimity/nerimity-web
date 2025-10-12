import { Show, createEffect, createSignal, onMount } from "solid-js";
import { styled } from "solid-styled-components";
import useStore from "@/chat-api/store/useStore";
import { t } from "@nerimity/i18lite";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import { getApplication } from "@/chat-api/services/ApplicationService";
import { RawApplication } from "@/chat-api/RawData";
import { useParams } from "solid-navigator";
import { ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { ApplicationBotCreateLinkBlock } from "./ApplicationBotCreateLinkBlock";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

export default function DeveloperApplicationBotCreateLinkSettings() {
  const { header } = useStore();
  const params = useParams<{ id: string }>();

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Developer Application Bot Create Link",
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
          href="../../"
          title={application() ? application()!.name : "loading..."}
        />
        <BreadcrumbItem href="../" title="Bot" />
        <BreadcrumbItem title="Create Link" />
      </Breadcrumb>
      <Show when={application()}>
        <ApplicationBotCreateLinkBlock appId={params.id} />
      </Show>
    </Container>
  );
}
