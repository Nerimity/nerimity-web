import { batch } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { RawServerRole } from "../RawData";
import useServers from "./useServers";
import { convertShorthandToLinearGradient } from "@/common/color";

export type ServerRole = RawServerRole & {
  gradient?: string;
};

// serverRoles[serverId][roleId] = Role
const [serverRoles, setServerRoles] = createStore<
  Record<string, Record<string, ServerRole | undefined> | undefined>
>({});

const set = (serverId: string, _role: RawServerRole) => {
  const role: ServerRole = { ..._role };

  if (role.hexColor.startsWith("lg")) {
    const [converted] = convertShorthandToLinearGradient(role.hexColor);
    if (converted) {
      role.hexColor = converted.colors[0]!;
      role.gradient = converted.gradient;
    }
  }

  if (!serverRoles[serverId]) {
    setServerRoles(serverId, {});
  }
  setServerRoles(serverId, role.id, reconcile(role));
};

const update = (
  serverId: string,
  roleId: string,
  update: Partial<RawServerRole>
) => {
  if (!serverRoles[serverId]?.[roleId]) {
    return;
  }

  batch(() => {
    setServerRoles(serverId, roleId, update);

    if (update.hexColor === null) {
      setServerRoles(serverId, roleId, {
        gradient: undefined,
        hexColor: undefined,
      });
    }

    if (update?.hexColor) {
      setServerRoles(serverId, roleId, "gradient", undefined);
      if (update?.hexColor?.startsWith("lg")) {
        const [converted] = convertShorthandToLinearGradient(update.hexColor);
        if (converted) {
          setServerRoles(serverId, roleId, {
            hexColor: converted.colors[0]!,
            gradient: converted.gradient,
          });
        }
      }
    }
  });
};

const addNewRole = (serverId: string, role: RawServerRole) => {
  const servers = useServers();
  const server = servers.get(serverId);

  const roles = getAllByServerId(serverId);

  batch(() => {
    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      const newOrder = roles.length - i;
      if (server?.defaultRoleId === role?.id) continue;
      setServerRoles(serverId, role?.id!, "order", newOrder + 1);
    }
    set(serverId, role);
  });
};

const getAllByServerId = (serverId: string) => {
  return Object.values(serverRoles[serverId] || {}).sort(
    (a, b) => b!.order - a!.order
  );
};

const get = (serverId: string, roleId: string) =>
  serverRoles[serverId]?.[roleId];

const deleteAllByServerId = (serverId: string) => {
  setServerRoles(serverId, undefined);
};

const deleteRole = (serverId: string, roleId: string) => {
  setServerRoles(serverId, roleId, undefined);
  const serverRoles = getAllByServerId(serverId);
  batch(() => {
    for (let i = 0; i < serverRoles.length; i++) {
      const role = serverRoles[i];
      const newOrder = serverRoles.length - i;
      setServerRoles(serverId, role?.id!, "order", newOrder);
    }
  });
};

export default function useServerRoles() {
  return {
    set,
    update,
    addNewRole,
    getAllByServerId,
    get,
    deleteRole,
    deleteAllByServerId,
  };
}
