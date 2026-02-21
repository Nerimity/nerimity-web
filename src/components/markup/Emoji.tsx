import { classNames } from "@/common/classNames";
import { useWindowProperties } from "@/common/useWindowProperties";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { styled } from "solid-styled-components";
import Text from "../ui/Text";
import { Show, createSignal } from "solid-js";
import { ServerInviteEmbed } from "../message-pane/message-item/MessageItem";
import { Modal } from "../ui/modal";

export function Emoji(props: {
  clickable?: boolean;
  custom?: boolean;
  class?: string;
  name: string;
  url: string;
  id?: string;
  animated?: boolean;
  resize?: number;
}) {
  const { shouldAnimate } = useWindowProperties();
  const { createPortal } = useCustomPortal();
  const [hovered, setHovered] = createSignal(false);

  const click = () => {
    createPortal((close) => <EmojiDetailsModal close={close} {...props} />);
  };

  const src = () => {
    if (!props.custom) return props.url;

    const url = new URL(props.url);
    if (!shouldAnimate(hovered()) && props.animated) {
      url.searchParams.set("type", "webp");
    }
    if (props.resize) {
      url.searchParams.set("size", props.resize.toString());
    }
    return url.href;
  };

  return (
    <img
      onClick={props.clickable ? click : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      loading="lazy"
      class={classNames(props.class, "emoji")}
      src={src()}
      alt={props.name}
      title={props.name}
    />
  );
}

const EmojiDetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  overflow: hidden;
  gap: 8px;
  position: relative;
  align-self: center;
  min-width: 260px;
`;

const MainEmojiContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: rgba(255, 255, 255, 0.02);
  border: solid 1px rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 6px;
  padding-left: 8px;
  padding-right: 8px;

  word-break: break-word;
  white-space: pre-wrap;
`;

const EmojiNameContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

function EmojiDetailsModal(props: {
  close: () => void;
  name: string;
  url: string;
  animated?: boolean;
  custom?: boolean;
  id?: string;
}) {
  const { shouldAnimate } = useWindowProperties();
  const [hovered, setHovered] = createSignal(false);

  return (
    <Modal.Root
      close={props.close}
    >
      <Modal.Header icon="face" title={props.custom ? "Custom Emoji" : "Emoji"} />
      <EmojiDetailsContainer>
        <MainEmojiContainer>
          <img
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            loading="lazy"
            style={{
              "object-fit": "contain",
              width: "60px",
              height: "60px",
              "border-radius": "6px",
            }}
            src={
              props.url + (props.animated && !shouldAnimate(hovered()) ? "?type=webp" : "")
            }
            alt={props.name}
            title={props.name}
          />
          <EmojiNameContainer>
            <Text size={18}>
              :
              <Text size={18} color="var(--primary-color)">
                {props.name}
              </Text>
              :
            </Text>
            <Text size={12} opacity={0.6}>
              {props.custom ? "Custom Emoji" : "Emoji"}
            </Text>
          </EmojiNameContainer>
        </MainEmojiContainer>

        <Show when={props.custom && props.id}>
          <ServerInviteEmbed
            emojiId={props.id}
          />
        </Show>
      </EmojiDetailsContainer>
    </Modal.Root>
  );
}
