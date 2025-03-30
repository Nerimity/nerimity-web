import PageHeader from "../components/PageHeader";
import { css, styled } from "solid-styled-components";
import PageFooter from "@/components/PageFooter";
import { For, Show, createSignal, onMount } from "solid-js";
import { StorageKeys, getStorageString } from "@/common/localStorage";
import RouterEndpoints from "@/common/RouterEndpoints";
import { useNavigate, useParams, useSearchParams } from "solid-navigator";
import {
  RawBotUser,
  getApplicationBot,
} from "@/chat-api/services/ApplicationService";
import { RawServer, RawUser } from "@/chat-api/RawData";
import Avatar from "@/components/ui/Avatar";
import Text from "@/components/ui/Text";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import DropDown from "@/components/ui/drop-down/DropDown";
import Button from "@/components/ui/Button";
import {
  ROLE_PERMISSIONS,
  addBit,
  hasBit,
  removeBit,
} from "@/chat-api/Bitwise";
import { t } from "i18next";
import Checkbox from "@/components/ui/Checkbox";
import { inviteBot } from "@/chat-api/services/ServerService";
import { useTransContext } from "@mbarzda/solid-i18next";

const HomePageContainer = styled("div")`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
`;

const Content = styled("div")`
  position: relative;
  display: flex;
  flex-direction: column;
  margin: 8px;
  margin-top: 0;
  margin-bottom: 0;
  border-radius: 8px;
  flex: 1;
  align-items: center;
`;

export default function InviteServerBotPage() {
  const params = useParams<{ appId: string }>();
  const [searchParams, setSearchParams] = useSearchParams<{ perms: string }>();
  const navigate = useNavigate();
  const [bot, setBot] = createSignal<RawBotUser | null>(null);
  const [servers, setServers] = createSignal<Partial<RawServer>[]>([]);
  const [permissions, setPermissions] = createSignal<number>(
    searchParams.perms ? parseInt(searchParams.perms) : 0
  );
  const [serverId, setServerId] = createSignal<string | null>(null);

  onMount(async () => {
    if (!getStorageString(StorageKeys.USER_TOKEN, null)) {
      navigate(RouterEndpoints.LOGIN(location.pathname + location.search), {
        replace: true,
      });
      return;
    }

    const res = await getApplicationBot(params.appId, true);
    setBot(res.bot);
    setServers(res.servers);
  });

  const addBot = async () => {
    const [t] = useTransContext();
    if (!serverId()) {
      alert(t("botInvitePage.notSelected"));
      return;
    }
    inviteBot(serverId()!, params.appId, permissions()!);
  };

  const [t] = useTransContext();

  return (
    <HomePageContainer>
      <PageHeader />
      <Content class="content">
        <Show when={bot()}>
          <FlexColumn
            itemsCenter
            style={{
              margin: "auto",
              "padding-top": "40px",
              "padding-bottom": "40px",
            }}
            gap={12}
          >
            <FlexColumn gap={12} itemsCenter>
              <Avatar animate user={bot()!} size={120} />
              <Text size={18}>{bot()?.username}</Text>
            </FlexColumn>
            <FlexRow itemsCenter gap={8}>
              <Text>{t("botInvitePage.creator")}</Text>
              <Avatar
                animate
                user={bot()!.application.creatorAccount.user}
                size={24}
              />
              <Text>{bot()!.application.creatorAccount.user.username} </Text>
            </FlexRow>
            <PermissionList
              permissions={permissions()}
              setPermissions={setPermissions}
            />

            <DropDown
              onChange={(item) => setServerId(item.id)}
              title={t("botInvitePage.serverSelect")}
              class={css`
                width: 240px;
              `}
              items={servers().map((server) => ({
                label: server.name!,
                id: server.id!,
              }))}
            />
            <Button
              label={t("botInvitePage.add")}
              styles={{ opacity: serverId() ? 1 : 0.5 }}
              iconName="add"
              primary
              class={css`
                width: 220px;
              `}
              onClick={addBot}
            />
          </FlexColumn>
        </Show>
      </Content>
      <PageFooter />
    </HomePageContainer>
  );
}

const PermissionList = (props: {
  permissions: number;
  setPermissions: (permissions: number) => void;
}) => {
  const permissionsList = Object.values(ROLE_PERMISSIONS);

  const togglePermission = (bit: number) => {
    const hasPerm = hasBit(props.permissions, bit);
    props.setPermissions(
      hasPerm
        ? removeBit(props.permissions, bit)
        : addBit(props.permissions, bit)
    );
  };

  const [t] = useTransContext();

  return (
    <FlexColumn
      gap={8}
      class={css`
        width: 230px;
      `}
    >
      <Text opacity={0.8}>{t("botInvitePage.permissions")}</Text>
      <FlexColumn gap={4}>
        <For each={permissionsList}>
          {(permission) => (
            <FlexRow gap={8}>
              <Checkbox
                checked={hasBit(props.permissions, permission.bit)}
                onChange={() => togglePermission(permission.bit)}
                label={t(permission.name)}
              />
            </FlexRow>
          )}
        </For>
      </FlexColumn>
    </FlexColumn>
  );
};
