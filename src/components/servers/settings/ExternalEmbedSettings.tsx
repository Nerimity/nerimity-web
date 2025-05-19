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
  deleteServerExternalEmbed,
  getInvites,
  getServerExternalEmbed,
} from "@/chat-api/services/ServerService";
import DropDown, { DropDownItem } from "@/components/ui/drop-down/DropDown";
import { Notice } from "@/components/ui/Notice/Notice";
import Checkbox from "@/components/ui/Checkbox";
import CodeBlock from "@/components/markup/CodeBlock";
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
  const [embed, setEmbed] = createSignal<null | undefined | { id: string }>(
    null
  );

  const HEIGHT = {
    hide_header: 48,
    hide_members: 330,
    hide_activities: 54,
    other: 48,
  };

  const [opts, setOpts] = createSignal({
    hide_header: false,
    hide_members: false,
    hide_activities: false,
  });

  const [invites, setInvites] = createSignal<{ code: string }[] | null>(null);

  const totalEmbedHeight = () => {
    const enabledOptions = Object.entries(opts())
      .filter(([key, value]) => !value)
      .map(([key]) => HEIGHT[key]);

    const gap = enabledOptions.length * 4;

    const offset = 4 * 2;

    console.log(enabledOptions.reduce((acc, height) => acc + height, 0));

    return (
      enabledOptions.reduce((acc, height) => acc + height, 0) +
      HEIGHT.other +
      offset +
      gap
    );
  };

  const embedLink = () => {
    const url = "https://nerimity.com/external-embed/server/";
    const enabledOptions = Object.entries(opts()).reduce(
      (acc, [key, value]) => {
        if (value) acc[key] = value;
        return acc;
      },
      {} as Record<string, boolean>
    );
    const search = new URLSearchParams({
      id: params.serverId!,
      ...enabledOptions,
    }).toString();
    return url + "?" + search;
  };

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
    getServerExternalEmbed(params.serverId!)
      .then(setEmbed)
      .catch(() => setEmbed(undefined));
  });

  const onInviteSelected = (event: DropDownItem) => {
    const inviteId = event.id;
    createServerExternalEmbed(params.serverId!, inviteId).then((res) => {
      setEmbed(res);
    });
  };

  const deleteEmbed = () => {
    deleteServerExternalEmbed(params.serverId).then(() => {
      setEmbed(undefined);
    });
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
              <Show when={embed() === undefined}>
                <DropDown
                  placeholder="Select Invite"
                  onChange={onInviteSelected}
                  items={invites()!.map((invite) => ({
                    id: invite.code,
                    label: invite.code,
                  }))}
                />
              </Show>
              <Show when={embed()}>
                <Button
                  onClick={deleteEmbed}
                  label="Delete Embed"
                  alert
                  primary
                  iconName="delete"
                />
              </Show>
            </FlexRow>
          </SettingsBlock>
        </ListContainer>
      </Show>

      <Show when={embed()}>
        <div
          class="markup"
          style={{ "margin-bottom": "10px", "margin-top": "6px" }}
        >
          <CodeBlock
            lang="html"
            value={`<iframe src="${embedLink()}" height="${totalEmbedHeight()}px" style="border:none;border-radius:6px;" />`}
          />
        </div>

        <FlexRow wrap>
          <FlexColumn gap={8} style={{ flex: 1, "min-width": "300px" }}>
            <Checkbox
              label="Hide Header"
              checked={opts().hide_header}
              onChange={(val) => setOpts({ ...opts(), hide_header: val })}
            />
            <Checkbox
              label="Hide Members List"
              checked={opts().hide_members}
              onChange={(val) => setOpts({ ...opts(), hide_members: val })}
            />
            <Checkbox
              label="Hide Activity List"
              checked={opts().hide_activities}
              onChange={(val) => setOpts({ ...opts(), hide_activities: val })}
            />
          </FlexColumn>
          <iframe
            src={embedLink()}
            height={`${totalEmbedHeight()}px`}
            style={{ border: "none", "border-radius": "6px" }}
          />
        </FlexRow>
      </Show>
    </Container>
  );
}
