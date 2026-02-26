import { getStorageObject, StorageKeys } from "./localStorage";
import { localRPC } from "./LocalRPC";
import { t } from "@nerimity/i18lite";

const LASTFM_APP_ID = "lastfm-activity-tracker";
const POLL_INTERVAL_MS = 15000;

let pollIntervalId: ReturnType<typeof setInterval> | null = null;
let lastTrackKey: string | null = null;

interface LastFmImage {
  "#text": string;
  size: string;
}

interface LastFmTrack {
  name: string;
  artist: { "#text": string };
  album: { "#text": string };
  image: LastFmImage[];
  url: string;
  "@attr"?: { nowplaying: string };
}

interface LastFmResponse {
  recenttracks?: {
    track: LastFmTrack[];
  };
  error?: number;
  message?: string;
}

async function fetchNowPlaying(username: string, apiKey: string): Promise<void> {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(username)}&api_key=${encodeURIComponent(apiKey)}&format=json&limit=1`;
    const response = await fetch(url);
    if (!response.ok) return;

    const data: LastFmResponse = await response.json();

    const PERMANENT_ERRORS = new Set([6, 10, 13]); // invalid user, invalid key, invalid method
    if (data.error) {
      if (PERMANENT_ERRORS.has(data.error)) {
        localRPC.updateRPC(LASTFM_APP_ID);
        lastTrackKey = null;
      }
      // transient errors (e.g., rate limit) preserve existing activity
      return;
    }
    if (!data.recenttracks?.track?.length) {
      localRPC.updateRPC(LASTFM_APP_ID);
      lastTrackKey = null;
      return;
    }

    const track = data.recenttracks.track[0];
    if (!track) return;

    const isNowPlaying = track["@attr"]?.nowplaying === "true";

    if (!isNowPlaying) {
      localRPC.updateRPC(LASTFM_APP_ID);
      lastTrackKey = null;
      return;
    }

    const trackKey = `${track.name}::${track.artist["#text"]}`;
    if (trackKey === lastTrackKey) return;
    lastTrackKey = trackKey;

    const imgSrc =
      track.image.find((i) => i.size === "extralarge")?.["#text"] ||
      track.image.find((i) => i.size === "large")?.["#text"] ||
      undefined;

    localRPC.updateRPC(LASTFM_APP_ID, {
      action: t("activityNames.listening"),
      name: "Last.fm",
      title: track.name,
      subtitle: track.artist["#text"],
      imgSrc: imgSrc || undefined,
      link: track.url || undefined,
      startedAt: Date.now(),
    });
  } catch {
    // Network error => we will keep the exisitng activity
  }
}

export const useLastFmActivityTracker = () => {
  const start = () => {
    const { username, apiKey } = getStorageObject(StorageKeys.LASTFM, { username: "", apiKey: ""});
    if (!username || !apiKey) return;
    if (pollIntervalId !== null) return;

    fetchNowPlaying(username, apiKey);
    pollIntervalId = setInterval(() => {
      fetchNowPlaying(username, apiKey);
    }, POLL_INTERVAL_MS);
  };

  const restart = () => {
    if (pollIntervalId !== null) {
      clearInterval(pollIntervalId);
      pollIntervalId = null;
    }
    lastTrackKey = null;
    localRPC.updateRPC(LASTFM_APP_ID);
    start();
  };

  return { start, restart };
}
