import RouterEndpoints from "@/common/RouterEndpoints";
import { createEffect, createSignal } from "solid-js";
import { useNavigate } from "solid-navigator";
import useStore from "./store/useStore";
import { toast } from "@/components/ui/custom-portal/CustomPortal";
import {
  joinPublicServer,
  joinServerByInviteCode
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
    const hasJoined = joining() && cachedServer();
    if (!hasJoined) return;

    cachedServer()?.update({
      joinedThisSession: true
    });

    const hasWelcomeQuestions = cachedServer()!._count?.welcomeQuestions;
    const defaultChannelId = cachedServer()!.defaultChannelId;

    const route = RouterEndpoints.SERVER_MESSAGES(
      cachedServer()!.id,
      hasWelcomeQuestions ? "welcome" : defaultChannelId!
    );

    navigate(route);
  });

  const joinByInviteCode = async (code: string, serverId: string) => {
    if (joining()) return;
    setServerId(serverId);
    setJoining(true);

    await joinServerByInviteCode(code).catch((err) => {
      toast(err.message);
      setJoining(false);
    });
  };
  const joinPublicById = async (serverId: string) => {
    if (joining()) return;
    setServerId(serverId);
    setJoining(true);

    await joinPublicServer(serverId).catch((err) => {
      toast(err.message);
      setJoining(false);
    });
  };

  return { joining, joinPublicById, joinByInviteCode };
};
