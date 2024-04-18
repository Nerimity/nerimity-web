import { createSignal } from "solid-js";
import Button from "../ui/Button";
import { ColorPickerModal } from "../ui/color-picker/ColorPicker";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import Icon from "../ui/icon/Icon";
import Modal from "../ui/modal/Modal";
import styles from "./styles.module.scss";

const formats = {
  bold: (text: string) => ({offsetStart: 2, offsetEnd: text.length + 2, res: `**${text}**`}),
  italic: (text: string) => ({offsetStart: 1, offsetEnd: text.length + 1, res: `_${text}_`}),
  strikethrough: (text: string) => ({offsetStart: 2, offsetEnd: text.length + 2, res: `~~${text}~~`}),
  color: (text: string, color?: string) => ({offsetStart: color!.length + 2, offsetEnd: color!.length + 2 + text.length, res: `[${color}]${text || ""}`}),
  timestamp: (text: string, schedule?: number) => ({offsetStart: 5 + schedule!.toString().length , offsetEnd: 5 + schedule!.toString().length, res: `[tr:${schedule}]`})

} as const;

export const AdvancedMarkupOptions = (props: {inputElement: HTMLInputElement | HTMLTextAreaElement, updateText(text: string):void}) => {
  const {createPortal} = useCustomPortal();
  let colorHistory: null | string = null;

  const applyFormat = (format: "bold" | "italic" | "strikethrough" | "color" | "timestamp", color?: string, schedule?: number) => {

    if (format === "color" && !color) {
      createPortal?.(close => <ColorPickerModal close={close} color={colorHistory} done={(color) => {
        applyFormat(format, color);
        colorHistory = color;
      }} onChange={(value) => (color = value)} />);
      return;
    }

    if (format === "timestamp" && !schedule) {
      createPortal?.(close => <DateTimePickerModal close={close}  done={(val) => {
        applyFormat(format, undefined, val);
      }}/>);

      return; 
    }

    const transformFunc = formats[format as keyof typeof formats];

    const start = props.inputElement.selectionStart!;
    const finish = props.inputElement.selectionEnd!;
    const allText = props.inputElement.value;
    const sel = allText.substring(start, finish);




    const modifySel = transformFunc(sel, schedule || color);
    const newText = allText.substring(0, start) + modifySel.res + allText.substring(finish, allText.length);

    props.inputElement.focus();

    props.updateText(newText);
    props.inputElement.selectionStart = start + modifySel.offsetStart;
    props.inputElement.selectionEnd = start + modifySel.offsetEnd;
  };

  return (
    <div class={styles.container}>
      <Button hoverText="Bold" onClick={() => applyFormat("bold")} iconSize={18} margin={0} iconName="format_bold" class={styles.button} />
      <Button hoverText="Italic" onClick={() => applyFormat("italic")} iconSize={18} margin={0} iconName="format_italic" class={styles.button} />
      <Button hoverText="Strikethrough" onClick={() => applyFormat("strikethrough")} iconSize={18} margin={0} iconName="strikethrough_s" class={styles.button} />
      <Button hoverText="Timestamp" onClick={() => applyFormat("timestamp")}  iconSize={18} margin={0} iconName="schedule" class={styles.button} />
      <Button hoverText="Color" onClick={() => applyFormat("color")} iconSize={18} margin={0} iconName="palette" class={styles.button} />
    </div>
  );
};

const DateTimePickerModal = (props: {close: () => void, done: (val: number) => void}) => {
  const [date, setDate] = createSignal(toLocalISOString(new Date()));

  const onDone = () => {
    const dateObj = new Date(date());
    dateObj.setSeconds(new Date().getSeconds());
    props.done(dateObj.getTime() / 1000);
    props.close();
  };
  return (
    <Modal title="Pick date and time" close={props.close} actionButtonsArr={[{label: "Done", onClick: onDone, iconName: "done", primary: true}]}>
      <div class={styles.datePickerModal}>
        <input
          type="datetime-local"
          value={date()}
          style={{"font-size": "18px"}}
          onChange={e => setDate(e.target.value)}
        />
      </div>
    </Modal>
  );
};


function toLocalISOString(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000); //offset in milliseconds. Credit https://stackoverflow.com/questions/10830357/javascript-toisostring-ignores-timezone-offset

  // Optionally remove second/millisecond if needed
  localDate.setSeconds(null!);
  localDate.setMilliseconds(null!);
  return localDate.toISOString().slice(0, -1);
}
