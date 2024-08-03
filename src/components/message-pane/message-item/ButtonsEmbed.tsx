import { RawMessage, RawMessageButton } from "@/chat-api/RawData";
import style from "./ButtonsEmbed.module.scss";
import Button from "@/components/ui/Button";
import { createSignal, For, onCleanup } from "solid-js";
import { messageButtonClick } from "@/chat-api/services/MessageService";
import { cn } from "@/common/classNames";
import useStore from "@/chat-api/store/useStore";
import socketClient from "@/chat-api/socketClient";
import { ServerEvents } from "@/chat-api/EventNames";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import LegacyModal from "@/components/ui/legacy-modal/LegacyModal";
import { Markup } from "@/components/Markup";

export function ButtonsEmbed(props: { message: RawMessage }) {
  const buttons = () => props.message.buttons || [];

  return (
    <div class={style.container}>
      <For each={buttons()}>
        {(button) => <MessageButton button={button} message={props.message} />}
      </For>
    </div>
  );
}

interface CallbackPayload {
  messageId: string;
  channelId: string;
  buttonId: string;
  userId: string;

  title?: string;
  content?: string;
}
const MessageButton = (props: {
  message: RawMessage;
  button: RawMessageButton;
}) => {
  const [clicked, setClicked] = createSignal(false);
  const { createPortal } = useCustomPortal();

  const onCallback = (payload: CallbackPayload) => {
    if (payload.messageId !== props.message.id) return;
    if (payload.channelId !== props.message.channelId) return;
    if (payload.buttonId !== props.button.id) return;
    off();
    setClicked(false);

    if (!payload.content) return;

    createPortal((close) => (
      <ResponseModal
        close={close}
        button={props.button}
        message={props.message}
        payload={payload}
      />
    ));
  };

  const off = () =>
    socketClient.socket.off(
      ServerEvents.MESSAGE_BUTTON_CLICKED_CALLBACK,
      onCallback
    );

  onCleanup(() => {
    off();
  });

  const onClick = () => {
    if (clicked()) return;
    setClicked(true);

    socketClient.socket.on(
      ServerEvents.MESSAGE_BUTTON_CLICKED_CALLBACK,
      onCallback
    );

    messageButtonClick(
      props.message.channelId,
      props.message.id,
      props.button.id
    );
    setTimeout(() => {
      off();
      setClicked(false);
    }, 10000);
  };

  return (
    <Button
      class={cn(clicked() ? style.clicked : undefined)}
      onClick={onClick}
      label={props.button.label}
      margin={0}
      color={props.button.alert ? "var(--alert-color)" : "var(--primary-color)"}
    />
  );
};

const ResponseModal = (props: {
  close: () => void;
  message: RawMessage;
  button: RawMessageButton;
  payload: CallbackPayload;
}) => {
  const title =
    `${props.payload.title} (${props.message.createdBy.username})` ||
    `Response from ${props.message.createdBy.username}`;

  return (
    <LegacyModal
      ignoreBackgroundClick
      close={props.close}
      title={title}
      icon="robot"
      actionButtonsArr={[{ label: "Close", onClick: props.close }]}
    >
      <div class={style.modalContent}>
        <Markup text={props.payload.content || ""} />
      </div>
    </LegacyModal>
  );
};
