import RouterEndpoints from "@/common/RouterEndpoints";
import { createEffect, createSignal } from "solid-js";
import { useNavigate } from "solid-navigator";
import useStore from "./store/useStore";
import {
  joinPublicServer,
  joinServerByInviteCode,
} from "./services/ServerService";

export const useJoinServer = () => {
  const [serverId, setServerId] = createSignal<string | null>(null);
  const [joining, setJoining] = createSignal(false);

  const navigate = useNavigate();
  const store = useStore();

  const cachedServer = () => {
    return store.servers.get(serverId()!);
  };

  createEffect(() => {
    if (joining() && cachedServer()) {
      navigate(
        RouterEndpoints.SERVER_MESSAGES(
          cachedServer()!.id,
          cachedServer()!._count?.welcomeQuestions
            ? "welcome"
            : cachedServer()!.defaultChannelId
        )
      );
    }
  });

  const joinByInviteCode = async (code: string, serverId: string) => {
    if (joining()) return;
    setServerId(serverId);
    setJoining(true);

    await joinServerByInviteCode(code).catch((err) => {
      alert(err.message);
      setJoining(false);
    });
  };
  const joinPublicById = async (serverId: string) => {
    if (joining()) return;
    setServerId(serverId);
    setJoining(true);

    await joinPublicServer(serverId).catch((err) => {
      alert(err.message);
      setJoining(false);
    });
  };

  return { joining, joinPublicById, joinByInviteCode };
};
