import useStore from "@/chat-api/store/useStore";
import { formatTimestamp } from "@/common/date";
import { getStorageString, StorageKeys } from "@/common/localStorage";
import { useNavigate } from "@solidjs/router";
import { Match, Show, Switch } from "solid-js";
import { styled } from "solid-styled-components";
import Button from "./ui/Button";
import { FlexRow } from "./ui/Flexbox";
import Modal from "./ui/Modal"
import Text from "./ui/Text";

const ConnectionErrorContainer = styled("div")`
  max-width: 250px;
`;

export const ConnectionErrorModal = (props: {close: () => void}) => {
  const { account } = useStore();
  const navigate = useNavigate();
  const err = () => account.authenticationError()!;

  const logout = () => {
    localStorage.clear();
    navigate("/")
    props.close();
  }

  const hasToken = () => getStorageString(StorageKeys.USER_TOKEN, null);


  const ActionButtons = (
    <FlexRow style={{"justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button onClick={props.close} label="OK" />
      <Show when={hasToken()}><Button onClick={logout} label="Logout" color="var(--alert-color)" /></Show>
    </FlexRow>
  )


  return (
    <Modal title="Connection Error" close={props.close} actionButtons={ActionButtons}>
      <ConnectionErrorContainer>
        <Switch fallback={() => <Text>{err()?.message}</Text>}>
          <Match when={!hasToken()}><Text>No token provided.</Text></Match>
          <Match when={err()?.data?.type === "suspend"}><SuspendMessage {...err().data} /></Match>
        </Switch>
      </ConnectionErrorContainer>
    </Modal>
  )
}

function SuspendMessage({reason, expire}: {reason?: string; expire?: number;}) {
  return (
    <>
      <Text opacity={0.6}>You are suspended for </Text>
      <Text> {reason || "Violating the TOS"}</Text>
      <Text opacity={0.6}> until</Text>
      <Text> {expire ? formatTimestamp(expire) : "never"}</Text>
    </>
  )
}