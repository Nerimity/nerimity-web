import useStore from "@/chat-api/store/useStore";
import RouterEndpoints from "@/common/RouterEndpoints";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import { Notice } from "@/components/ui/Notice/Notice";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Text from "@/components/ui/Text";
import { useParams } from "solid-navigator";
import { t } from "@nerimity/i18lite";
import { createEffect, Match, onMount, Show, Switch } from "solid-js";
import { styled } from "solid-styled-components";
import Button from "@/components/ui/Button";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import { CreateTicketModal } from "@/components/CreateTicketModal";

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
      title: t("settings.drawer.title") + " - " + t("servers.settings.drawer.verify"),
      serverId: params.serverId!,
      iconName: "settings",
    });
  });
  const TARGET_MEMBERS = 30;
  const server = () => servers.get(params.serverId);
  const isVerified = () => server()?.verified;
  const memberCount = () => serverMembers.array(params.serverId).length;

  const membersNeeded = () => TARGET_MEMBERS - memberCount();

  const verifyClick = () => {
    return createPortal((close) => (
      <CreateTicketModal close={close} ticket={{ id: "SERVER_VERIFICATION" }} />
    ));
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
        <BreadcrumbItem title={t("servers.settings.drawer.verify")} />
      </Breadcrumb>
      {/* Notices depending on how many members the server has and if it's verified.  */}
      <Switch>
        <Match when={isVerified()}>
          <Notice type="info" description={t("servers.settings.verify.alreadyVerified")} />
        </Match>
        <Match when={membersNeeded() > 0}>
          <Notice
            type="warn"
            description={t("servers.settings.verify.insufficientMembers", { count: `${membersNeeded()}` })}
            // description={`You need ${membersNeeded()} more member(s) to apply for a verification.`}
          />
        </Match>
        <Match when={membersNeeded() <= 0}>
          <Notice
            type="success"
            title={t("servers.settings.verify.verifiable")}
            description={t("servers.settings.verify.verifiableDescription")}
            children={
              <Button
                onClick={verifyClick}
                label={t("servers.settings.verify.verifyButton")}
                styles={{ "margin-left": "auto" }}
                margin={0}
                color="var(--success-color)"
              />
            }
          />
        </Match>
      </Switch>
      <ListContainer>
        <Text size={24} style={{ "margin-bottom": "10px" }}>
          {t("servers.settings.verify.requirements.title")}
        </Text>
        <SettingsBlock
          icon="translate"
          label={t("servers.settings.verify.requirements.englishOnly")}
          description={t("servers.settings.verify.requirements.englishOnlyDescription")}
        />
        <SettingsBlock
          icon="calendar_month"
          label={t("servers.settings.verify.requirements.oneMonthOrSupporter")}
          description={t("servers.settings.verify.requirements.oneMonthOrSupporterDescription")}
        />
        <SettingsBlock
          icon="group"
          label={t("servers.settings.verify.requirements.members", { count: `${TARGET_MEMBERS}` })}
          description={t("servers.settings.verify.requirements.membersDescription", { count: `${TARGET_MEMBERS}` })}
        />
        <SettingsBlock
          icon="cleaning_services"
          label={t("servers.settings.verify.requirements.profanityFree")}
          description={t("servers.settings.verify.requirements.profanityFreeDescription")}
        />
        <SettingsBlock
          icon="landscape"
          label={t("servers.settings.verify.requirements.avatarAndBanner")}
          description={t("servers.settings.verify.requirements.avatarAndBannerDescription")}
        />
        <SettingsBlock
          icon="gavel"
          label={t("servers.settings.verify.requirements.rules")}
          description={t("servers.settings.verify.requirements.rulesDescription")}
        />
      </ListContainer>
      <ListContainer>
        <Text size={24} style={{ "margin-bottom": "10px" }}>
          {t("servers.settings.verify.perks.title")}
        </Text>
        <SettingsBlock
          icon="verified"
          label={t("servers.settings.verify.perks.badge")}
          description={t("servers.settings.verify.perks.badgeDescription")}
        />
        <SettingsBlock
          icon="explore"
          label={t("servers.settings.verify.perks.explore")}
          description={t("servers.settings.verify.perks.exploreDescription")}
        />
        <SettingsBlock
          icon="link"
          label={t("servers.settings.verify.perks.customInvite")}
          description={t("servers.settings.verify.perks.customInviteDescription")}
        />
        <SettingsBlock
          icon="face"
          label={t("servers.settings.verify.perks.emojiSlots")}
          description={t("servers.settings.verify.perks.emojiSlotsDescription")}
        />
        <SettingsBlock
          icon="video_camera_front"
          label={t("servers.settings.verify.perks.hdScreenshare")}
          description={t("servers.settings.verify.perks.hdScreenshareDescription")}
        />
      </ListContainer>
    </Container>
  );
}
