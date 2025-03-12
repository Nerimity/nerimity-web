import { Modal } from "@/components/ui/modal";
import { createSignal } from "solid-js";
import Input from "@/components/ui/input/Input";
import { createServerChannel, updateServerChannelOrder } from "@/chat-api/services/ServerService";
import { useNavigate } from "solid-navigator";
import RouterEndpoints from "@/common/RouterEndpoints";
import { ChannelType } from "@/chat-api/RawData";
import { t } from "i18next";
import useStore from "@/chat-api/store/useStore";

export function CreateChannelModal(props: { close: () => void; serverId: string; categoryId: string; }) {
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal({ message: "", path: "" });
  const [name, setName] = createSignal("");
  const navigate = useNavigate();
  const { channels } = useStore();

  const onCreateClick = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError({ message: "", path: "" });

    const channel = await createServerChannel({
      serverId: props.serverId,
      name: name(),
      type: ChannelType.SERVER_TEXT
    }).catch((err) => {
      setError(err);
      setRequestSent(false);
    });

    if (channel && props.categoryId) {
      await updateServerChannelOrder(props.serverId, {
        channelIds: [channel.id],
        categoryId: props.categoryId
      }).catch(console.error);
    }

    setTimeout(() => {
      if (channel) {
        navigate(RouterEndpoints.SERVER_SETTINGS_CHANNEL(props.serverId, channel.id));
        props.close();
      }
      setRequestSent(false);
    }, 1000);
  };

  return (
    <Modal.Root close={props.close}>
      <Modal.Header title={t("servers.settings.channels.createNewDescription")} icon="add" />
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
          label={t("createServerModal.closeButton")}
          alert
          iconName="close"
          onClick={props.close}
        />
        <Modal.Button
          label={
            requestSent()
              ? t("servers.settings.channel.saving")
              : t("servers.settings.channels.createButton")
          }
          iconName="add"
          primary
          onClick={onCreateClick}
        />
      </Modal.Footer>
    </Modal.Root>
  );
}