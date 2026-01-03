import useStore from "@/chat-api/store/useStore";
import RouterEndpoints from "@/common/RouterEndpoints";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import { useNavigate, useParams } from "solid-navigator";
import { t } from "@nerimity/i18lite";
import { createEffect, createSignal, onMount, Show } from "solid-js";
import { css, styled } from "solid-styled-components";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Input from "@/components/ui/input/Input";
import Button from "@/components/ui/Button";
import { RawWebhook } from "@/chat-api/RawData";
import {
  deleteWebhook,
  getWebhook,
  getWebhookToken,
  updateWebhook,
} from "@/chat-api/services/WebhookService";
import { createUpdatedSignal } from "@/common/createUpdatedSignal";
import { copyToClipboard } from "@/common/clipboard";
import { toast, useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import DeleteConfirmModal from "@/components/ui/delete-confirm-modal/DeleteConfirmModal";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  padding: 10px;
`;

export default function ServerSettingsWebhook() {
  const params = useParams<{
    serverId: string;
    channelId: string;
    webhookId: string;
  }>();
  const { servers, channels, header } = useStore();
  const navigate = useNavigate();

  const [webhook, setWebhook] = createSignal<RawWebhook>();
  const [requestSent, setRequestSent] = createSignal(false);
  const { createPortal } = useCustomPortal();

  const defaultInput = () => ({
    name: webhook()?.name || "",
  });

  const [inputValues, updatedInputValues, setInputValue] =
    createUpdatedSignal(defaultInput);

  const getAndStoreWebhook = async () => {
    const webhook = await getWebhook(
      params.serverId,
      params.channelId,
      params.webhookId
    );
    setWebhook(webhook);
  };

  onMount(() => {
    getAndStoreWebhook();
  });

  createEffect(() => {
    header.updateHeader({
      title:
        t("settings.drawer.title") +
        " - " +
        t("servers.settings.webhook.title"),
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

  const handleDeleteConfirmed = async () => {
    const res = await deleteWebhook(
      params.serverId,
      params.channelId,
      params.webhookId
    ).catch((err) => {
      toast(err.message);
    });

    if (res) {
      navigate("../../");
    }
  };

  const handleDelete = async () => {
    if (!webhook()) return;
    createPortal((c) => (
      <DeleteConfirmModal
        title={t("servers.settings.webhook.delete")}
        close={c}
        confirmText={webhook()?.name!}
        onDeleteClick={handleDeleteConfirmed}
      />
    ));
  };

  let url = "";
  const handleCopyUrl = async () => {
    if (url) {
      copyToClipboard(url);
      return;
    }
    const res = await getWebhookToken(
      params.serverId,
      params.channelId,
      params.webhookId
    ).catch((err) => {
      toast(err.message);
    });

    if (!res) return;

    url = `https://nerimity.com/api/webhooks/${params.webhookId}/${res.token}`;

    copyToClipboard(url);
  };

  const handleSaveClick = () => {
    if (requestSent()) return;
    setRequestSent(true);

    updateWebhook(params.serverId, params.channelId, params.webhookId, {
      name: inputValues().name,
    })
      .then((res) => setWebhook(res))
      .catch((err) => toast(err.message))
      .finally(() => {
        setRequestSent(false);
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
        <BreadcrumbItem title={channel()?.name} href="../../" />
        <BreadcrumbItem title={t("servers.settings.webhook.title")} />
      </Breadcrumb>

      <SettingsBlock label={t("servers.settings.webhook.name")} icon="label">
        <Input
          placeholder={t("servers.settings.webhook.name")}
          value={inputValues().name}
          onText={(t) => setInputValue("name", t)}
        />
      </SettingsBlock>
      <SettingsBlock
        label={t("servers.settings.webhook.link")}
        description={t("servers.settings.webhook.linkDescription")}
        icon="link"
      >
        <Button
          label={t("general.copyLink")}
          iconName="content_copy"
          onClick={handleCopyUrl}
        />
      </SettingsBlock>

      <Show when={Object.keys(updatedInputValues()).length}>
        <Button
          class={css`
            align-self: flex-end;
            margin-bottom: 20px;
          `}
          onClick={handleSaveClick}
          label={
            requestSent()
              ? t("general.saving")
              : t("general.saveChangesButton")
          }
          iconName="save"
          primary
        />
      </Show>

      <SettingsBlock
        label={t("servers.settings.webhook.delete")}
        icon="delete"
        description={t("general.cannotBeUndone")}
      >
        <Button
          label={t("general.deleteButton")}
          onClick={handleDelete}
          primary
          alert
          iconName="delete"
        />
      </SettingsBlock>
    </Container>
  );
}
