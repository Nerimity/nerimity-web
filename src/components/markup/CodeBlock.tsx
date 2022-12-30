import { classNames, conditionalClass } from "@/common/classNames";
import { copyToClipboard } from "@/common/clipboard";
import { getLanguageName } from "@/highlight-js-parser";
import type {HLJSApi} from 'highlight.js'
import "highlight.js/styles/felipec.css";

import { createEffect, createSignal, Show } from "solid-js";
import Icon from "../ui/icon/Icon";

interface Props {
  lang?: string;
  value: string;
}



export default function CodeBlock(props: Props) {
  // const language = () => languageLoaded() ? hljs.getLanguage(props.lang!)?.name : '';
  const [languageName, setLanguageName] = createSignal('');
  const [wrap, setWrap] = createSignal(true);
  const [languageLoaded, setLanguageLoaded] = createSignal(false);
  let hljs: HLJSApi | undefined;

  // Register
  createEffect(async () => {
    if (!props.lang) return;
    const langFilename = getLanguageName(props.lang);
    if (!langFilename) return;
    hljs = (await import("highlight.js/lib/core")).default;
    const lang = await import(`../../../node_modules/highlight.js/es/languages/${langFilename}.js`);
    hljs.registerLanguage(langFilename, lang.default);
    setLanguageName(hljs.getLanguage(props.lang!)?.name || '');
    setLanguageLoaded(true);    
  })

  const toggleWrap = () => setWrap(!wrap());

  const highlighted = () => {
    return hljs?.highlight(props.value, {
      ignoreIllegals: true,
      language: props.lang!,
    })?.value
  }

  const copy = () => copyToClipboard(props.value);

  return (
    <div class={classNames("code-block", conditionalClass(!wrap(), "no-wrap"))}>
      <div class="header">
        <span class="lang-name">{languageName()|| props.lang || "Text"}</span>
        <Icon onClick={toggleWrap}  title="Toggle Wrap" name="wrap_text" class={classNames("wrap-button", conditionalClass(wrap(), "active"))} size={16} />
        <Icon onClick={copy} title="Copy" name="copy" class="copy-button" size={16} />
      </div>
      <div class="content">
        <Show when={languageLoaded()}><code innerHTML={highlighted()} /></Show>
        <Show when={!languageLoaded()}><code>{props.value}</code></Show>
      </div>
    </div>
  )
}