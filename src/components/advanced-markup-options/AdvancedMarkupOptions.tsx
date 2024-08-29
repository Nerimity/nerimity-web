import styles from "./styles.module.scss";
import { Show, createEffect, createSignal, on } from "solid-js";
import Button from "../ui/Button";
import { ColorPickerModal } from "../ui/color-picker/ColorPicker";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import Icon from "../ui/icon/Icon";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import { classNames, conditionalClass } from "@/common/classNames";
import { EmojiPicker } from "../ui/emoji-picker/EmojiPicker";
import { useResizeObserver } from "@/common/useResizeObserver";
import { useWindowProperties } from "@/common/useWindowProperties";
import Input from "../ui/input/Input";

const formats = {
  named_link: (url: string) => ({
    offsetStart: 1,
    offsetEnd: "Name".length + 1,
    res: `[Name](${url || "https://example.com"})`,
  }),
  header: (text: string) => ({
    offsetStart: 2,
    offsetEnd: text.length + 2,
    res: `# ${text}`,
  }),
  bold: (text: string) => ({
    offsetStart: 2,
    offsetEnd: text.length + 2,
    res: `**${text}**`,
  }),
  italic: (text: string) => ({
    offsetStart: 1,
    offsetEnd: text.length + 1,
    res: `_${text}_`,
  }),
  strikethrough: (text: string) => ({
    offsetStart: 2,
    offsetEnd: text.length + 2,
    res: `~~${text}~~`,
  }),
  spoiler: (text: string) => ({
    offsetStart: 2,
    offsetEnd: text.length + 2,
    res: `||${text}||`,
  }),
  color: (text: string, color?: string) => ({
    offsetStart: color!.length + 2,
    offsetEnd: color!.length + 2 + text.length,
    res: `[${color}]${text || ""}`,
  }),
  timestamp: (text: string, schedule?: number) => ({
    offsetStart: 5 + schedule!.toString().length,
    offsetEnd: 5 + schedule!.toString().length,
    res: `[tr:${schedule}]`,
  }),
} as const;

export const AdvancedMarkupOptions = (props: {
  zeroBottomBorderRadius?: boolean;
  hideEmojiPicker?: boolean;
  class?: string;
  inputElement: HTMLInputElement | HTMLTextAreaElement;
  updateText(text: string): void;
  primaryColor?: string;
}) => {
  const { createPortal } = useCustomPortal();
  let colorHistory: null | string = null;
  const [emojiPickerRef, setEmojiPickerRef] = createSignal<HTMLDivElement>();
  const { height, width } = useResizeObserver(emojiPickerRef);
  const windowProperties = useWindowProperties();

  const applyFormat = (
    format:
      | "bold"
      | "italic"
      | "strikethrough"
      | "spoiler"
      | "color"
      | "timestamp"
      | "header"
      | "named_link",
    color?: string,
    schedule?: number
  ) => {
    if (format === "color" && !color) {
      createPortal?.((close) => (
        <ColorPickerModal
          close={close}
          color={colorHistory}
          done={(color) => {
            applyFormat(format, color);
            colorHistory = color;
          }}
          onChange={(value) => (color = value)}
        />
      ));
      return;
    }

    if (format === "timestamp" && !schedule) {
      createPortal?.((close) => (
        <DateTimePickerModal
          close={close}
          done={(val) => {
            applyFormat(format, undefined, val);
          }}
        />
      ));

      return;
    }

    const transformFunc = formats[format as keyof typeof formats];

    const start = props.inputElement.selectionStart!;
    const finish = props.inputElement.selectionEnd!;
    const allText = props.inputElement.value;
    const sel = allText.substring(start, finish);

    const modifySel = transformFunc(sel, schedule || color);
    const newText =
      allText.substring(0, start) +
      modifySel.res +
      allText.substring(finish, allText.length);

    props.inputElement.focus();

    props.updateText(newText);
    props.inputElement.selectionStart = start + modifySel.offsetStart;
    props.inputElement.selectionEnd = start + modifySel.offsetEnd;
  };

  let opened: any = null;
  const onEmojiPicked = (shortcode: string) => {
    props.inputElement!.focus();
    props.inputElement!.setRangeText(
      `:${shortcode}: `,
      props.inputElement!.selectionStart!,
      props.inputElement!.selectionEnd!,
      "end"
    );
    props.updateText(props.inputElement.value);
    opened?.();
    opened = null;
  };

  const showEmojiPicker = (event: MouseEvent) => {
    event.preventDefault();
    if (!windowProperties.isMobileAgent()) {
      props.inputElement!.focus();
    }
    if (opened) {
      opened();
      opened = null;
      return;
    }
    const rect = (
      event.currentTarget as HTMLElement
    ).getBoundingClientRect() as DOMRect;

    const getPos = () => {
      let top = rect.y - 5 - height();
      let left = rect.x;

      if (top < 0) {
        top = 0;
      }

      if (left + width() > windowProperties.width()) {
        left = windowProperties.width() - width();
      }

      return {
        top: top + "px",
        left: left + "px",
      };
    };

    createPortal((close) => {
      opened = close;
      return (
        <div
          ref={setEmojiPickerRef}
          class={styles.emojiPickerContainer}
          style={getPos()}
        >
          <EmojiPicker
            onClick={onEmojiPicked}
            close={() => {
              opened = null;
              close();
            }}
          />
        </div>
      );
    });
  };

  return (
    <div
      class={classNames(
        styles.container,
        props.class,
        conditionalClass(
          props.zeroBottomBorderRadius,
          styles.zeroBottomBorderRadius
        )
      )}
    >
      <Button
        hoverText="Bold"
        onClick={() => applyFormat("bold")}
        iconSize={18}
        margin={0}
        iconName="format_bold"
        color={props.primaryColor}
        class={styles.button}
      />
      <Button
        hoverText="Italic"
        onClick={() => applyFormat("italic")}
        iconSize={18}
        margin={0}
        iconName="format_italic"
        color={props.primaryColor}
        class={styles.button}
      />
      <Button
        hoverText="Strikethrough"
        onClick={() => applyFormat("strikethrough")}
        iconSize={18}
        margin={0}
        iconName="strikethrough_s"
        color={props.primaryColor}
        class={styles.button}
      />
      <Button
        hoverText="Header"
        onClick={() => applyFormat("header")}
        iconSize={18}
        margin={0}
        iconName="title"
        color={props.primaryColor}
        class={styles.button}
      />
      <Button
        hoverText="Named Link"
        onClick={() => applyFormat("named_link")}
        iconSize={18}
        margin={0}
        iconName="link"
        color={props.primaryColor}
        class={styles.button}
      />
      <Button
        hoverText="Spoiler"
        onClick={() => applyFormat("spoiler")}
        iconSize={18}
        margin={0}
        iconName="visibility_off"
        color={props.primaryColor}
        class={styles.button}
      />
      <Button
        hoverText="Timestamp"
        onClick={() => applyFormat("timestamp")}
        iconSize={18}
        margin={0}
        iconName="schedule"
        color={props.primaryColor}
        class={styles.button}
      />
      <Button
        hoverText="Color"
        onClick={() => applyFormat("color")}
        iconSize={18}
        margin={0}
        iconName="palette"
        color={props.primaryColor}
        class={styles.button}
      />

      <Show when={!props.hideEmojiPicker}>
        <Button
          hoverText="Emoji Picker"
          onClick={showEmojiPicker}
          iconSize={18}
          margin={0}
          iconName="face"
          color={props.primaryColor}
          class={classNames(styles.button, "emojiPickerButton")}
        />
      </Show>
    </div>
  );
};

const DateTimePickerModal = (props: {
  close: () => void;
  done: (val: number) => void;
}) => {
  const [date, setDate] = createSignal(toLocalISOString(new Date()));

  const onDone = () => {
    const dateObj = new Date(date());
    dateObj.setSeconds(new Date().getSeconds());
    props.done(dateObj.getTime() / 1000);
    props.close();
  };
  return (
    <LegacyModal
      title="Pick date and time"
      close={props.close}
      actionButtonsArr={[
        { label: "Done", onClick: onDone, iconName: "done", primary: true },
      ]}
    >
      <div class={styles.datePickerModal}>
        <Input
          type="datetime-local"
          value={date()}
          style={{ "font-size": "18px" }}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
    </LegacyModal>
  );
};

function toLocalISOString(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000); //offset in milliseconds. Credit https://stackoverflow.com/questions/10830357/javascript-toisostring-ignores-timezone-offset

  // Optionally remove second/millisecond if needed
  localDate.setSeconds(null!);
  localDate.setMilliseconds(null!);
  return localDate.toISOString().slice(0, -1);
}
