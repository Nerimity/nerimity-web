import { createServer } from "@/chat-api/services/ServerService";
import RouterEndpoints from "@/common/RouterEndpoints";
import { createContext, createSignal, JSXElement, useContext } from "solid-js";
import { useNavigate } from "solid-navigator";
import { t } from "@nerimity/i18lite";

const useController = (close: () => void) => {
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal({ message: "", path: "" });
  const [name, setName] = createSignal("");
  const navigate = useNavigate();

  const [tab, setTab] = createSignal<"CREATE" | "JOIN">("CREATE");

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
        close();
      }
      setRequestSent(false);
    }, 1000);
  };

  const onJoinClick = async (event: MouseEvent) => {
    if (!name().trim()) {
      event.stopPropagation();
      event.preventDefault();
      setError({
        message: t("joinServerModal.missingInvite"),
        path: "name",
      });
      return;
    }
    close();
  };
  return {
    onCreateClick,
    onJoinClick,
    name,
    error,
    setName,
    requestSent,
    tab,
    setTab,
  };
};
const Context = createContext<ReturnType<typeof useController>>();

export const AddServerModalProvider = (props: {
  children: JSXElement;
  close: () => void;
}) => {
  const controller = useController(props.close);
  return (
    <Context.Provider value={controller}>{props.children}</Context.Provider>
  );
};

export const useAddServerModalController = () => {
  const context = useContext(Context);
  if (!context) {
    throw new Error(
      "useAddServerModalController must be used within CreateServerModalProvider"
    );
  }
  return context;
};
