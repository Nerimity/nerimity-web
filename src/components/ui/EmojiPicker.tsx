import env from "@/common/env";
import { CustomEmoji, EmojiPicker as EmojiPickerComponent } from "@nerimity/solid-emoji-picker";
import { css } from "solid-styled-components";
import Avatar from "./Avatar";
import { createEffect, on, onCleanup, onMount } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import { useWindowProperties } from "@/common/useWindowProperties";
import emojis from '@/emoji/emojis.json';

const EmojiPickerStyles = css`
  .categoriesContainer .customEmojiImage,
  .title .customEmojiImage {
    border-radius: 50%;
  }

  max-height: 420px;
  height: 100%;
  backdrop-filter: blur(20px);
  border: solid 1px rgba(255, 255, 255, 0.2);
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(20px);

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
    return { row: 8, width: 450 }
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
      maxRow={emojiPickerWidth()?.row}
    />
  )
}