import { RawMessage, RawMessageButton } from "@/chat-api/RawData";
import style from "./ButtonsEmbed.module.scss";
import Button from "@/components/ui/Button";
import { createSignal, For, onCleanup, Show } from "solid-js";
import { messageButtonClick } from "@/chat-api/services/MessageService";
import { cn } from "@/common/classNames";
import useStore from "@/chat-api/store/useStore";
import socketClient from "@/chat-api/socketClient";
import { ServerEvents } from "@/chat-api/EventNames";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import LegacyModal from "@/components/ui/legacy-modal/LegacyModal";
import { Markup } from "@/components/Markup";
import DropDown from "@/components/ui/drop-down/DropDown";
import Text from "@/components/ui/Text";
import { Notice } from "@/components/ui/Notice/Notice";
import Input from "@/components/ui/input/Input";

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

export interface ButtonCallbackDropdownItem {
  id: string;
  label: string;
}

export interface ButtonCallbackTextComponent {
  id: string;
  type: "text";
  content: string;
}

export interface ButtonCallbackDropdownComponent {
  type: "dropdown";
  id: string;
  label?: string;
  items: ButtonCallbackDropdownItem[];
}
export interface ButtonCallbackInputComponent {
  type: "input";
  id: string;
  label?: string;
  placeholder?: string;
}

export type ButtonCallbackComponent =
  | ButtonCallbackTextComponent
  | ButtonCallbackDropdownComponent
  | ButtonCallbackInputComponent;

export interface ButtonCallbackBase {
  title?: string;
  buttonLabel?: string;
}

export interface ButtonCallbackContent extends ButtonCallbackBase {
  content: string;
  components?: ButtonCallbackComponent[];
}

export interface ButtonCallbackComponents extends ButtonCallbackBase {
  components: ButtonCallbackComponent[];
  content?: string;
}

export type ButtonCallback = ButtonCallbackContent | ButtonCallbackComponents;

type CallbackPayload = {
  messageId: string;
  channelId: string;
  buttonId: string;
  userId: string;
} & ButtonCallback;

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
  const [inputs, setInputs] = createSignal<Record<string, string>>({});
  const [error, setError] = createSignal<string | null>(null);
  const [requestSent, setRequestSent] = createSignal(false);
  const title = () =>
    props.payload.title
      ? `${props.payload.title} (${props.message.createdBy.username})`
      : `Response from ${props.message.createdBy.username}`;

  const onCloseClick = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError(null);
    await messageButtonClick(
      props.message.channelId,
      props.message.id,
      props.button.id,
      inputs()
    )
      .then(() => props.close())
      .catch((err) => setError(err.message))
      .finally(() => setRequestSent(false));
  };

  return (
    <LegacyModal
      ignoreBackgroundClick
      close={props.close}
      title={title()}
      icon="robot"
      actionButtonsArr={[
        { label: props.payload.buttonLabel || "Close", onClick: onCloseClick },
      ]}
    >
      <div class={style.modalContent}>
        <Show when={props.payload.components?.length}>
          <Notice
            type="caution"
            description={[
              `Data is sent to ${props.message.createdBy.username}`,
              "Never share sensitive information",
            ]}
          />
        </Show>
        <Markup text={props.payload.content || ""} />
        <Show when={props.payload.components?.length}>
          <For each={props.payload.components}>
            {(component) => (
              <ButtonComponent
                component={component}
                inputs={inputs()}
                setInputs={setInputs}
              />
            )}
          </For>
        </Show>
        <Show when={error()}>
          <Text color="var(--alert-color)">{error()}</Text>
        </Show>
      </div>
    </LegacyModal>
  );
};

const ButtonComponent = (props: {
  component: ButtonCallbackComponent;
  inputs: Record<string, string>;
  setInputs: (
    fn: (prev: Record<string, string>) => Record<string, string>
  ) => void;
}) => {
  const dropdown = () => props.component as ButtonCallbackDropdownComponent;
  const text = () => props.component as ButtonCallbackTextComponent;
  const input = () => props.component as ButtonCallbackInputComponent;

  return (
    <>
      <Show when={props.component.type === "text"}>
        <Markup text={text().content} />
      </Show>
      <Show when={props.component.type === "dropdown"}>
        <DropDown
          onChange={(item) => {
            props.setInputs((prev) => ({ ...prev, [dropdown().id]: item.id }));
          }}
          items={dropdown().items}
          title={dropdown().label}
        />
      </Show>
      <Show when={props.component.type === "input"}>
        <Input
          onText={(text) => {
            props.setInputs((prev) => ({ ...prev, [input().id]: text }));
          }}
          placeholder={input().placeholder}
          label={input().label}
        />
      </Show>
    </>
  );
};
