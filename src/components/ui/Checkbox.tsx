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

  createEffect(
    on(
      () => props.checked,
      () => setChecked(props.checked)
    )
  );

  const onClick = () => {
    if (props.disabled) return;
    const newState = !checked();
    !props.disableLocalUpdate && setChecked(newState);
    props.onChange?.(newState);
  };

  return (
    <div
      style={props.style}
      class={classNames(
        style.container,
        "checkbox",
        props.class,
        conditionalClass(checked(), classNames(style.selected, "selected")),
      )}
      onClick={onClick}
    >
      <Icon size={13} style={props.boxStyles} class={style.boxStyle} name="check" />
      <Show when={props.label}>
        <Text size={props.labelSize} style={{ "word-break": "break-word" }}>
          {props.label}
        </Text>
      </Show>
    </div>
  );
}
