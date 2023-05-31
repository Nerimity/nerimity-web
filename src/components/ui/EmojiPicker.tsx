import env from "@/common/env";
import { CustomEmoji, EmojiPicker as EmojiPickerComponent } from "@nerimity/solid-emoji-picker";
import { css, styled } from "solid-styled-components";
import Avatar from "./Avatar";
import { JSX, JSXElement, createEffect, on, onCleanup, onMount } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import { useWindowProperties } from "@/common/useWindowProperties";
import emojis from '@/emoji/emojis.json';
import { useResizeObserver } from "@/common/useResizeObserver";

const EmojiPickerStyles = css`
  .categoriesContainer .customEmojiImage,
  .title .customEmojiImage {
    border-radius: 50%;
  }

  max-height: 420px;
  height: 100%;
  border: solid 1px rgba(255, 255, 255, 0.2);
  background-color: rgba(0, 0, 0, 0.7);
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    inset: 0;
    backdrop-filter: blur(20px);
    border-radius: 8px;

  }

`;

export function EmojiPicker(props: { close: () => void; onClick: (shortcode: string) => void }) {
  const { servers } = useStore();
  const { paneWidth, width } = useWindowProperties()
  onMount(() => {
    document.addEventListener("mousedown", handleClickOutside)
    onCleanup(() => {
      document.removeEventListener("mousedown", handleClickOutside)
    })
  })

  const handleClickOutside = (e: MouseEvent & { target: any }) => {
    if (e.target.closest(`.${EmojiPickerStyles}`)) return;
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
    <EmojiPickerComponent
      class={EmojiPickerStyles}
      spriteUrl="/assets/emojiSprites.png"
      emojis={emojis}
      customEmojis={customEmojis()}
      onEmojiClick={(e: any) => props.onClick(e.name || e.short_names[0])}
      primaryColor='var(--primary-color)'
      style={{ width: emojiPickerWidth().width + "px" }}
      maxRecent={20}
      maxRow={emojiPickerWidth()?.row}
    />
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
  background-color: #00000078;
  overflow: hidden;
`;
const FloatingContainer = styled("div")`
  position: absolute;
`;


const FloatingInScreen = (props: {close(): void; children: JSXElement, x: number, y: number}) => {
  let floatingElementRef: undefined | HTMLDivElement = undefined;

  const [width, height] = useResizeObserver(() => floatingElementRef)

  const styles = () => {
    let _styles: JSX.CSSProperties = {};

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