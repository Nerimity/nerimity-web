import styles from "./EmojiPicker.module.scss";
import env from "@/common/env";
import {
  Category,
  CustomEmoji,
  EmojiPicker as EmojiPickerComponent,
} from "@nerimity/solid-emoji-picker";
import { css, styled } from "solid-styled-components";
import Avatar from "../Avatar";
import {
  For,
  JSX,
  JSXElement,
  Show,
  createEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
} from "solid-js";
import useStore from "@/chat-api/store/useStore";
import { useWindowProperties } from "@/common/useWindowProperties";
import emojis from "@/emoji/emojis.json";
import { useResizeObserver } from "@/common/useResizeObserver";
import Button from "../Button";
import {
  TenorCategory,
  TenorImage,
  getTenorCategories,
  getTenorImages,
} from "@/chat-api/services/TenorService";
import { Skeleton } from "../skeleton/Skeleton";
import { useParams } from "solid-navigator";

const [gifPickerSearch, setGifPickerSearch] = createSignal("");

export function EmojiPicker(props: {
  gifPicked?: (gif: TenorImage) => void;
  showGifPicker?: boolean;
  heightOffset?: number;
  close: () => void;
  onClick: (shortcode: string, shiftDown?: boolean) => void;
}) {
  const params = useParams<{ serverId?: string }>();
  const { servers } = useStore();
  const { paneWidth, width, height, isMobileAgent } = useWindowProperties();
  const [shiftDown, setShiftDown] = createSignal(false);

  const [selectedTab, setSelectedTab] = createSignal<"EMOJI" | "GIF">("EMOJI");

  onMount(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    onCleanup(() => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    });
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Shift") setShiftDown(true);
  };
  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === "Shift") setShiftDown(false);
  };

  const handleClickOutside = (e: MouseEvent & { target: any }) => {
    if (e.target.closest(`.${styles.outerEmojiPicker}`)) return;
    if (e.target.closest(".emojiPickerButton")) return;
    props.close();
  };

  createEffect(on(width, props.close, { defer: true }));

  const customEmojis = () => {
    return servers
      .emojisUpdatedDupName()
      .map((e) => {
        const server = servers.get(e.serverId!)!;
        const url = server.avatarUrl();
        return {
          id: e.id,
          category: {
            id: e.serverId,
            name: server.name,
            url: url,
            customElement: url
              ? undefined
              : (size) =>
                  Avatar({ size, server: { ...server, verified: false } }),
          },
          name: e.name,
          url: `${env.NERIMITY_CDN}emojis/${e.id}.${
            e.gif ? "gif" : "webp"
          }?size=60`,
        };
      })
      .sort((a, b) =>
        a.category.id === params.serverId
          ? -1
          : b.category.id === params.serverId
          ? 1
          : 0
      ) as CustomEmoji[];
  };

  const emojiPickerWidth = () => {
    if (paneWidth()! < 340) {
      return { row: 4, width: 280 };
    }
    if (paneWidth()! < 360) {
      return { row: 5, width: 320 };
    }
    if (paneWidth()! < 420) {
      return { row: 6, width: 355 };
    }
    if (paneWidth()! < 470) {
      return { row: 7, width: 400 };
    }
    return { row: 8, width: 430 };
  };

  return (
    <div
      class={styles.outerEmojiPicker}
      style={{
        width: emojiPickerWidth().width + "px",
        height: height() + (props.heightOffset || 0) + "px",
      }}
    >
      <Show when={selectedTab() === "EMOJI"}>
        <EmojiPickerComponent
          class={styles.emojiPicker}
          focusOnMount={!isMobileAgent()}
          spriteUrl="/assets/emojiSprites.png?cache=1"
          emojis={emojis}
          customEmojis={customEmojis()}
          onEmojiClick={(e: any) =>
            props.onClick(e.name || e.short_names[0], shiftDown())
          }
          primaryColor="var(--primary-color)"
          maxRecent={20}
          maxRow={emojiPickerWidth()?.row}
        />
      </Show>
      <Show when={selectedTab() === "GIF"}>
        <GifPicker gifPicked={props.gifPicked} />
      </Show>
      <Show when={props.showGifPicker}>
        <div class={styles.tabs}>
          <Show when={gifPickerSearch().trim()}>
            <Button
              styles={{ "margin-right": "auto", "margin-left": "6px" }}
              iconName="arrow_back"
              margin={0}
              onClick={() => setGifPickerSearch("")}
            />
          </Show>
          <Button
            iconName="gif"
            margin={0}
            primary={selectedTab() === "GIF"}
            onClick={() => setSelectedTab("GIF")}
          />
          <Button
            iconName="face"
            margin={0}
            primary={selectedTab() === "EMOJI"}
            onClick={() => setSelectedTab("EMOJI")}
          />
        </div>
      </Show>
    </div>
  );
}

const GifPicker = (props: { gifPicked?: (gif: TenorImage) => void }) => {
  let scrollElementRef: HTMLDivElement | undefined;

  onCleanup(() => {
    setGifPickerSearch("");
  });

  createEffect(
    on(gifPickerSearch, () => {
      scrollElementRef?.scrollTo(0, 0);
    })
  );

  return (
    <div class={styles.gifPickerContainer} ref={scrollElementRef}>
      <GifPickerSearchBar />
      <Show when={gifPickerSearch().trim()}>
        <GifPickerImages
          gifPicked={props.gifPicked}
          query={gifPickerSearch().trim()}
        />
      </Show>
      <GifPickerCategories
        hide={!!gifPickerSearch().trim()}
        onPick={(c) => setGifPickerSearch(c.searchterm)}
      />
    </div>
  );
};

const GifPickerSearchBar = () => {
  const { isMobileAgent } = useWindowProperties();

  let inputRef: HTMLInputElement | undefined;
  let timeout: null | number = null;
  const onInput = (e: InputEvent) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(() => {
      setGifPickerSearch((e.target as HTMLInputElement).value);
      timeout = null;
    }, 350);
  };

  onMount(() => {
    if (!isMobileAgent()) {
      inputRef?.focus();
    }
  });

  return (
    <div class={styles.gifPickerSearchBar}>
      <input
        ref={inputRef}
        placeholder="Search GIFs"
        value={gifPickerSearch()}
        onInput={onInput}
      />
    </div>
  );
};

const GifPickerImages = (props: {
  query: string;
  gifPicked?: (gif: TenorImage) => void;
}) => {
  const [gifs, setGifs] = createSignal<TenorImage[] | null>(null);
  createEffect(
    on(
      () => props.query,
      () => {
        setGifs(null);
        getTenorImages(props.query).then(setGifs);
      }
    )
  );

  return (
    <div class={styles.gifPickerCategories}>
      <Show when={!gifs()}>
        <GifItemSkeleton />
      </Show>
      <For each={gifs()}>
        {(gif) => (
          <GifPickerImageItem
            url={gif.previewUrl}
            onClick={() => props.gifPicked?.(gif)}
          />
        )}
      </For>
      <div class={styles.gap} />
    </div>
  );
};

const GifPickerImageItem = (props: { url: string; onClick?: () => void }) => {
  return (
    <div class={styles.gifCategoryItem} tabIndex={0}>
      <img
        class={styles.image}
        src={props.url}
        loading="lazy"
        onClick={props.onClick}
      />
    </div>
  );
};

const GifPickerCategories = (props: {
  hide?: boolean;
  onPick: (category: TenorCategory) => void;
}) => {
  const [categories, setCategories] = createSignal<TenorCategory[]>([]);
  onMount(() => {
    getTenorCategories().then(setCategories);
  });

  return (
    <div
      class={styles.gifPickerCategories}
      style={{ display: props.hide ? "none" : "flex" }}
    >
      <Show when={!categories().length}>
        <GifItemSkeleton />
      </Show>
      <For each={categories()}>
        {(category) => (
          <GifCategoryItem
            category={category}
            onClick={() => props.onPick(category)}
          />
        )}
      </For>
      <div class={styles.gap} />
    </div>
  );
};

function GifItemSkeleton() {
  return (
    <Skeleton.List
      count={20}
      style={{ width: "100%", "flex-wrap": "wrap", "flex-direction": "row" }}
    >
      <Skeleton.Item height="100px" width="calc(50% - 5px)" />
    </Skeleton.List>
  );
}

const GifCategoryItem = (props: {
  category: TenorCategory;
  onClick?: () => void;
}) => {
  return (
    <div class={styles.gifCategoryItem} tabIndex={0} onClick={props.onClick}>
      <img
        class={styles.image}
        src={props.category.image}
        alt={props.category.searchterm}
        loading="lazy"
      />
      <div class={styles.name}>{props.category.searchterm}</div>
    </div>
  );
};

export const FloatingEmojiPicker = (props: {
  x: number;
  y: number;
  close: () => void;
  onClick: (shortcode: string) => void;
}) => {
  const onPick = (shortcode: string, shiftDown?: boolean) => {
    props.onClick(shortcode);
    if (!shiftDown) props.close();
  };

  return (
    <FloatingInScreen close={props.close} x={props.x} y={props.y}>
      <EmojiPicker onClick={onPick} close={props.close} />
    </FloatingInScreen>
  );
};

const FloatingInScreenBGContainer = styled("div")`
  position: absolute;
  inset: 0;
  overflow: hidden;
`;
const FloatingContainer = styled("div")`
  position: absolute;
`;

const FloatingInScreen = (props: {
  close(): void;
  children: JSXElement;
  x: number;
  y: number;
}) => {
  let floatingElementRef: undefined | HTMLDivElement;

  const { isMobileAgent } = useWindowProperties();
  const { width, height } = useResizeObserver(() => floatingElementRef);

  const styles = () => {
    const _styles: JSX.CSSProperties = {};

    if (isMobileAgent()) {
      return {
        bottom: "0",
        right: "0",
      };
    }

    _styles.top = props.y + "px";
    _styles.left = props.x + "px";

    // move to the left if it's off the screen.
    if (props.x + width() > window.innerWidth) {
      _styles.left = window.innerWidth - width() + "px";
    }

    // move to the top if it's off the screen.
    if (props.y + height() > window.innerHeight) {
      _styles.top = window.innerHeight - height() + "px";
    }
    return _styles;
  };

  const onMouseDown = (event: any) => {
    if (!event.target.classList.contains("floatingInScreenBGContainer")) return;
    props.close();
  };

  return (
    <FloatingInScreenBGContainer
      class="floatingInScreenBGContainer"
      onClick={onMouseDown}
    >
      <FloatingContainer ref={floatingElementRef} style={styles()}>
        {props.children}
      </FloatingContainer>
    </FloatingInScreenBGContainer>
  );
};
