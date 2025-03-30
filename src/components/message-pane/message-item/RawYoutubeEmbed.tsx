import styles from "./styles.module.scss";
import { RawEmbed } from "@/chat-api/RawData";
import Icon from "@/components/ui/icon/Icon";
import { createSignal, JSX, Show } from "solid-js";
export const RawYoutubeEmbed = (props: {
  code: string;
  embed: RawEmbed;
  shorts: boolean;
  style?: JSX.CSSProperties
}) => {
  const [playVideo, setPlayVideo] = createSignal<boolean>(false);

  const thumbnailUrl = () => {
    return `https://i.ytimg.com/vi/${props.code}/maxresdefault.jpg`;
  };

  return (
    <div class={styles.youtubeEmbed}>
      <div class={styles.video} style={props.style}>
        <Show when={!playVideo()}>
          <img
            style={{ width: "100%", height: "100%", "object-fit": "cover" }}
            src={thumbnailUrl()}
          />
          <div
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              setPlayVideo(!playVideo());
            }}
            class={styles.playButtonContainer}
          >
            <div class={styles.playButton}>
              <Icon name="play_arrow" color="var(--primary-color)" size={28} />
            </div>
          </div>
        </Show>
        <Show when={playVideo()}>
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube-nocookie.com/embed/${props.code}?autoplay=1`}
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          />
        </Show>
      </div>
      <div class={styles.youtubeEmbedDetails}>
        <div class={styles.title}>{props.embed.title}</div>
        <div class={styles.info}>
          {props.embed.channelName} •{" "}
          <span class={styles.date}>{props.embed.uploadDate}</span>
        </div>
        <div class={styles.description}>{props.embed.description}</div>
      </div>
    </div>
  );
};
