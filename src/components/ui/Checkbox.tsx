import { createEffect, createSignal, JSX, on, Show } from "solid-js";
import Icon from "./icon/Icon";
import Text from "./Text";
import { classNames, conditionalClass } from "@/common/classNames";
import style from "./Checkbox.module.scss";

export interface CheckboxProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disableLocalUpdate?: boolean;
  label?: string;
  labelSize?: number;
  class?: string;
  boxStyles?: JSX.CSSProperties;
  style?: JSX.CSSProperties;
  disabled?: boolean;
}

export default function Checkbox(props: CheckboxProps) {
  const [checked, setChecked] = createSignal(props.checked || false);
  let checkboxEl: undefined | HTMLInputElement;

  createEffect(
    on(
      () => props.checked,
      () => {
        setChecked(props.checked)
        checkboxEl!.checked = props.checked;
      }
    )
  );

  const onClick = () => {
    if (props.disabled) return;
    const newState = checkboxEl!.checked;
    if (props.disableLocalUpdate) {
      checkboxEl!.checked = checked();
    } else {
      setChecked(newState);
    }
    props.onChange?.(newState);
  };

  return (
    <label
      style={props.style}
      class={classNames(
        style.container,
        "checkbox",
        props.class,
        conditionalClass(checked(), classNames(style.selected, "selected")),
      )}
    >
      <div style={props.boxStyles} class={style.checkbox}>
        <input
          ref={checkboxEl}
          class={style.nativeCheckbox}
          type="checkbox"
          disabled={props.disabled}
          onChange={onClick}
        />
        <Icon size={13} name="check" />
      </div>
      <Show when={props.label}>
        <Text size={props.labelSize} style={{ "word-break": "break-word" }}>
          {props.label}
        </Text>
      </Show>
    </label>
  );
}
