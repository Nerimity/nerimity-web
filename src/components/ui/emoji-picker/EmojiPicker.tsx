import styles from './EmojiPicker.module.scss'
import env from "@/common/env";
import { Category, CustomEmoji, EmojiPicker as EmojiPickerComponent } from "@nerimity/solid-emoji-picker";
import { css, styled } from "solid-styled-components";
import Avatar from "../Avatar";
import { For, JSX, JSXElement, Show, createEffect, createSignal, on, onCleanup, onMount } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import { useWindowProperties } from "@/common/useWindowProperties";
import emojis from '@/emoji/emojis.json';
import { useResizeObserver } from "@/common/useResizeObserver";
import Button from '../Button';
import { TenorCategory, getTenorCategories } from '@/chat-api/services/TenorService';

export function EmojiPicker(props: { showGifPicker?: boolean; heightOffset?: number; close: () => void; onClick: (shortcode: string) => void }) {
  const { servers } = useStore();
  const { paneWidth, width, height, isMobileAgent } = useWindowProperties()

  const [selectedTab, setSelectedTab] = createSignal<"EMOJI" | "GIF"> ("GIF");

  onMount(() => {
    document.addEventListener("mousedown", handleClickOutside)
    onCleanup(() => {
      document.removeEventListener("mousedown", handleClickOutside)
    })
  })

  const handleClickOutside = (e: MouseEvent & { target: any }) => {
    if (e.target.closest(`.${styles.outerEmojiPicker}`)) return;
    if (e.target.closest(`.emojiPickerButton`)) return;
    props.close();
  }

  createEffect(on(width, props.close, { defer: true }))

  const customEmojis = () => {
    return servers.emojisUpdatedDupName().map(e => {
      const server = servers.get(e.serverId!)!;
      const url = server.avatarUrl();
      return {
        id: e.id,
        category: {
          id: e.serverId,
          name: server.name,
          url: url,
          customElement: url ? undefined : (size) => Avatar({ size, server: { ...server, verified: false } })
        },
        name: e.name,
        url: `${env.NERIMITY_CDN}emojis/${e.id}.${e.gif ? 'gif' : 'webp'}`
      }
    }) as CustomEmoji[]
  }




  const emojiPickerWidth = () => {
    if (paneWidth()! < 340) {
      return { row: 4, width: 280 }
    }
    if (paneWidth()! < 360) {
      return { row: 5, width: 320 }
    }
    if (paneWidth()! < 420) {
      return { row: 6, width: 355 }
    }
    if (paneWidth()! < 470) {
      return { row: 7, width: 400 }
    }
    return { row: 8, width: 430 }
  }

  return (
    <div class={styles.outerEmojiPicker}>
      <Show when={selectedTab() === "EMOJI"}>
        <EmojiPickerComponent
          class={styles.emojiPicker}
          focusOnMount={!isMobileAgent()}
          spriteUrl="/assets/emojiSprites.png"
          emojis={emojis}
          customEmojis={customEmojis()}
          onEmojiClick={(e: any) => props.onClick(e.name || e.short_names[0])}
          primaryColor='var(--primary-color)'
          style={{ width: emojiPickerWidth().width + "px", height: (height() + (props.heightOffset || 0)) + "px" }}
          maxRecent={20}
          maxRow={emojiPickerWidth()?.row}
        />
      </Show>
      <Show when={selectedTab() === "GIF"}>
        <GifPicker
        />
      </Show>
      <Show when={props.showGifPicker}>
        <div class={styles.tabs}>
          <Button iconName='gif' margin={0} primary={selectedTab() === "GIF"} onClick={() => setSelectedTab("GIF")} />
          <Button iconName='face' margin={0} primary={selectedTab() === "EMOJI"} onClick={() => setSelectedTab("EMOJI")} />
        </div>
      </Show>
    </div>
  )
}

const GifPicker = () => {
  const [search, setSearch] = createSignal("");


  return (
    <div class={styles.gifPickerContainer}>
      <GifPickerCategories hide={!!search().trim()} onPick={(c) => setSearch(c.searchterm)} />
    </div> 
  )
}

const GifPickerCategories = (props: {hide?: boolean; onPick: (category: TenorCategory) => void}) => {
  const [categories, setCategories] = createSignal<TenorCategory[]>([]);
  onMount(() => {
    getTenorCategories().then(setCategories);
  })

  return (
    <div class={styles.gifPickerCategories} style={{visibility: props.hide ? "hidden" : "visible"}}>
      <For each={categories()}>
        {category => <GifCategoryItem category={category} onClick={() => props.onPick(category)} />}
      </For>
    </div>
  )
}



const GifCategoryItem = (props: {category: TenorCategory; onClick?: () => void}) => {
  return (
    <div class={styles.gifCategoryItem} tabIndex={0} onClick={props.onClick} >
      <img class={styles.image} src={props.category.image} alt={props.category.searchterm} />
      <div class={styles.name}>{props.category.searchterm}</div>
    </div>
  )
}



export const FloatingEmojiPicker = (props: {x: number, y: number; close: () => void; onClick: (shortcode: string) => void }) => {
  
  const onPick = (shortcode: string) => {
    props.onClick(shortcode);
    props.close();
  }

  return (
    <FloatingInScreen close={props.close} x={props.x} y={props.y}>
      <EmojiPicker onClick={onPick} close={props.close}/>
    </FloatingInScreen>
  )
}




const FloatingInScreenBGContainer = styled("div")`
  position: absolute;
  inset: 0;
  overflow: hidden;
`;
const FloatingContainer = styled("div")`
  position: absolute;
`;


const FloatingInScreen = (props: {close(): void; children: JSXElement, x: number, y: number}) => {
  let floatingElementRef: undefined | HTMLDivElement = undefined;

  const {isMobileAgent} = useWindowProperties();
  const {width, height} = useResizeObserver(() => floatingElementRef)

  const styles = () => {
    let _styles: JSX.CSSProperties = {};

    if (isMobileAgent()) {
      return {
        bottom: 0,
        right: 0,
      }
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
  }

  const onMouseDown = (event: any) => {
    if (!event.target.classList.contains("floatingInScreenBGContainer")) return;
    props.close();
  }

  return (
    <FloatingInScreenBGContainer class="floatingInScreenBGContainer" onClick={onMouseDown}>
      <FloatingContainer ref={floatingElementRef} style={styles()}>
        {props.children}
      </FloatingContainer>
    </FloatingInScreenBGContainer>
  )
}