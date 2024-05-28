
import useStore from "@/chat-api/store/useStore";
import RouterEndpoints from "@/common/RouterEndpoints";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import { Notice } from "@/components/ui/Notice/Notice";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Text from "@/components/ui/Text";
import { useParams } from "solid-navigator";
import { t } from "i18next";
import { createEffect, Match, onMount, Show, Switch } from "solid-js";
import { styled } from "solid-styled-components";
import Button from "@/components/ui/Button";
import { CreateTicketModal } from "@/components/profile-pane/ProfilePane";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  padding: 10px;
`;

const ListContainer = styled(FlexColumn)`
  margin-top: 10px;
`;

export default function ServerSettingsBans() {
  const params = useParams<{ serverId: string }>();
  const { servers, serverMembers, header } = useStore();
  const { createPortal } = useCustomPortal();

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Verify",
      serverId: params.serverId!,
      iconName: "settings"
    });
  });
  const TARGET_MEMBERS = 20;
  const server = () => servers.get(params.serverId);
  const isVerified = () => server()?.verified;
  const memberCount = () => serverMembers.array(params.serverId).length;

  const membersNeeded = () => TARGET_MEMBERS - memberCount();

  const verifyClick = () => {
    return createPortal((close) => (
      <CreateTicketModal
        close={close}
        ticket={{ id: "SERVER_VERIFICATION" }}
      />
    ));
  };

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href={RouterEndpoints.SERVER_MESSAGES(params.serverId, server()?.defaultChannelId!)} icon='home' title={server()?.name} />
        <BreadcrumbItem title={t("servers.settings.drawer.verify")} />
      </Breadcrumb>
      {/* Notices depending on how many members the server has and if it's verified.  */}
      <Switch>
        <Match when={isVerified()}>
          <Notice type="info" description="Your server is already verified." />
        </Match>
        <Match when={membersNeeded() > 0}>
          <Notice type="warn" description={`You need ${membersNeeded()} more member(s) to apply for a verification.`} />
        </Match>
        <Match when={membersNeeded() <= 0}>
          <Notice type="success" description={"You have enough members to verify your server!"} children={<Button onClick={verifyClick} label="Verify" styles={{"margin-left": "auto"}} margin={0} color="var(--success-color)" />} />
        </Match>
      </Switch>
      <ListContainer>
        <Text size={24} style={{ "margin-bottom": "10px" }}>Requirements</Text>
        <SettingsBlock icon="people" label="10 or more members" description={`Your server must have at least ${TARGET_MEMBERS} members.`} />
        <SettingsBlock icon="cleaning_services" label="Profanity free" description="Server name, avatar and banner should be profanity free." />
        <SettingsBlock icon="landscape" label="Server rules" description="Server should have an avatar and a banner." />
        <SettingsBlock icon="gavel" label="Server rules" description="Server should have a rules channel." />
      </ListContainer>
      <ListContainer>
        <Text size={24} style={{ "margin-bottom": "10px" }}>Perks</Text>
        <SettingsBlock icon="verified" label="Verified badge" description="A badge to show that your server is special." />
        <SettingsBlock icon="explore" label="Explore" description="Your server can be displayed in the explore page." />
        <SettingsBlock icon="link" label="Custom invite link" description="Create your own invite link from the invites page." />
        <SettingsBlock icon="face" label="More emoji slots" description="Add 50 more emoji slots to your server." />
      </ListContainer>
    </Container>
  );
}
