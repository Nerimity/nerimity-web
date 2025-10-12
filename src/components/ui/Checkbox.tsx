import { createEffect, createSignal, JSX, on, Show } from "solid-js";
import { css, styled } from "solid-styled-components";
import Icon from "./icon/Icon";
import Text from "./Text";
import { classNames, conditionalClass } from "@/common/classNames";

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

const boxStyle = css`
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  transition: 0.2s;
  color: transparent;
  transition: 0.2s;
  padding: 3px;
  border: solid 1px rgba(255, 255, 255, 0.2);
`;

const CheckboxContainer = styled("div")`
  display: flex;
  gap: 10px;
  align-items: center;
  user-select: none;
  cursor: pointer;

  &:hover .${boxStyle} {
    background: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.3);
  }

  &.selected .${boxStyle} {
    background-color: var(--primary-color);
    color: white;
  }
`;

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
    <CheckboxContainer
      style={props.style}
      class={classNames(
        "checkbox",
        props.class,
        conditionalClass(checked(), "selected")
      )}
      onClick={onClick}
    >
      <Icon size={13} style={props.boxStyles} class={boxStyle} name="check" />
      <Show when={props.label}>
        <Text size={props.labelSize} style={{ "word-break": "break-word" }}>
          {props.label}
        </Text>
      </Show>
    </CheckboxContainer>
  );
}
