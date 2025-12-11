import style from "./AddServerModal.module.scss";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/ui/input/Input";
import {
  AddServerModalProvider,
  useAddServerModalController,
} from "./useAddServerModalController";
import { Notice } from "@/components/ui/Notice/Notice";
import { t } from "@nerimity/i18lite";
import { Item } from "@/components/ui/Item";
import { Show, createSignal } from "solid-js";
import Button from "@/components/ui/Button";
import RouterEndpoints from "@/common/RouterEndpoints";

export function AddServerModal(props: { close: () => void }) {
  return (
    <AddServerModalProvider close={props.close}>
      <Content close={props.close} />
    </AddServerModalProvider>
  );
}

const Content = (props: { close: () => void }) => {
  const controller = useAddServerModalController();

  return (
    <Modal.Root
      close={props.close}
      class={style.modalRoot}
      desktopMaxWidth={400}
    >
      <Modal.Header
        title={
          controller.tab() === "CREATE"
            ? t("createServerModal.title")
            : t("joinServerModal.title")
        }
        icon="dns"
      />
      <Show when={controller.tab() === "CREATE"}>
        <CreateServerModal close={props.close} />
      </Show>
      <Show when={controller.tab() === "JOIN"}>
        <JoinServerModal close={props.close} />
      </Show>
    </Modal.Root>
  );
};

const CreateServerModal = (props: { close: () => void }) => {
  const controller = useAddServerModalController();

  return (
    <>
      <Modal.Body class={style.modalBody}>
        <Tabs />
        <Notice
          type="warn"
          description={[
            t("createServerModal.notice"),
          ]}
        />
        <Input
          label={t("createServerModal.serverName")}
          onText={controller.setName}
          value={controller.name()}
          error={controller.error().message}
          placeholder={t("createServerModal.placeholder")}
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
            controller.requestSent()
              ? t("createServerModal.creating")
              : t("createServerModal.createServerButton")
          }
          iconName="add"
          primary
          onClick={controller.onCreateClick}
        />
      </Modal.Footer>
    </>
  );
};

function sanitizeInviteInput(value: string): string {
  const match = value.match(
    /(?:\/i\/|\/app\/explore\/servers\/invites\/)([A-Za-z0-9_-]+)/
  );
  return match ? match[1]! : value.trim();
}

const JoinServerModal = (props: { close: () => void }) => {
  const controller = useAddServerModalController();
  const [rawInvite, setRawInvite] = createSignal(controller.name());

  return (
    <>
      <Modal.Body class={style.modalBody}>
        <Tabs />
        <Notice
          type="info"
          description={t("joinServerModal.notice")}
          children={
            <Button
              href={RouterEndpoints.EXPLORE_SERVERS()}
              onClick={props.close}
              iconName="explore"
              label={t("joinServerModal.exploreButton")}
              iconSize={16}
              margin={0}
            />
          }
        />
        <Input
          label={t("joinServerModal.inviteCode")}
          onText={setRawInvite}
          value={rawInvite()}
          error={controller.error().message}
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
          onClick={(e) => {
            const cleaned = sanitizeInviteInput(rawInvite());
            controller.setName(cleaned);
            controller.onJoinClick(e);
          }}
          href={RouterEndpoints.EXPLORE_SERVER_INVITE(
            sanitizeInviteInput(rawInvite())
          )}
          label={t("joinServerModal.continueButton")}
          iconName="arrow_forward"
          primary
        />
      </Modal.Footer>
    </>
  );
};

const Tabs = () => {
  const controller = useAddServerModalController();

  return (
    <div class={style.tabs}>
      <Item.Root
        handlePosition="bottom"
        selected={controller.tab() === "CREATE"}
        onClick={() => controller.setTab("CREATE")}
      >
        <Item.Icon>add</Item.Icon>
        <Item.Label>{t("createServerModal.tabLabel")}</Item.Label>
      </Item.Root>
      <Item.Root
        handlePosition="bottom"
        selected={controller.tab() === "JOIN"}
        onClick={() => controller.setTab("JOIN")}
      >
        <Item.Icon>login</Item.Icon>
        <Item.Label>{t("joinServerModal.tabLabel")}</Item.Label>
      </Item.Root>
    </div>
  );
};
