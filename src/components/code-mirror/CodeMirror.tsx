import { createCodeMirror } from "solid-codemirror";
import { EditorState, Extension } from "@codemirror/state";

import { css } from "@codemirror/lang-css";
import { dracula } from "thememirror";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  crosshairCursor,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from "@codemirror/view";
import {
  defaultHighlightStyle,
  syntaxHighlighting,
  indentOnInput,
  bracketMatching,
  foldGutter,
  foldKeymap,
} from "@codemirror/language";
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";
const EDITOR_BASE_SETUP: Extension = [
  lineNumbers(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    indentWithTab,
  ]),

  css(),
  dracula,
];

interface Props {
  value: string;
  onValueChange: (value: string) => void;
}

export default (props: Props) => {
  let containerRef: HTMLDivElement | undefined;
  const {
    editorView,
    ref: editorRef,
    createExtension,
  } = createCodeMirror({
    value: props.value,
    onValueChange: (value) => props.onValueChange(value),
  });

  createExtension(EDITOR_BASE_SETUP);

  return (
    <div
      ref={containerRef}
      style={{
        "border-radius": "8px",
        overflow: "hidden",
        height: "100%",
        border: "solid 1px rgba(255, 255, 255, 0.1)",
      }}
    >
      <div ref={editorRef} style={{ height: "100%" }} />
    </div>
  );
};
