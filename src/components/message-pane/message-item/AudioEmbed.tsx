import styles from "./styles.module.scss";
import { AttachmentProviders, RawAttachment } from "@/chat-api/RawData";
import { classNames, conditionalClass } from "@/common/classNames";
import { millisecondsToHhMmSs } from "@/common/date";
import {
  getFile,
  googleApiInitialized,
  initializeGoogleDrive,
} from "@/common/driveAPI";
import { electronWindowAPI } from "@/common/Electron";
import env from "@/common/env";
import { prettyBytes } from "@/common/prettyBytes";
import { reactNativeAPI, useReactNativeEvent } from "@/common/ReactNative";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/icon/Icon";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import {
  createEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";

export const LocalAudioEmbed = (props: { attachment: RawAttachment }) => {
  const isExpired = () => {
    return props.attachment.expireAt && Date.now() > props.attachment.expireAt;
  };
  return (
    <AudioEmbed
      error={isExpired() ? "File expired." : undefined}
      file={{
        name: props.attachment.path?.split("/").reverse()[0]!,
        size: props.attachment.filesize!,
        url: env.NERIMITY_CDN + props.attachment.path!,
        expireAt: props.attachment.expireAt,
        provider: "local",
      }}
    />
  );
};

export const GoogleDriveAudioEmbed = (props: { attachment: RawAttachment }) => {
  const [file, setFile] = createSignal<gapi.client.drive.File | null>(null);
  const [error, setError] = createSignal<string | undefined>();

  onMount(async () => {
    await initializeGoogleDrive();
  });

  createEffect(async () => {
    if (!googleApiInitialized()) return;
    const file = await getFile(
      props.attachment.fileId!,
      "name, size, modifiedTime, webContentLink, mimeType",
    ).catch((e) => console.log(e));

    if (!file) return setError("Could not get file.");

    if (file.mimeType !== props.attachment.mime)
      return setError("File was modified.");

    const fileTime = new Date(file.modifiedTime!).getTime();
    const diff = fileTime - (props.attachment?.createdAt || 0);
    if (diff >= 5000) return setError("File was modified.");
    setFile(file);
  });

  return (
    <AudioEmbed
      error={error()}
      file={
        file()
          ? {
              url: file()!.webContentLink!,
              provider: "google_drive",
              name: file()!.name!,
              size: parseInt(file()!.size! || "0"),
            }
          : undefined
      }
    />
  );
};

export const AudioEmbed = (props: {
  file?: {
    url: string;
    name: string;
    size: number;
    expireAt?: number;
    provider: AttachmentProviders;
  };
  error?: string;
}) => {
  const audio = useAudio();
  let progressBarRef: HTMLDivElement | undefined;

  const [speed, setSpeed] = createSignal(1);
  const speedOptions = [0.75, 1, 1.25, 1.5, 2];

  const cycleSpeed = () => {
    const current = speed();
    const next =
      speedOptions[(speedOptions.indexOf(current) + 1) % speedOptions.length];
    setSpeed(next);
    audio.setPlaybackRate(next);
  };

  const statusIcon = () => {
    if (audio.state() === "STOPPED" || audio.state() === "PAUSED")
      return "play_arrow";
    if (audio.state() === "PLAYING") return "pause";
    if (audio.state() === "LOADING") return "hourglass_top";
  };

  const onProgressClick = (event: MouseEvent) => {
    if (!progressBarRef) return;
    const rect = progressBarRef.getBoundingClientRect();
    const mouseX = event.clientX - rect.x;
    const percent = mouseX / rect.width;
    audio.seek(percent * audio.duration());
  };

  const onPlayClick = () => {
    if (props.file?.provider === "google_drive") {
      if (
        !electronWindowAPI()?.isElectron &&
        !reactNativeAPI()?.isReactNative
      ) {
        alert(
          "Due to new Google Drive policy, you can only play audio from the Nerimity Desktop App.",
        );
        return;
      }
    }

    if (audio.loaded()) {
      audio.togglePlay();
      return;
    }
    if (props.file?.url) audio.playUrl(props.file.url);
  };

  return (
    <div
      class={classNames(
        styles.fileEmbed,
        styles.audioEmbed,
        conditionalClass(audio.loaded(), styles.preloadedAudio),
      )}
    >
      <div class={styles.innerAudioEmbed}>
        <Show when={!props.file && !props.error}>
          <Skeleton.Item height="100%" width="100%" />
        </Show>

        <Show when={props.error}>
          <Icon name="error" color="var(--alert-color)" size={30} />
          <div class={styles.fileEmbedDetails}>
            <div class={styles.fileEmbedName}>{props.error}</div>
          </div>
          <Button
            iconName="info"
            iconSize={16}
            onClick={() =>
              alert(
                props.file?.expireAt
                  ? "File expired."
                  : "This file was modified or deleted by the creator.",
              )
            }
          />
        </Show>

        <Show when={props.file && !props.error}>
          <Button
            onClick={onPlayClick}
            iconName={statusIcon()}
            color="var(--primary-color)"
            styles={{ "border-radius": "50%" }}
          />
          <div class={styles.fileEmbedDetails}>
            <div class={styles.fileEmbedName}>{props.file?.name}</div>
            <div class={styles.fileEmbedSize}>
              {prettyBytes(props.file?.size! || 0, 0)}
            </div>
          </div>
          <Button
            label={`${speed().toFixed(2)}×`}
            onClick={cycleSpeed}
            styles={{
              "font-size": "0.9em",
              padding: "4px 8px",
              "border-radius": "6px",
              "background-color": "var(--background-secondary)",
            }}
          />
          <Button
            iconName="download"
            onClick={() => window.open(props.file?.url!, "_blank")}
          />
        </Show>
      </div>

      <Show when={audio.loaded()}>
        <div class={styles.audioDetails}>
          <div class={styles.time}>
            <div>
              {millisecondsToHhMmSs(
                isFinite(audio.currentTime()) ? audio.currentTime() * 1000 : 0,
                true,
              )}
            </div>
            <div>
              {millisecondsToHhMmSs(
                isFinite(audio.duration()) ? audio.duration() * 1000 : 0,
                true,
              )}
            </div>
          </div>

          <div
            ref={progressBarRef}
            class={styles.progressBar}
            onClick={onProgressClick}
          >
            <div
              class={styles.progress}
              style={{
                width: `${Math.min(
                  100,
                  (audio.currentTime() / (audio.duration() || 1)) * 100,
                ).toFixed(2)}%`,
              }}
            />
          </div>
        </div>
      </Show>
    </div>
  );
};

type State = "LOADING" | "PLAYING" | "PAUSED" | "STOPPED";

function useAudio() {
  const [url, setUrl] = createSignal<string | null>(null);
  const [state, setState] = createSignal<State>("STOPPED");
  const [duration, setDuration] = createSignal(0);
  const [currentTime, setCurrentTime] = createSignal(0);
  const [loaded, setLoaded] = createSignal(false);
  const [playbackRate, setPlaybackRate] = createSignal(1);
  const isReactNative = reactNativeAPI()?.isReactNative;

  let audio: HTMLAudioElement | null = null;
  let progressInterval: number | undefined;

  const createAudio = () => {
    if (audio) return audio;
    audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.playbackRate = playbackRate();

    audio.onloadedmetadata = () => {
      const updateDuration = () => {
        if (isFinite(audio!.duration) && !isNaN(audio!.duration)) {
          setDuration(audio!.duration);
          clearInterval(intervalCheck);
        }
      };
      const intervalCheck = setInterval(updateDuration, 100);
      updateDuration();

      setLoaded(true);
      setCurrentTime(0);
      setState("PLAYING");
    };

    audio.ontimeupdate = () => {
      if (!isReactNative) setCurrentTime(audio!.currentTime);
    };

    audio.onended = () => setState("STOPPED");
    return audio;
  };

  const reset = () => {
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    setLoaded(false);
    setState("STOPPED");
    setDuration(0);
    setCurrentTime(0);
  };

  const playUrl = (u: string) => {
    reset();
    const el = createAudio();
    setUrl(u);
    setState("LOADING");

    el.src = u;
    el.load();

    el.oncanplaythrough = () => {
      el.play()
        .then(() => setState("PLAYING"))
        .catch((err) => {
          console.error("Audio play error:", err);
          setState("STOPPED");
        });
    };
  };

  const togglePlay = () => {
    if (!audio) return;
    if (state() === "PLAYING") {
      audio.pause();
      setState("PAUSED");
    } else {
      if (audio.currentTime >= duration()) audio.currentTime = 0;
      audio.play();
      setState("PLAYING");
    }
  };

  const seek = (time: number) => {
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const setPlaybackRateSafe = (rate: number) => {
    setPlaybackRate(rate);
    if (audio && !isReactNative) audio.playbackRate = rate;
  };

  createEffect(() => {
    if (state() === "PLAYING") {
      progressInterval = window.setInterval(() => {
        if (audio) setCurrentTime(audio.currentTime);
      }, 250);
    } else if (progressInterval) {
      window.clearInterval(progressInterval);
    }
    onCleanup(() => {
      if (progressInterval) window.clearInterval(progressInterval);
    });
  });

  onCleanup(reset);

  return {
    url,
    state,
    seek,
    loaded,
    playUrl,
    duration,
    togglePlay,
    currentTime,
    setPlaybackRate: setPlaybackRateSafe,
  };
}
