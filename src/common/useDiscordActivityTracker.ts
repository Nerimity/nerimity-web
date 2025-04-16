import { createSignal } from "solid-js";
import {
  getStorageString,
  setStorageString,
  StorageKeys,
} from "./localStorage";
import { localRPC } from "./LocalRPC";

const URL = "https://supertiger.nerimity.com/trackdispresence";
const NERIMITY_APP_ID = "1630300334100500480";

let ws: WebSocket | null = null;

interface FormattedPresence {
  status: string;
  activities: FormattedActivity[];
}
export interface FormattedActivity {
  name: string;
  createdTimestamp: number | null;
  details: string | null;
  state: string | null;
  syncId: string | null;
  url?: string | null;
  type: number;
  assets?: {
    largeText?: string | null;
    smallText?: string | null;
    largeImageUrl: string | null;
    smallImageUrl: string | null;
    largeImage?: string | null;
    smallImage?: string | null;
  };
  timestamps?: {
    start: number | null;
    end: number | null;
  } | null;
}

const ActivityType = {
  PLAYING: 0,
  STREAMING: 1,
  LISTENING: 2,
  WATCHING: 3,
  CUSTOM: 4,
  COMPETING: 5,
};
const ActivityTypeToNameAndAction = (activity: FormattedActivity) => {
  switch (activity.type) {
    case ActivityType.PLAYING:
      return { name: activity.name || "Unknown", action: "Playing" };
    case ActivityType.STREAMING:
      return { name: activity.name || "Unknown", action: "Streaming" };
    case ActivityType.LISTENING:
      return { name: activity.name || "Unknown", action: "Listening to" };
    case ActivityType.WATCHING:
      return { name: activity.name || "Unknown", action: "Watching" };
    case ActivityType.CUSTOM:
      return { name: activity.state || "Unknown", action: "Custom" };
    case ActivityType.COMPETING:
      return { name: activity.name || "Unknown", action: "Competing in" };
    default:
      return { name: activity.name || "Unknown", action: "Playing" };
  }
};
export const useDiscordActivityTracker = () => {
  let intervalId: NodeJS.Timeout;

  const start = () => {
    const userId = getStorageString(StorageKeys.DISCORD_USER_ID, "");
    if (!userId) return;
    if (ws) return;
    clearInterval(intervalId);
    ws = new WebSocket(URL + "/" + userId);
    ws.onopen = () => {
      console.log("discord activity tracker connected");
      startPingInterval();
    };
    ws.onmessage = (event) => {
      const rawData = event.data;
      const data = JSON.parse(rawData as string);
      if (data.error) {
        console.error(data.error);
        setStorageString(StorageKeys.DISCORD_USER_ID, "");
        return;
      }
      const activity = (data.activities as FormattedActivity[]).sort((a, b) => {
        const isASpotify = !!a.assets?.largeImage?.startsWith("spotify:");
        const isBSpotify = !!b.assets?.largeImage?.startsWith("spotify:");

        // Ensure Spotify activities are placed at the end of the list
        if (isASpotify && !isBSpotify) {
          return 1; // a comes after b
        }
        if (!isASpotify && isBSpotify) {
          return -1; // a comes before b
        }

        // If neither or both are Spotify, maintain the original order (or add another sorting criteria)
        return 0;
      })[0];
      if (!activity) {
        localRPC.updateRPC(NERIMITY_APP_ID);
        return;
      }
      let url = undefined;

      const isSpotify = !!activity.assets?.largeImage?.startsWith("spotify:");

      if (isSpotify && activity.syncId) {
        url = `https://open.spotify.com/track/${activity.syncId}`;
      }

      console.log(`Activity Update: ${activity?.name || null}`);
      localRPC.updateRPC(NERIMITY_APP_ID, {
        startedAt: activity.timestamps?.start || undefined,
        endsAt: activity.timestamps?.end || undefined,
        imgSrc:
          activity.assets?.largeImageUrl ||
          activity.assets?.smallImageUrl ||
          undefined,
        title: activity.details || undefined,
        subtitle: activity.state || undefined,
        link: url || activity.url,
        ...ActivityTypeToNameAndAction(activity),
      });
    };
    ws.onclose = () => {
      localRPC.updateRPC(NERIMITY_APP_ID);
      clearInterval(intervalId);
      setTimeout(() => {
        restart();
      }, 5000);
    };
  };

  const startPingInterval = () => {
    intervalId = setInterval(() => {
      ws?.send("ping");
    }, 30000);
  };

  const restart = () => {
    localRPC.updateRPC(NERIMITY_APP_ID);
    clearInterval(intervalId);
    if (ws) ws.close();
    ws = null;
    start();
  };
  return { start, restart };
};
