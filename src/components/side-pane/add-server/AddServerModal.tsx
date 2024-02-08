import styles from "./styles.module.scss";

import Input from "@/components/ui/input/Input";
import Button from "@/components/ui/Button";
import { createServer } from "@/chat-api/services/ServerService";
import { createSignal } from "solid-js";
import RouterEndpoints from "@/common/RouterEndpoints";
import { useNavigate } from "solid-navigator";
import Modal from "@/components/ui/modal/Modal";
import { FlexRow } from "@/components/ui/Flexbox";
import { Notice } from "@/components/ui/Notice/Notice";
import { css } from "solid-styled-components";

export default function AddServer(props: {close: () => void}) {
  const navigate = useNavigate();
  const [name, setName] = createSignal("");
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal({message: "", path: ""});

  const onCreateClick = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError({message: "", path: ""});

    const server = await createServer(name()).catch(err => {
      setError(err);
    });
    if (server) {
      navigate(RouterEndpoints.SERVER_MESSAGES(server.id, server.defaultChannelId));
      props.close();
    }
    setRequestSent(false);
  };

  const ActionButtons = (
    <FlexRow style={{"justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button iconName='add_circle_outline' label='Create' onClick={onCreateClick}/>
    </FlexRow>
  );

  return(
    <Modal close={props.close} title="Add Server" icon='dns' actionButtons={ActionButtons}>
      <div class={styles.addServerContainer}>
        <Notice class={css`margin-bottom: 10px; padding: 100px`} type='warn' description="NSFW content is not allowed." />

        <Input label='Server Name' error={error().message} onText={setName} />
      </div>
    </Modal>
  );
}