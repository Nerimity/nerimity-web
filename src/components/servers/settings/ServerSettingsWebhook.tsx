import useStore from "@/chat-api/store/useStore";
import RouterEndpoints from "@/common/RouterEndpoints";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import { useParams } from "solid-navigator";
import { t } from "i18next";
import { createEffect } from "solid-js";
import { styled } from "solid-styled-components";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Input from "@/components/ui/input/Input";
import Button from "@/components/ui/Button";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  padding: 10px;
`;

export default function ServerSettingsWebhook() {
  const params = useParams<{ serverId: string; channelId?: string }>();
  const { servers, channels, header } = useStore();

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Webhook",
      serverId: params.serverId!,
      iconName: "settings",
    });
  });

  const server = () => {
    return servers.get(params.serverId!);
  };

  const channel = () => {
    return channels.get(params.channelId!);
  };

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem
          href={RouterEndpoints.SERVER_MESSAGES(
            params.serverId,
            server()?.defaultChannelId!
          )}
          icon="home"
          title={server()?.name}
        />
        <BreadcrumbItem title={channel()?.name} href="../" />
        <BreadcrumbItem title={"Webhook"} />
      </Breadcrumb>

      <SettingsBlock label="Name" icon="label">
        <Input placeholder="Name" />
      </SettingsBlock>
      <SettingsBlock
        label="Webhook Link"
        description="Execute actions using this link"
        icon="link"
      >
        <Button label="Copy Link" iconName="content_copy" />
      </SettingsBlock>
      <SettingsBlock
        label="Delete Webhook"
        icon="delete"
        description="This action cannot be undone."
      >
        <Button label="Delete" primary alert iconName="delete" />
      </SettingsBlock>
    </Container>
  );
}
