import useStore from "@/chat-api/store/useStore";
import RouterEndpoints from "@/common/RouterEndpoints";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import { useNavigate, useParams } from "solid-navigator";
import { t } from "i18next";
import { createEffect, createSignal, onMount, Show } from "solid-js";
import { styled } from "solid-styled-components";
import Button from "@/components/ui/Button";
import {
  createServerExternalEmbed,
  getInvites,
} from "@/chat-api/services/ServerService";
import DropDown, {
  DropDownItem,
  DropDownProps,
} from "@/components/ui/drop-down/DropDown";
import { Notice } from "@/components/ui/Notice/Notice";
const Container = styled("div")`
  display: flex;
  flex-direction: column;
  padding: 10px;
`;

const ListContainer = styled(FlexColumn)`
  margin-top: 10px;
`;

export default function ExternalEmbedSettings() {
  const params = useParams<{ serverId: string }>();
  const { servers, header } = useStore();
  const navigate = useNavigate();

  const [invites, setInvites] = createSignal<{ code: string }[] | null>(null);

  createEffect(() => {
    header.updateHeader({
      title: "Settings - External Embed",
      serverId: params.serverId!,
      iconName: "settings",
    });
  });
  const server = () => servers.get(params.serverId);

  onMount(() => {
    getInvites(params.serverId!).then(setInvites);
  });

  const onInviteSelected = (event: DropDownItem) => {
    const inviteId = event.id;
    createServerExternalEmbed(params.serverId!, inviteId).then(() => {});
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
        <BreadcrumbItem title={t("servers.settings.drawer.external-embed")} />
      </Breadcrumb>
      <Show when={invites() && !invites()?.length}>
        <Notice
          type="error"
          title="No Invites Created"
          description="You must create an invite before you can create an external embed link."
          children={
            <Button
              label="Create Invite"
              styles={{ "margin-left": "auto" }}
              margin={0}
              primary
              onclick={() =>
                navigate(
                  RouterEndpoints.SERVER_SETTINGS_INVITES(params.serverId!)
                )
              }
            />
          }
        />
      </Show>
      <Show when={invites()?.length}>
        <ListContainer>
          <SettingsBlock
            icon="link"
            label="Create External Embed Link"
            description="Create an external iframe embed for your website."
          >
            <FlexRow>
              <DropDown
                placeholder="Select Invite"
                onChange={onInviteSelected}
                items={invites()!.map((invite) => ({
                  id: invite.code,
                  label: invite.code,
                }))}
              />
            </FlexRow>
          </SettingsBlock>
        </ListContainer>
      </Show>
    </Container>
  );
}
