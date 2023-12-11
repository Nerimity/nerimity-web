/*
  Used to parse github readmes.
*/

import styles from './Marked.module.scss';
import type MarkdownIt from "markdown-it";
import { createEffect, createSignal, Show } from "solid-js";

const lazyMarkdownIt = () => import("markdown-it");

let MD: MarkdownIt | null = null;

async function getMd () {
  if (MD) return MD;
  return lazyMarkdownIt().then(async ({default: MarkdownIt}) => {
    const {default: emoji} = await import("markdown-it-emoji");
    const newMd = MarkdownIt();
    newMd.use(emoji);
    return newMd;
  });
}

export default function Marked(props: {value: string}) {
  const [html, setHtml] = createSignal<null | ChildNode>(null);

  createEffect(async () => {
    if (!props.value) return;
    const md = await getMd();
    const newHtml = md.render(props.value);

    var div = document.createElement('div');
    div.innerHTML = newHtml;

    div.querySelectorAll("a").forEach(element => 
      element.setAttribute("target", "_blank")
    )



    setHtml(div)
  })

  return <Show when={html()}><div class={styles.markedContainer}>{html?.()}</div></Show>
}