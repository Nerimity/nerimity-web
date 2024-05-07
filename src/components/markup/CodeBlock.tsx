import { classNames, conditionalClass } from "@/common/classNames";
import { copyToClipboard } from "@/common/clipboard";
import { getLanguageName } from "@/highlight-js-parser";
import type {HLJSApi} from "highlight.js";
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
    const langFilename = getLanguageName(props.lang);
    if (!langFilename) return;
    hljs = (await import("highlight.js/lib/core")).default;
    const lang = await import(`../../../node_modules/highlight.js/es/languages/${langFilename}.js`);
    hljs.registerLanguage(langFilename, lang.default);
    setLanguageName(hljs.getLanguage(props.lang!)?.name || "");
    setLanguageLoaded(true);    
  });

  function getLanguageIcon(): string {
    const lang = languageName().toLowerCase().replaceAll(" ", "");

    // languages with special characters in names
    if (lang == "c++") {
      return "/assets/code-block-icons/cpp.svg"; 
    }
    else if (lang == "c#") {
      return "/assets/code-block-icons/cs.svg"; 
    }
    else if (lang == "html,xml") {
      return "/assets/code-block-icons/html_xml.svg"; 
    }  

    const langsWithIcons: string[] = ["assembly", "c", "css", "go", "java", "javascript", "json", "kotlin", "lua", "perl", "php", "python", "rust", "shellsession", "sql", "typescript", "yaml"];
    if (langsWithIcons.includes(lang)) {
      return `/assets/code-block-icons/${lang}.svg`;
    }
    return "/assets/code-block-icons/default.svg";
  }

  const toggleWrap = () => setWrap(!wrap());

  const highlighted = () => {
    return hljs?.highlight(props.value, {
      ignoreIllegals: true,
      language: props.lang!
    })?.value;
  };

  const copy = () => copyToClipboard(props.value);

  return (
    <div class={classNames("code-block", conditionalClass(!wrap(), "no-wrap"))}>
      <div class="header">
        <img src={getLanguageIcon()} height='24px' width='24px' alt='' />
        <span class="lang-name">{` ${languageName()}`|| ` ${props.lang}` || " Text"}</span>
        <Icon onClick={toggleWrap}  title="Toggle Wrap" name="wrap_text" class={classNames("button", conditionalClass(wrap(), "active"))} size={16} />
        <Icon onClick={copy} title="Copy" name="content_copy" class="button" size={16} />
      </div>
      <div class="content">
        <Show when={languageLoaded()}><code innerHTML={highlighted()} /></Show>
        <Show when={!languageLoaded()}><code>{props.value}</code></Show>
      </div>
    </div>
  );
}