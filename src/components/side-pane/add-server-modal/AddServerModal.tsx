import style from "./AddServerModal.module.scss";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/ui/input/Input";
import {
  AddServerModalProvider,
  useAddServerModalController,
} from "./useAddServerModalController";
import { Notice } from "@/components/ui/Notice/Notice";
import { t } from "i18next";
import { Item } from "@/components/ui/Item";
import { Show } from "solid-js";
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
            : "Join Server"
        }
        icon="dns"
      />
      <Show when={controller.tab() === "CREATE"}>
        <CreateServerModalOwO close={props.close} />
      </Show>
      <Show when={controller.tab() === "JOIN"}>
        <JoinServerModal close={props.close} />
      </Show>
    </Modal.Root>
  );
};

const CreateServerModalOwO = (props: { close: () => void }) => {
  const controller = useAddServerModalController();

  return (
    <>
      <Modal.Body class={style.modalBody}>
        <Tabs />
        <Notice
          type="warn"
          description={[
            t("createServerModal.notice"),
            "Server MUST be in English.",
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

function sanitizeInviteInput(value: string) {
  const match = value.match(
    /(?:\/i\/|\/app\/explore\/servers\/invites\/)([A-Za-z0-9_-]+)/
  );
  return match ? match[1] : value.trim();
}


const JoinServerModal = (props: { close: () => void }) => {
  const controller = useAddServerModalController();
  return (
    <>
      <Modal.Body class={style.modalBody}>
        <Tabs />
        <Notice
          type="info"
          description="If you would like to explore servers, please go to the explore tab instead."
          children={
            <Button
              href={RouterEndpoints.EXPLORE_SERVERS()}
              onClick={props.close}
              iconName="explore"
              label="Explore Servers"
              iconSize={16}
              margin={0}
            />
          }
        />
        <Input
          label={"Invite Code"}
          onText={(val) => controller.setName(sanitizeInviteInput(val))}
          value={controller.name()}
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
          href={RouterEndpoints.EXPLORE_SERVER_INVITE(controller.name())}
          onClick={controller.onJoinClick}
          label="Continue"
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
        <Item.Label>Create</Item.Label>
      </Item.Root>
      <Item.Root
        handlePosition="bottom"
        selected={controller.tab() === "JOIN"}
        onClick={() => controller.setTab("JOIN")}
      >
        <Item.Icon>login</Item.Icon>

        <Item.Label>Join</Item.Label>
      </Item.Root>
    </div>
  );
};
