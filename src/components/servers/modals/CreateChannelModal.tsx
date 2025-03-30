import { Modal } from "@/components/ui/modal";
import { createSignal } from "solid-js";
import Input from "@/components/ui/input/Input";
import {
  createServerChannel,
  updateServerChannelOrder,
} from "@/chat-api/services/ServerService";
import { ChannelType } from "@/chat-api/RawData";
import { t } from "i18next";

export function CreateChannelModal(props: {
  close: () => void;
  serverId: string;
  categoryId?: string;
}) {
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal({ message: "", path: "" });
  const [name, setName] = createSignal("");

  const onCreateClick = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError({ message: "", path: "" });

    const channel = await createServerChannel({
      serverId: props.serverId,
      name: name(),
      type: ChannelType.SERVER_TEXT,
    }).catch((err) => {
      setError(err);
      setRequestSent(false);
    });

    if (channel && props.categoryId) {
      await updateServerChannelOrder(props.serverId, {
        channelIds: [channel.id],
        categoryId: props.categoryId,
      }).catch(console.error);
    }
    if (channel) {
      props.close();
    }
  };

  return (
    <Modal.Root close={props.close}>
      <Modal.Header title={t("servers.settings.channels.newChannel")} icon="add" />
      <Modal.Body>
        <Input
          label={t("servers.settings.channel.channelName")}
          onText={setName}
          value={name()}
          error={error().message}
        />
      </Modal.Body>
      <Modal.Footer>
        <Modal.Button
          label={requestSent() ? t("servers.settings.channels.creating") : t("servers.settings.channels.createButton")}
          iconName="add"
          primary
          onClick={onCreateClick}
        />
      </Modal.Footer>
    </Modal.Root>
  );
}
