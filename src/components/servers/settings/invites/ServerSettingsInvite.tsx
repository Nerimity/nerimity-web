import styles from "./styles.module.scss";
import RouterEndpoints from "@/common/RouterEndpoints";
import {
  createCustomInvite,
  createInvite,
  deleteInvite,
  getInvites,
} from "@/chat-api/services/ServerService";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import env from "@/common/env";
import { classNames, conditionalClass } from "@/common/classNames";
import { formatTimestamp } from "@/common/date";
import Icon from "@/components/ui/icon/Icon";
import { A, useNavigate, useParams } from "solid-navigator";
import { createEffect, createSignal, For, on, onMount, Show } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import { useWindowProperties } from "@/common/useWindowProperties";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import { copyToClipboard } from "@/common/clipboard";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import Input from "@/components/ui/input/Input";
import { Notice } from "@/components/ui/Notice/Notice";
import { css } from "solid-styled-components";
import Text from "@/components/ui/Text";
import { useTransContext } from "@nerimity/solid-i18lite";
import { avatarUrl } from "@/chat-api/store/useUsers";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";

export default function ServerSettingsInvite() {
  const [t] = useTransContext();
  const params = useParams<{ serverId: string }>();
  const { header, servers, account } = useStore();
  const windowProperties = useWindowProperties();
  const [invites, setInvites] = createSignal<any[]>([]);
  const mobileSize = () => windowProperties.paneWidth()! < 550;
  const server = () => servers.get(params.serverId);

  const fetchInvites = async () => {
    const invites = await getInvites(params.serverId!);
    invites.sort((a: any, b: any) => {
      if (a.isCustom) return -1;
      return b.createdAt - a.createdAt;
    });
    setInvites(invites);
  };

  createEffect(
    on(
      () => params.serverId,
      () => {
        fetchInvites();
      },
    ),
  );

  createEffect(() => {
    header.updateHeader({
      title:
        t("settings.drawer.title") +
        " - " +
        t("servers.settings.drawer.invites"),
      serverId: params.serverId!,
      iconName: "settings",
    });
  });

  const isServerOwner = () => server()?.createdById === account.user()?.id;

  const onCreateInviteClick = async () => {
    await createInvite(params.serverId!);
    fetchInvites();
  };

  const deleteInvite = (code: string) => {
    setInvites(invites().filter((i) => i.code !== code));
  };

  return (
    <div
      class={classNames(
        styles.invitesPane,
        conditionalClass(mobileSize(), styles.mobile),
      )}
    >
      <Breadcrumb>
        <BreadcrumbItem
          href={RouterEndpoints.SERVER_MESSAGES(
            params.serverId,
            server()?.defaultChannelId!,
          )}
          icon="home"
          title={server()?.name}
        />
        <BreadcrumbItem title={t("servers.settings.drawer.invites")} />
      </Breadcrumb>
      <Show when={isServerOwner()}>
        <CustomInvite invites={invites()} onUpdate={fetchInvites} />
      </Show>

      <SettingsBlock
        label={t("servers.settings.invites.serverInvites")}
        description={t("servers.settings.invites.serverInvitesDescription")}
        icon="mail"
        header={true}
      >
        <Button
          label={t("servers.settings.invites.createInviteButton")}
          onClick={onCreateInviteClick}
        />
      </SettingsBlock>
      <For each={invites()}>
        {(invite) => (
          <InviteItem
            invite={invite}
            onDeleted={() => deleteInvite(invite.code)}
          />
        )}
      </For>
    </div>
  );
}

function CustomInvite(props: { invites: any[]; onUpdate: () => void }) {
  const [t] = useTransContext();
  const params = useParams<{ serverId: string }>();
  const { servers } = useStore();
  const server = () => servers.get(params.serverId);
  const prefixUrl =
    env.APP_URL + RouterEndpoints.EXPLORE_SERVER_INVITE_SHORT("");

  const [error, setError] = createSignal<null | string>(null);

  const customInvite = () => props.invites.find((invite) => invite.isCustom);
  const [customCode, setCustomCode] = createSignal("");

  createEffect(() => {
    setCustomCode(customInvite()?.code || "");
  });

  const fullUrl = () => prefixUrl + customCode();
  const showCustomCodeSaveButton = () => {
    if (!customInvite() && !customCode().trim().length) return false;
    if (!customInvite() && customCode().trim().length) return true;
    if (customInvite() && customCode().trim() === customInvite().code)
      return false;
    return true;
  };

  const createInvite = () => {
    setError(null);
    createCustomInvite(customCode().trim(), params.serverId)
      .then((invite) => {
        setCustomCode(invite.code);
        props.onUpdate();
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  return (
    <FlexColumn style={{ "margin-bottom": "10px" }}>
      <Show when={!server()?.verified}>
        <Notice
          class={css`
            margin-bottom: 10px;
          `}
          type="info"
          description={t(
            "servers.settings.invites.customInviteVerifiedOnlyNotice",
          )}
        />
      </Show>

      <SettingsBlock
        class={css`
          && {
            position: relative;
            overflow: hidden;
            flex-wrap: wrap;
            row-gap: 5px;
            ${!server()?.verified ? "cursor: not-allowed; opacity: 0.6;" : ""}
          }
        `}
        label={t("servers.settings.invites.customLink")}
        icon="link"
      >
        {/* Overlay to block actions when server is not verified. */}
        <Show when={!server()?.verified}>
          <div style={{ position: "absolute", inset: 0, "z-index": 1111 }} />
        </Show>
        <FlexRow gap={8} style={{ "align-items": "center" }}>
          <Input
            prefix={prefixUrl}
            onText={(t) => setCustomCode(t)}
            value={customCode()}
          />
          <Show when={customInvite()}>
            <Button
              onClick={() => copyToClipboard(fullUrl())}
              iconName="content_copy"
              style={{ "align-self": "stretch", height: "auto" }}
            />
          </Show>
        </FlexRow>
      </SettingsBlock>
      <Show when={error()}>
        <Text
          style={{ "align-self": "end" }}
          size={12}
          color="var(--alert-color)"
        >
          {error()}
        </Text>
      </Show>
      <Show when={showCustomCodeSaveButton()}>
        <Button
          onClick={createInvite}
          class={css`
            align-self: self-end;
            margin-bottom: -8px;
          `}
          label={t("general.saveButton")}
          iconName="save"
        />
      </Show>
    </FlexColumn>
  );
}

const InviteItem = (props: { invite: any; onDeleted: () => void }) => {
  const [t] = useTransContext();
  const navigate = useNavigate();
  const url =
    env.APP_URL +
    RouterEndpoints.EXPLORE_SERVER_INVITE_SHORT(props.invite.code);

  const onDeleteClick = async () => {
    await deleteInvite(props.invite.serverId, props.invite.code);
    props.onDeleted();
  };

  return (
    <div class={styles.inviteItem}>
      <Avatar class={styles.avatar} user={props.invite.createdBy} size={30} />
      <div class={styles.detailsOuter}>
        <div class={styles.details}>
          <A
            href={RouterEndpoints.EXPLORE_SERVER_INVITE_SHORT(
              props.invite.code,
            )}
            onclick={(e) => {
              e.preventDefault();
              navigate(RouterEndpoints.EXPLORE_SERVER_INVITE(
                props.invite.code,
              ));
            }}
            class={styles.url}
          >
            {url}
          </A>
          <div class={styles.otherDetails}>
            <div class={styles.detail}>
              <Icon name="person" size={14} class={styles.icon} />
              <span class={styles.username}>
                {props.invite.createdBy.username}
              </span>
            </div>
            <div class={styles.detail}>
              <Icon name="whatshot" size={14} class={styles.icon} />
              <span>
                {t("servers.settings.invites.uses", {
                  count: props.invite.uses,
                })}
              </span>
            </div>
            <div class={styles.detail}>
              <Icon name="today" size={14} class={styles.icon} />
              <span>{formatTimestamp(props.invite.createdAt)}</span>
            </div>
          </div>
        </div>
        <FlexRow class={styles.buttons}>
          <Button
            onClick={() => copyToClipboard(url)}
            class={classNames(styles.copyButton, styles.button)}
            label={t("general.copyLink")}
            iconSize={18}
            textSize={14}
            iconName="content_copy"
          />
          <Button
            onClick={onDeleteClick}
            class={classNames(styles.deleteButton, styles.button)}
            iconName="delete"
            iconSize={18}
            textSize={14}
            color="var(--alert-color)"
          />
        </FlexRow>
      </div>
    </div>
  );
};
