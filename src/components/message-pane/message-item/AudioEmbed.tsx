import styles from "./styles.module.scss";
import { AttachmentProviders, RawAttachment } from "@/chat-api/RawData";
import { classNames, conditionalClass } from "@/common/classNames";
import { formatMillisElapsedDigital } from "@/common/date";
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
import { toast } from "@/components/ui/custom-portal/CustomPortal";
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
import { t } from "@nerimity/i18lite";

export const LocalAudioEmbed = (props: { attachment: RawAttachment }) => {
  const isExpired = () => {
    return props.attachment.expireAt && Date.now() > props.attachment.expireAt;
  };

  const fileName = props.attachment.path
    ? decodeURIComponent(props.attachment.path.split("/").reverse()[0]!)
    : "Unknown";

  return (
    <AudioEmbed
      error={isExpired() ? t("fileEmbed.fileExpired") : undefined}
      file={{
        duration: props.attachment.duration,
        name: fileName,
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
      "name, size, modifiedTime, webContentLink, mimeType"
    ).catch((e) => console.log(e));
    // const file = await getFile(props.attachment.fileId!, "*").catch((e) => console.log(e))
    if (!file) return setError(t("fileEmbed.couldNotGetFile"));

    if (file.mimeType !== props.attachment.mime)
      return setError(t("fileEmbed.fileModified"));

    const fileTime = new Date(file.modifiedTime!).getTime();
    const diff = fileTime - (props.attachment?.createdAt || 0);
    if (diff >= 5000) return setError(t("fileEmbed.fileModified"));
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
    duration?: number;
    expireAt?: number;
    provider: AttachmentProviders;
  };
  error?: string;
}) => {
  const audio = useAudio({durationOverride: (props.file?.duration ? props.file.duration / 1000 : undefined) });

  let progressBarRef: HTMLDivElement | undefined;

  const statusIcon = () => {
    if (audio.state() === "STOPPED") return "play_arrow";
    if (audio.state() === "PAUSED") return "play_arrow";

    if (audio.state() === "PLAYING") return "pause";
    if (audio.state() === "LOADING") return "hourglass_top";
  };

  const onProgressClick = (event: MouseEvent) => {
    if (!progressBarRef) return;

    const rect = progressBarRef.getBoundingClientRect();
    const mouseX = event.clientX - rect.x;

    const percent = mouseX / rect.width;

    // audio.currentTime = percent * audio.duration;
    audio.seek(percent * audio.duration());
  };

  const onPlayClick = () => {
    if (props.file?.provider === "google_drive") {
      if (
        !electronWindowAPI()?.isElectron &&
        !reactNativeAPI()?.isReactNative
      ) {
        toast(t("fileEmbed.audioEmbed.googleDrivePolicy"));
      }
    }
    if (audio.loaded()) {
      audio.togglePlay();
      return;
    }
    audio.playUrl(props.file?.url!);
  };

  return (
    <div
      class={classNames(
        styles.fileEmbed,
        styles.audioEmbed,
        conditionalClass(audio.loaded(), styles.preloadedAudio)
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
              toast(
                props.file?.expireAt
                  ? t("fileEmbed.fileExpired")
                  : t("fileEmbed.modifiedOrDeleted")
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
            iconName="download"
            onClick={() => window.open(props.file?.url!, "_blank")}
          />
        </Show>
      </div>

      <Show when={audio.loaded()}>
        <div class={styles.audioDetails}>
          <div class={styles.time}>
            <div>{formatMillisElapsedDigital(audio.currentTime() * 1000)}</div>
            <div>{formatMillisElapsedDigital(audio.duration() * 1000)}</div>
          </div>

          <div
            ref={progressBarRef}
            class={styles.progressBar}
            onClick={onProgressClick}
          >
            <div
              class={styles.progress}
              style={{
                width: `${(audio.currentTime() / audio.duration()) * 100}%`,
              }}
            />
          </div>
        </div>
      </Show>
    </div>
  );
};

type State = "LOADING" | "PLAYING" | "PAUSED" | "STOPPED";
function useAudio(opts: { durationOverride?: number } = {}) {
  const [url, setUrl] = createSignal<null | string>(null);
  const [state, setState] = createSignal<State>("STOPPED");
  const [duration, setDuration] = createSignal(0);
  const [currentTime, setCurrentTime] = createSignal(0);
  const [loaded, setLoaded] = createSignal(false);

  const isReactNative = reactNativeAPI()?.isReactNative;

  const audio = new Audio();
  audio.crossOrigin = "anonymous";

  audio.onloadedmetadata = () => {
    setLoaded(true);
    setState("PLAYING");
    setDuration(opts.durationOverride ?? audio.duration);
    setCurrentTime(0);
  };
  audio.ontimeupdate = () => {
    if (isReactNative) return;
    setCurrentTime(audio.currentTime);
  };

  audio.onended = () => {
    setState("STOPPED");
  };

  createEffect(
    on(state, (state) => {
      if (!isReactNative) return;
      let interval: number | undefined;

      if (state === "PLAYING") {
        const playedAt = Date.now() - currentTime() * 1000;
        interval = window.setInterval(() => {
          if (currentTime() > duration()) {
            window.clearInterval(interval);
            setState("STOPPED");
            return;
          }
          setCurrentTime((Date.now() - playedAt) / 1000);
        }, 1000);
      }

      onCleanup(() => {
        if (interval) window.clearInterval(interval);
      });
    })
  );

  useReactNativeEvent(["audioLoaded", "audioLoading"], (e) => {
    if (e.type === "audioLoading") {
      if (e.url !== url()) {
        reset({ pauseNative: false });
        return;
      }
      setState("LOADING");
    }
    if (e.type === "audioLoaded" && e.url === url()) {
      setLoaded(true);
      setState("PLAYING");
      setDuration(opts.durationOverride ?? e.duration);
      setCurrentTime(e.position);
    }
  });

  const seek = (time: number) => {
    if (isReactNative) {
      setState("LOADING");
      reactNativeAPI()?.seekAudio(time);
      setCurrentTime(time);
      return;
    }
    audio.currentTime = time;
  };

  const reset = (opts: { pauseNative?: boolean } = {}) => {
    audio.pause();
    setLoaded(false);
    setState("STOPPED");
    setDuration(0);
    setCurrentTime(0);
    if (isReactNative && opts.pauseNative !== false) {
      reactNativeAPI()?.pauseAudio();
    }
  };

  const playUrl = (url: string) => {
    reset();
    setState("LOADING");
    setUrl(url);
    if (isReactNative) {
      reactNativeAPI()?.playAudio(url);
      return;
    }
    audio.src = url;
    audio.play();
  };
  const togglePlay = () => {
    if (state() === "PLAYING") {
      if (isReactNative) {
        reactNativeAPI()?.pauseAudio();
      }
      audio.pause();
      setState("PAUSED");
    } else {
      if (isReactNative) {
        if (currentTime() > duration()) {
          seek(0);
        }
        reactNativeAPI()?.playAudio();
        return;
      }
      audio.play();
      setState("PLAYING");
    }
  };

  onCleanup(() => {
    reset();
  });

  return {
    url,
    state,
    seek,
    loaded,
    playUrl,
    duration,
    togglePlay,
    currentTime,
  };
}
