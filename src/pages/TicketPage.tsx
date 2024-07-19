import { CloseTicketStatuses, RawMessage, RawTicket, TicketStatus } from "@/chat-api/RawData";
import { fetchMessages, postMessage } from "@/chat-api/services/MessageService";
import { getModerationTicket, updateModerationTicket } from "@/chat-api/services/ModerationService";
import { getTicket, updateTicket } from "@/chat-api/services/TicketService.ts";
import useStore from "@/chat-api/store/useStore";
import { formatTimestamp } from "@/common/date";
import RouterEndpoints from "@/common/RouterEndpoints";
import { useWindowProperties } from "@/common/useWindowProperties";
import { Markup } from "@/components/Markup";
import { TicketItem, TicketStatusToName } from "@/components/tickets/TicketsPage";
import Avatar from "@/components/ui/Avatar";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import { CustomLink } from "@/components/ui/CustomLink";
import FileBrowser, { FileBrowserRef } from "@/components/ui/FileBrowser";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import { ImageEmbed } from "@/components/ui/ImageEmbed";
import Input from "@/components/ui/input/Input";
import { Notice } from "@/components/ui/Notice/Notice";
import Text from "@/components/ui/Text";
import { t } from "i18next";
import { createSignal, For, onCleanup, onMount, Setter, Show } from "solid-js";
import { useMatch, useParams } from "solid-navigator";
import { css, styled } from "solid-styled-components";



const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

const StatusButtonContainer = styled(FlexRow)`
  border-radius: 4px;
  padding: 4px;
  gap: 6px;
  color: black;
  cursor: pointer;
  user-select: none;
`;

const TicketStatusButtons = (props: {
  selectedStatus: number | undefined;
  setSelectedStatus: Setter<number | undefined>;
}) => {
  return (
    <FlexRow wrap gap={4} style={{ "justify-content": "end" }}>
      <For each={Object.keys(TicketStatusToName("mod")).splice(1)}>
        {(key) => {
          const status = TicketStatusToName("mod")[key];
          return (
            <StatusButtonContainer
              itemsCenter
              onClick={() =>
                props.setSelectedStatus(
                  props.selectedStatus === Number(key) ? undefined : Number(key)
                )
              }
              style={{ background: status?.color }}
            >
              <Checkbox checked={key === props.selectedStatus?.toString()} />
              {status?.text}
            </StatusButtonContainer>
          );
        }}
      </For>
    </FlexRow>
  );
};



const MessageLogsContainer = styled(FlexColumn)`
  border-top: solid 1px rgba(255, 255, 255, 0.2);
`;



const MessageItemContainer = styled(FlexRow)`
  border-bottom: solid 1px rgba(255, 255, 255, 0.2);
  padding-top: 12px;
  padding-bottom: 12px;
  padding-left: 4px;
  padding-right: 4px;
`;



export default function TicketPage() {
  const {height} = useWindowProperties();
  const params = useParams<{ id: string }>();

  const [ticket, setTicket] = createSignal<RawTicket | null>(null);
  const [messages, setMessages] = createSignal<RawMessage[]>([]);

  const isModeration = useMatch(() => "/app/moderation/*");

  onMount(async () => {
    refreshData();
    const TwoMinutesToMilliseconds = 2 * 60 * 1000;
    const interval = window.setInterval(() => refreshData(), TwoMinutesToMilliseconds);

    onCleanup(() => {
      window.clearInterval(interval);
    });
    
  });  

  const refreshData = async () => {
    const ticket = await (isModeration() ? getModerationTicket : getTicket)(
      params.id
    );
    setTicket(ticket);
    if (!ticket) return;

    const afterMessageId = messages().length ? messages()[messages().length - 1]?.id : "0";

    const newMessages = await fetchMessages(ticket.channelId, {
      afterMessageId: afterMessageId
    });
    setMessages(afterMessageId === "0" ? newMessages : [...messages(), ...newMessages]);
  };

  return (
    <Container>
      <div style={isModeration() ? { "margin-top": "20px" } : {}}>
        <Breadcrumb>
          <Show when={isModeration()}>
            <BreadcrumbItem href={"/app/moderation"} icon="home" title="Moderation" />
          </Show>
          <Show when={!isModeration()}>
            <BreadcrumbItem href="/app" icon="home" title="Dashboard" />
          </Show>
          <BreadcrumbItem title={t("settings.drawer.tickets")!} href={isModeration() ? "/app/moderation/tickets" : "/app/settings/tickets"} />
          <BreadcrumbItem title={"Ticket"} />
        </Breadcrumb>
      </div>
      <Show when={ticket()}>
        <Notice type="info" description="Page updates every 2 minutes." />
        <div class={css`
          ${height() >= 500 ?`
            position: sticky;
            z-index: 111111;
            top: ${isModeration() ? "10px": "50px"};
          ` : ""};
        `}>
          <TicketItem
            as={isModeration() ? "mod" : "user"}
            ticket={ticket()!}
            disableClick={true}
          />
        </div>
        <MessageLogs messages={messages()} />
        <div>{messages()?.length || 0}/50 messages</div>

        <Show when={messages()?.length < 50}>

          <MessageInputArea
            ticket={ticket()!}
            updateTicket={setTicket}
            channelId={ticket()!.channelId}
            setMessages={setMessages}
            messages={messages()}
          />
        </Show>

      </Show>
    </Container>
  );
};


const MessageInputArea = (props: {
  channelId: string;
  messages: RawMessage[];
  setMessages: Setter<RawMessage[]>;
  updateTicket(ticket: RawTicket): void;
  ticket: RawTicket;
}) => {
  const {tickets} = useStore();
  const params = useParams<{ id: string }>();
  const [selectedStatus, setSelectedStatus] = createSignal<TicketStatus | undefined>(undefined);
  const [fileBrowserRef, setFileBrowserRef] = createSignal<FileBrowserRef>();

  const [value, setValue] = createSignal("");
  const [attachment, setAttachment] = createSignal<File | undefined>();
  const isModeration = useMatch(() => "/app/moderation/*");

  onMount(() => {
    setTimeout(() => {
      tickets.updateTicketNotification();
    }, 2000);
    document.addEventListener("paste", onPaste);
    onCleanup(() => {
      document.removeEventListener("paste", onPaste);
    });
  });

  const onPaste = (event: ClipboardEvent) => {
    const file = event.clipboardData?.files[0];
    if (!file) return;
    if (!file.type.startsWith("image")) return;
    setAttachment(() => file);
  };


  const onAttachmentChange = (files: FileList) => {
    const file = files[0];
    setAttachment(() => file);
  };

  const sendClick = async () => {
    const status = selectedStatus();
    if (status === undefined && isModeration()) {
      alert("You must select a status.");
      return;
    }
    
    const formattedValue = value().trim();
    if (!formattedValue.length) {
      alert("Your message cannot be empty.");
      return;
    }
    const file = attachment();
    setAttachment(undefined);
    setValue("");
    if (!formattedValue) return;
    const message = await postMessage({
      content: formattedValue,
      attachment: file,
      channelId: props.channelId
    }).catch((err) => {
      alert(err.message);
      setValue(formattedValue);
      setAttachment(() => file);
    });
    if (!message) return;

    const ticket = await (isModeration()
      ? updateModerationTicket
      : updateTicket)(
      params.id,
      status || TicketStatus.WAITING_FOR_MODERATOR_RESPONSE
    ).catch((err) => {
      alert(err.message);
    });
    tickets.updateModerationTicketNotification();
    tickets.updateTicketNotification();

    if (ticket) {
      props.updateTicket(ticket);
    }

    setSelectedStatus(undefined);

    props.setMessages([...props.messages, message]);
  };

  return (
    <FlexColumn gap={4}>
      <Show
        when={
          isModeration() || !CloseTicketStatuses.includes(props.ticket.status)
        }
      >
        <Input
          type="textarea"
          class={css`
            flex: 1;
          `}
          onText={setValue}
          value={value()}
          minHeight={120}
          placeholder="Message"
        />
      </Show>
      <Show when={isModeration()}>
        <TicketStatusButtons
          selectedStatus={selectedStatus()}
          setSelectedStatus={setSelectedStatus}
        />
      </Show>
      <Show
        when={
          isModeration() || !CloseTicketStatuses.includes(props.ticket.status)
        }
      >
        <FlexRow
          gap={4}
          class={css`
            justify-content: space-between;
            margin-top: 4px;
          `}
        >
          <FileBrowser ref={setFileBrowserRef} accept="images" onChange={onAttachmentChange}  />
          <Show when={!attachment()}>
            <Button
              label="Attach"
              iconName="attach_file"

              margin={0}
              class={css`
                flex-shrink: 0;
                height: 26px;
              `}
              onClick={fileBrowserRef()?.open}
            />
          </Show>
          <Show when={attachment()}>
            <Button
              label="Remove Attachment"
              iconName="close"
              color="var(--alert-color)"

              margin={0}
              class={css`
                flex-shrink: 0;
                height: 26px;
              `}
              onClick={() => setAttachment(undefined)}
            />
          </Show>
          <Button
            label="Send"
            iconName="send"
            margin={0}
            class={css`
              flex-shrink: 0;
              height: 26px;
            `}
            onClick={sendClick}
          />
        </FlexRow>
      </Show>
    </FlexColumn>
  );
};
const MessageLogs = (props: { messages: RawMessage[] }) => {
  return (
    <MessageLogsContainer>
      <For each={props.messages}>
        {(message) => <MessageItem message={message} />}
      </For>
    </MessageLogsContainer>
  );
};


const MessageItem = (props: { message: RawMessage }) => {
  const [hovered, setHovered] = createSignal(false);

  const creator = () => props.message.createdBy;

  return (
    <MessageItemContainer
      gap={6}
      onmouseenter={() => setHovered(true)}
      onmouseleave={() => setHovered(false)}
    >
      <CustomLink href={RouterEndpoints.PROFILE(creator().id)}>
        <Avatar user={creator()} size={30} animate={hovered()} />
      </CustomLink>
      <FlexColumn gap={4}>
        <FlexRow gap={4} itemsCenter>
          <FlexRow itemsCenter>
            <CustomLink href={RouterEndpoints.PROFILE(creator().id)}>
              <Text>@{creator().username}</Text>
              <Text opacity={0.6}>:{creator().tag}</Text>
            </CustomLink>
          </FlexRow>
          <Text opacity={0.6} size={12}>
            {formatTimestamp(props.message.createdAt)}
          </Text>
        </FlexRow>
        <Text size={14} class={css`word-break: break-word;white-space: pre-line;`}>
          <Markup message={props.message} text={props.message.content || ""} />
        </Text>
        <Show when={props.message.attachments?.[0]?.provider === "local"}>
          <ImageEmbed attachment={props.message.attachments?.[0]!} widthOffset={-70} />
        </Show>

      </FlexColumn>
    </MessageItemContainer>
  );
};
