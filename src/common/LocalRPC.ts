import { RPC } from "./Electron";

export class LocalRPC {
  onUpdateRPC: (data: RPC[]) => void = () => {};

  RPCs: { data: RPC; id: string }[] = [];
  discordRPCs: { data: RPC; id: string }[] = [];
  electronRPCs: { data: RPC; id: string }[] = [];

  constructor() {
    window.addEventListener(
      "message",
      (ev) => {
        const payload = ev.data;
        const id = payload.id;
        if (payload.name === "UPDATE_RPC") {
          this.updateRPC(id, payload.data);
        }
      },
      true
    );
  }
  start() {
    window.parent.postMessage({ name: "NERIMITY_READY" }, "*");
  }
  emitEvent() {
    const RPCs = this.RPCs.map((rpc) => rpc.data);
    const electronRPCs = this.electronRPCs.map((rpc) => rpc.data);
    const discordRPCs = this.discordRPCs.map((rpc) => rpc.data);
    this.onUpdateRPC([...electronRPCs, ...discordRPCs, ...RPCs]);
  }

  updateElectronRPCs(data: { id: string; data: RPC }[]) {
    this.electronRPCs = data;
    this.emitEvent();
  }
  updateDiscordRPCs(data: { id: string; data: RPC }[]) {
    this.discordRPCs = data;
    this.emitEvent();
  }
  updateRPC(id: string, data?: RPC) {
    if (!data) return this.removeRPC(id);

    const index = this.RPCs.findIndex((rpc) => rpc.id === id);
    if (index === -1) {
      this.RPCs.push({
        id,
        data: sanitizedData(data)
      });
      this.emitEvent();
      return;
    }

    if (JSONCompare(this.RPCs?.[index]?.data, sanitizedData(data))) {
      return;
    }
    this.RPCs[index]!.data = sanitizedData(data);
    this.emitEvent();
  }
  removeRPC(id: string) {
    const index = this.RPCs.findIndex((rpc) => rpc.id === id);
    if (index === -1) {
      return;
    }
    this.RPCs.splice(index, 1);
    this.emitEvent();
  }
}

function JSONCompare(a?: Record<any, any>, b?: Record<any, any>) {
  return JSON.stringify(a) === JSON.stringify(b);
}

const sanitizedData = (data: any) => {
  // name: "Spotify",
  // action: "Listening to",
  // imgSrc: data.art,
  // title: data.title,
  // subtitle: data.subtitle
  // startedAt: data.startedAt
  return JSON.parse(
    JSON.stringify({
      name: data.name,
      action: data.action,
      imgSrc: data.imgSrc,
      title: data.title,
      subtitle: data.subtitle,
      link: data.link,
      startedAt: data.startedAt,
      endsAt: data.endsAt,
      speed: data.speed,
      updatedAt: data.updatedAt,
      emoji: data.emoji
    })
  );
};

export const localRPC = new LocalRPC();
