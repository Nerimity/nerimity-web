import Icon from "../icon/Icon";
import styles from "./styles.module.scss";
export function ColorPicker(props: { color: string | null, onChange?: (value: string) => void }) {
  let inputEl: undefined | HTMLInputElement;

  const onClicked = () => {
    inputEl?.click();
  };
  const onChange = () => {
    props.onChange?.(inputEl?.value!);
  };

  return (
    <div class={styles.colorPicker} style={{ background: props.color || "transparent" }} onClick={onClicked}>
      <Icon name='colorize' color='white' size={18} class={styles.icon} />
      <input style={{ position: "absolute", opacity: 0 }} ref={inputEl} type="color" value={props.color || "transparent"} onChange={onChange} />
    </div>
  );
}
