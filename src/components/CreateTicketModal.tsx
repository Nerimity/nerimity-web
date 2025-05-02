import { createSignal, Show } from "solid-js";
import { useNavigate } from "solid-navigator";
import DropDown, { DropDownItem } from "./ui/drop-down/DropDown";
import { createTicket } from "@/chat-api/services/TicketService.ts";
import { TicketCategory } from "@/chat-api/RawData";
import { FlexColumn, FlexRow } from "./ui/Flexbox";
import Button from "./ui/Button";
import LegacyModal from "./ui/legacy-modal/LegacyModal";
import { Notice } from "./ui/Notice/Notice";
import Input from "./ui/input/Input";
import Text from "./ui/Text";

interface AbuseTicket {
  id: "ABUSE";
  userId: string;
  messageId?: string;
}
interface VerifyServerTicket {
  id: "SERVER_VERIFICATION";
}

type Ticket = AbuseTicket | VerifyServerTicket;

export function CreateTicketModal(props: {
  close: () => void;
  ticket?: Ticket;
}) {
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = createSignal(
    props.ticket?.id || "SELECT"
  );
  const [userIds, setUserIds] = createSignal(
    props.ticket?.id === "ABUSE" ? props.ticket.userId || "" : ""
  );
  const [messageIds, setMessageIds] = createSignal(
    props.ticket?.id === "ABUSE" ? props.ticket.messageId || "" : ""
  );
  const [title, setTitle] = createSignal("");
  const [body, setBody] = createSignal("");
  const [error, setError] = createSignal<null | string>(null);
  const [serverInviteUrl, setServerInviteUrl] = createSignal<string>("");
  const [requestSent, setRequestSent] = createSignal(false);

  const Categories: DropDownItem[] = [
    { id: "SERVER_VERIFICATION", label: "Verify Server" },
    { id: "QUESTION", label: "Question" },
    { id: "ACCOUNT", label: "Account" },
    { id: "ABUSE", label: "Abuse" },
    { id: "OTHER", label: "Other" },
  ];

  const hasProblem = () =>
    ["ABUSE", "OTHER", "ACCOUNT", "QUESTION"].includes(selectedCategoryId());

  const createTicketClick = async () => {
    if (requestSent()) return;

    setError(null);

    if (selectedCategoryId() === "SELECT") {
      setError("Please select a category");
      return;
    }

    if (!body()) {
      setError("Please enter a body");
      return;
    }

    if (hasProblem()) {
      if (body().length < 100) {
        setError("Description must be at least 200 characters.");
        return;
      }
    }

    if (selectedCategoryId() !== "ABUSE") {
      setUserIds("");
      setMessageIds("");
    }

    let customBody = body();

    if (userIds()) {
      const userIdsWithoutSpace = userIds().replace(/\s/g, "");
      const userIdsSplit = userIdsWithoutSpace.split(",");
      customBody = `User(s) to report:${userIdsSplit.map(
        (id) => ` [@:${id}]`
      )}\n\n${customBody}`;
    }
    if (messageIds()) {
      customBody += `\n\nMessage(s) to report:\n${messageIds()
        .replace(/\s/g, "")
        .split(",")
        .map((id) => `[q:${id}]`)
        .join("")}\n\n`;
    }

    if (selectedCategoryId() === "SERVER_VERIFICATION") {
      if (!serverInviteUrl()) {
        setError("Please enter an invite URL (from your server settings)");
        return;
      }
      customBody = `Server Invite URL: ${serverInviteUrl()}\n\nExcited For:\n${customBody}`;
      setTitle("Server Verification");
    }

    setRequestSent(true);

    const ticket = await createTicket({
      body: customBody,
      category:
        TicketCategory[selectedCategoryId() as keyof typeof TicketCategory],
      title: title(),
    }).catch((err) => {
      setError(err.message);
      setRequestSent(false);
    });
    if (!ticket) return;
    navigate(`/app/settings/tickets/${ticket.id}`);
    props.close();
  };

  const actionButtons = (
    <FlexRow style={{ flex: 1, "justify-content": "end" }}>
      <Button
        label="Back"
        color="var(--alert-color)"
        onClick={props.close}
        iconName="close"
      />
      <Button
        label={requestSent() ? "Creating..." : "Create Ticket"}
        onClick={createTicketClick}
        iconName="add"
        primary
      />
    </FlexRow>
  );

  return (
    <LegacyModal
      title="Create Ticket"
      icon="help"
      close={props.close}
      ignoreBackgroundClick
      maxWidth={800}
      actionButtons={actionButtons}
    >
      <FlexColumn style={{ overflow: "auto", "max-height": "60vh" }}>
        <FlexColumn gap={6}>
          <Notice
            style={{ "margin-left": "12px", "margin-right": "12px" }}
            description={[
              "Tickets must be written in ENGLISH. Tickets that are not written in English will be closed.",
              "Creating multiple false tickets may affect your account.",
            ]}
            type="warn"
          />
        </FlexColumn>
        <FlexColumn style={{ gap: "12px", padding: "12px" }}>
          <Show when={!props.ticket}>
            <DropDown
              title="Choose a category"
              items={Categories}
              selectedId={selectedCategoryId()}
              onChange={(item) => setSelectedCategoryId(item.id)}
            />
          </Show>

          <Show when={selectedCategoryId() === "ABUSE"}>
            <Input
              label="User ID(s) to report (separated by comma)"
              value={userIds()}
              onText={setUserIds}
            />
            <Input
              label="Message ID(s) to report (separated by comma)"
              value={messageIds()}
              onText={setMessageIds}
            />
          </Show>

          <Show when={hasProblem()}>
            <Input
              label="In one short sentence, what is the problem?"
              value={title()}
              onText={setTitle}
            />
            <Input
              label="Describe the problem"
              type="textarea"
              minHeight={100}
              value={body()}
              onText={setBody}
            />
          </Show>
          <Show when={selectedCategoryId() === "SERVER_VERIFICATION"}>
            <Notice
              type="info"
              description="Make sure you meet all the requirements in your server settings verify page."
            />
            <Input
              label="Existing Server Invite URL"
              placeholder="https://nerimity.com/i/xxxxxxxxxx"
              value={serverInviteUrl()}
              onText={setServerInviteUrl}
            />
            <Input
              label="Which verify perk are you most excited for?"
              type="textarea"
              minHeight={100}
              value={body()}
              onText={setBody}
            />
          </Show>
          <Show when={error()}>
            <Text color="var(--alert-color)">{error()}</Text>
          </Show>
          <Notice
            type="info"
            description="You will be able to send attachments after the ticket is created."
          />
        </FlexColumn>
      </FlexColumn>
    </LegacyModal>
  );
}
