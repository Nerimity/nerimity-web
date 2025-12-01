import useStore from "@/chat-api/store/useStore";
import RouterEndpoints from "@/common/RouterEndpoints";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
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
        title={"Delete Webhook"}
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
        <BreadcrumbItem title={"Webhook"} />
      </Breadcrumb>

      <SettingsBlock label="Name" icon="label">
        <Input
          placeholder="Name"
          value={inputValues().name}
          onText={(t) => setInputValue("name", t)}
        />
      </SettingsBlock>
      <SettingsBlock
        label="Webhook Link"
        description="Execute actions using this link"
        icon="link"
      >
        <Button
          label="Copy Link"
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
          label={requestSent() ? "Saving..." : "Save Changes"}
          iconName="save"
          primary
        />
      </Show>

      <SettingsBlock
        label="Delete Webhook"
        icon="delete"
        description="This action cannot be undone."
      >
        <Button
          label="Delete"
          onClick={handleDelete}
          primary
          alert
          iconName="delete"
        />
      </SettingsBlock>
    </Container>
  );
}
