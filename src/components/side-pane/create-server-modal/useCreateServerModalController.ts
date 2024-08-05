import { createServer } from "@/chat-api/services/ServerService";
import RouterEndpoints from "@/common/RouterEndpoints";
import { createSignal } from "solid-js";
import { useNavigate } from "solid-navigator";

export function useCreateServerModalController(props: { close: () => void }) {
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal({ message: "", path: "" });
  const [name, setName] = createSignal("");
  const navigate = useNavigate();

  const onCreateClick = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError({ message: "", path: "" });

    const server = await createServer(name()).catch((err) => {
      setError(err);
      setRequestSent(false);
    });
    setTimeout(() => {
      if (server) {
        navigate(
          RouterEndpoints.SERVER_MESSAGES(server.id, server.defaultChannelId)
        );
        props.close();
      }
      setRequestSent(false);
    }, 1000);
  };

  return {
    onCreateClick,
    name,
    error,
    setName,
    requestSent,
  };
}
