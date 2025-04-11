import { classNames, conditionalClass } from "@/common/classNames";
import { copyToClipboard } from "@/common/clipboard";
import type { HLJSApi } from "highlight.js";
import "highlight.js/styles/felipec.css";

import { createEffect, createSignal, Show } from "solid-js";
import Icon from "../ui/icon/Icon";

interface Props {
  lang?: string;
  value: string;
}

export default function CodeBlock(props: Props) {
  // const language = () => languageLoaded() ? hljs.getLanguage(props.lang!)?.name : '';
  const [languageName, setLanguageName] = createSignal("");
  const [wrap, setWrap] = createSignal(true);
  const [languageLoaded, setLanguageLoaded] = createSignal(false);
  let hljs: HLJSApi | undefined;

  // Register
  createEffect(async () => {
    if (!props.lang) return;

    const { register } = await import("@/common/highlightJSRegisterLanguages");

    const { name, hljs: hljsModule } = await register(props.lang!);
    hljs = hljsModule;

    setLanguageName(props.lang || "");
    if (name) setLanguageLoaded(true);
  });

  function getLanguageIcon(): string {
    const lang = languageName().toLowerCase().replaceAll(" ", "");

    // languages with special characters in names
    if (lang == "c++") {
      return "/assets/code-block-icons/cpp.svg";
    } else if (lang == "c#") {
      return "/assets/code-block-icons/cs.svg";
    } else if (lang == "html,xml") {
      return "/assets/code-block-icons/html_xml.svg";
    }

    const langsWithIcons: string[] = [
      "assembly",
      "c",
      "css",
      "go",
      "java",
      "javascript",
      "json",
      "kotlin",
      "lua",
      "perl",
      "php",
      "python",
      "rust",
      "shellsession",
      "sql",
      "typescript",
      "yaml",
    ];
    if (langsWithIcons.includes(lang)) {
      return `/assets/code-block-icons/${lang}.svg`;
    }
    return "/assets/code-block-icons/default.svg";
  }

  const toggleWrap = () => setWrap(!wrap());

  const highlighted = () => {
    return hljs?.highlight(props.value, {
      ignoreIllegals: true,
      language: props.lang!,
    })?.value;
  };

  const copy = () => copyToClipboard(props.value);

  return (
    <div class={classNames("code-block", conditionalClass(!wrap(), "no-wrap"))}>
      <div class="header">
        <img src={getLanguageIcon()} class="lang-icon" alt="" />
        <span class="lang-name">
          {` ${languageName() || props.lang || "Text"}`}
        </span>
        <Icon
          onClick={toggleWrap}
          title="Toggle Wrap"
          name="wrap_text"
          class={classNames("button", conditionalClass(wrap(), "active"))}
          size={18}
        />
        <Icon
          onClick={copy}
          title="Copy"
          name="content_copy"
          class="button copyButton"
          size={16}
        />
      </div>
      <div class="content">
        <Show when={languageLoaded()}>
          <code innerHTML={highlighted()} />
        </Show>
        <Show when={!languageLoaded()}>
          <code>{props.value}</code>
        </Show>
      </div>
    </div>
  );
}
