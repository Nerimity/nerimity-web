import type MarkdownIt from "markdown-it";
import { createEffect, createSignal } from "solid-js";

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

// Used to parse github readmes.
export default function Marked(props: {value: string}) {
  const [html, setHtml] = createSignal("");

  createEffect(async () => {
    if (!props.value) return;
    const md = await getMd();
    const newHtml = md.render(props.value);
    setHtml(newHtml)
  })

  return <div innerHTML={html()} />
}