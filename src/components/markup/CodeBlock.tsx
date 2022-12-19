import { classNames, conditionalClass } from "@/common/classNames";
import { copyToClipboard } from "@/common/clipboard";

import hljs from "highlight.js";
import "highlight.js/styles/felipec.css";

import { createSignal, Show } from "solid-js";
import Icon from "../ui/icon/Icon";

interface Props {
  lang?: string;
  value: string;
}

export default function CodeBlock(props: Props) {
  const language = () => hljs.getLanguage(props.lang!)?.name;
  const [wrap, setWrap] = createSignal(true);

  const toggleWrap = () => setWrap(!wrap());

  const highlighted = () => (
    hljs.highlight(props.value, {
      ignoreIllegals: true,
      language: props.lang!,
    })?.value
  );

  const copy = () => copyToClipboard(props.value);

  return (
    <div class={classNames("code-block", conditionalClass(!wrap(), "no-wrap"))}>
      <div class="header">
        <span class="lang-name">{language() || props.lang || "Text"}</span>
        <Icon onClick={toggleWrap}  title="Toggle Wrap" name="wrap_text" class={classNames("wrap-button", conditionalClass(wrap(), "active"))} size={16} />
        <Icon onClick={copy} title="Copy" name="copy" class="copy-button" size={16} />
      </div>
      <div class="content">
        <Show when={language()}><code innerHTML={highlighted()} /></Show>
        <Show when={!language()}><code>{props.value}</code></Show>
      </div>
    </div>
  )
}