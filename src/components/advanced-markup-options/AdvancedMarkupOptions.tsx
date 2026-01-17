import styles from "./styles.module.scss";
import {
  Show,
  createEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
} from "solid-js";
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
import { Modal } from "../ui/modal";
import { Item } from "../ui/Item";
import { off } from "process";
import { TimestampType } from "../markup/TimestampMention";
import DropDown from "../ui/drop-down/DropDown";
import { WorldTimezones } from "@/common/WorldTimezones";
import { DateTimePicker } from "../ui/DateTimePicker";
import { t } from "@nerimity/i18lite";

const formats = {
  named_link: (url: string) => ({
    offsetStart: 1,
    offsetEnd: "Name".length + 1,
    res: `[Name](${url || "https://example.com"})`,
  }),
  checkbox: (text: string) => ({
    offsetStart: 5,
    offsetEnd: 5 + " Item 1".length,
    res: "-[ ] Item 1\n",
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
  gradient: (text: string, colors: string) => ({
    offsetStart: colors.length + 12,
    offsetEnd: colors.length + 12 + "Message".length,
    res: `[gradient: ${colors} ${text || "Message"}]`,
  }),

  timestamp: (text: string, schedule?: number, type?: TimestampType) => ({
    offsetStart: 5 + schedule!.toString().length,
    offsetEnd: 5 + schedule!.toString().length,
    res: `[${type === TimestampType.RELATIVE ? "tr" : "to"}:${schedule}]`,
  }),
} as const;

export const AdvancedMarkupOptions = (props: {
  zeroBottomBorderRadius?: boolean;
  hideEmojiPicker?: boolean;
  showGifPicker?: boolean;
  class?: string;
  inputElement: HTMLInputElement | HTMLTextAreaElement;
  updateText(text: string): void;
  primaryColor?: string;
  showHtml?: boolean;
  toggleHtml?: () => void;
  htmlEnabled?: boolean;
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
      | "checkbox"
      | "gradient"
      | "timestamp"
      | "header"
      | "named_link",
    color?: string,
    schedule?: number | string,
    type?: TimestampType,
  ) => {
    if (format === "color" && !color) {
      createPortal?.((close) => (
        <ColorPickerModal
          close={close}
          tabs={["solid", "gradient"]}
          color={colorHistory}
          done={(color, colors) => {
            if (colors.length > 1) {
              applyFormat("gradient", colors.join("-"));
            } else {
              applyFormat("color", color);
            }
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
          done={(val, type) => {
            applyFormat(format, undefined, val, type);
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

    const modifySel = transformFunc(sel, schedule || color, type);
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
  const onEmojiPicked = (shortcode: string, shiftDown?: boolean) => {
    props.inputElement!.focus();
    props.inputElement!.setRangeText(
      `:${shortcode}: `,
      props.inputElement!.selectionStart!,
      props.inputElement!.selectionEnd!,
      "end",
    );
    props.updateText(props.inputElement.value);
    if (!shiftDown) {
      opened?.();
      opened = null;
    }
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
            showGifPicker={props.showGifPicker}
            gifPicked={(e) => onEmojiPicked(e.gifUrl)}
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
          styles.zeroBottomBorderRadius,
        ),
      )}
    >
      <Button
        hoverText={t("markup.bold")}
        onClick={() => applyFormat("bold")}
        iconSize={18}
        margin={0}
        iconName="format_bold"
        color={props.primaryColor}
        class={styles.button}
      />
      <Button
        hoverText={t("markup.italic")}
        onClick={() => applyFormat("italic")}
        iconSize={18}
        margin={0}
        iconName="format_italic"
        color={props.primaryColor}
        class={styles.button}
      />
      <Button
        hoverText={t("markup.strikethrough")}
        onClick={() => applyFormat("strikethrough")}
        iconSize={18}
        margin={0}
        iconName="strikethrough_s"
        color={props.primaryColor}
        class={styles.button}
      />
      <Button
        hoverText={t("markup.header")}
        onClick={() => applyFormat("header")}
        iconSize={18}
        margin={0}
        iconName="title"
        color={props.primaryColor}
        class={styles.button}
      />
      <Button
        hoverText={t("markup.namedLink")}
        onClick={() => applyFormat("named_link")}
        iconSize={18}
        margin={0}
        iconName="link"
        color={props.primaryColor}
        class={styles.button}
      />
      <Button
        hoverText={t("markup.checkbox")}
        onClick={() => applyFormat("checkbox")}
        iconSize={18}
        margin={0}
        iconName="check_box"
        color={props.primaryColor}
        class={styles.button}
      />
      <Button
        hoverText={t("markup.spoiler")}
        onClick={() => applyFormat("spoiler")}
        iconSize={18}
        margin={0}
        iconName="visibility_off"
        color={props.primaryColor}
        class={styles.button}
      />
      <Button
        hoverText={t("markup.timestamp")}
        onClick={() => applyFormat("timestamp")}
        iconSize={18}
        margin={0}
        iconName="schedule"
        color={props.primaryColor}
        class={styles.button}
      />
      <Button
        hoverText={t("markup.color")}
        onClick={() => applyFormat("color")}
        iconSize={18}
        margin={0}
        iconName="palette"
        color={props.primaryColor}
        class={styles.button}
      />
      <Show when={props.showHtml}>
        <Button
          hoverText={t("markup.html")}
          onClick={props.toggleHtml}
          iconSize={18}
          margin={0}
          primary={props.htmlEnabled}
          iconName="html"
          color={props.primaryColor}
          class={styles.button}
        />
      </Show>

      <Show when={!props.hideEmojiPicker}>
        <Button
          hoverText={t("markup.emojiPicker")}
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

const offsetPlaceholderExamples = ["-01:00", "+01:00"];

function getTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

const DateTimePickerModal = (props: {
  close: () => void;
  done: (val: number | string, type: TimestampType) => void;
}) => {
  const [tab, setTab] = createSignal<"REL" | "OFF">("REL");
  const [date, setDate] = createSignal(new Date());
  const [offset, setOffset] = createSignal(getTimezone());

  const [offsetPlaceholder, setOffsetPlaceholder] = createSignal(0);
  onMount(() => {
    const id = setInterval(() => {
      if (offsetPlaceholder() === offsetPlaceholderExamples.length - 1) {
        setOffsetPlaceholder(0);
        return;
      }
      setOffsetPlaceholder(offsetPlaceholder() + 1);
    }, 3000);
    onCleanup(() => clearInterval(id));
  });

  const onDone = () => {
    if (tab() === "OFF") {
      props.done(offset(), TimestampType.OFFSET);
      props.close();
      return;
    }

    props.done(date().getTime() / 1000, TimestampType.RELATIVE);
    props.close();
  };
  return (
    <Modal.Root
      class={styles.datePickerOuterModal}
      close={props.close}
      desktopMaxWidth={270}
    >
      <Modal.Header title={t("markup.timestampModal.title")} />
      <Modal.Body class={styles.datePickerModal}>
        <div class={styles.tabs}>
          <Item.Root
            selected={tab() === "REL"}
            onClick={() => setTab("REL")}
            handlePosition="bottom"
          >
            <Item.Icon>schedule</Item.Icon>
            <Item.Label>{t("markup.timestampModal.relative")}</Item.Label>
          </Item.Root>
          <Item.Root
            selected={tab() === "OFF"}
            onClick={() => setTab("OFF")}
            handlePosition="bottom"
          >
            <Item.Icon>globe_uk</Item.Icon>
            <Item.Label>{t("markup.timestampModal.offset")}</Item.Label>
          </Item.Root>
        </div>
        <Show when={tab() === "REL"}>
          <DateTimePicker value={date()} onChange={setDate} />
        </Show>
        <Show when={tab() === "OFF"}>
          <DropDown
            selectedId={offset()}
            onChange={(item) => setOffset(item.id)}
            items={WorldTimezones.map((tz) => ({ id: tz, label: tz }))}
          />
        </Show>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Button
          label={t("markup.timestampModal.doneButton")}
          iconName="check"
          primary
          onClick={onDone}
        />
      </Modal.Footer>
    </Modal.Root>
  );
};

function toLocalISOString(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000); //offset in milliseconds. Credit https://stackoverflow.com/questions/10830357/javascript-toisostring-ignores-timezone-offset

  // Optionally remove second/millisecond if needed
  localDate.setSeconds(null!);
  localDate.setMilliseconds(null!);
  return localDate.toISOString().slice(0, -1);
}
