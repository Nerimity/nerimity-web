import { styled } from "solid-styled-components";
import { FlexColumn, FlexRow } from "./Flexbox";
import Text from "./Text";
import { For, JSX, createEffect, createSignal } from "solid-js";
import { classNames, conditionalClass } from "@/common/classNames";

export interface RadioBoxItem {
  id: any;
  label: string;
}

interface RadioBoxProps {
  onChange?(item: RadioBoxItem): void;
  items: RadioBoxItem[];
  initialId: string | number;
  style?: JSX.CSSProperties;
}

const RadioBoxContainer = styled(FlexColumn)``;

export function RadioBox(props: RadioBoxProps) {
  const [selectedId, setSelectedId] = createSignal(props.initialId);

  createEffect(() => {
    setSelectedId(props.initialId);
  });

  const onClick = (item: RadioBoxItem) => {
    if (item.id === selectedId()) return;
    setSelectedId(item.id);
    props.onChange?.(item);
  };

  return (
    <RadioBoxContainer style={props.style}>
      <For each={props.items}>
        {(item) => (
          <RadioBoxItem
            onClick={() => onClick(item)}
            item={item}
            selected={item.id === selectedId()}
          />
        )}
      </For>
    </RadioBoxContainer>
  );
}

export const RadioBoxItemCheckBox = styled(FlexRow)<{ size?: number }>`
  position: relative;
  width: ${(props) => props.size || 10}px;
  height: ${(props) => props.size || 10}px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  transition: 0.2s;
  border: solid ${(props) => (props.size || 10) / 2}px transparent;

  &:after {
    position: absolute;
    content: "";
    inset: -${(props) => (props.size || 10) / 2}px;
    border: solid 1px rgba(255, 255, 255, 0.2);
    border-radius: 50%;
  }

  &.selected {
    background-color: white;
    border-color: var(--primary-color);
  }
  flex-shrink: 0;
`;

const RadioBoxItemContainer = styled(FlexRow)`
  align-items: center;
  cursor: pointer;
  padding: 5px;
  border-radius: 8px;
  transition: 0.2s;
  user-select: none;
  flex-shrink: 0;

  .label {
    color: white;
  }

  &:not(.selected):hover {
    .radio-box-circle {
      background-color: rgba(255, 255, 255, 0.6);
      border-color: rgba(0, 0, 0, 0.4);
    }
  }
`;

interface RadioBoxItemProps {
  onClick?(): void;
  item: RadioBoxItem;
  selected: boolean;
  class?: string;
  labelSize?: number;
  checkboxSize?: number;
}

export function RadioBoxItem(props: RadioBoxItemProps) {
  return (
    <RadioBoxItemContainer
      class={classNames(
        props.class,
        conditionalClass(props.selected, "selected")
      )}
      gap={5}
      onClick={props.onClick}
    >
      <RadioBoxItemCheckBox
        size={props.checkboxSize}
        class={classNames(
          "radio-box-circle",
          conditionalClass(props.selected, "selected")
        )}
        classList={{ selected: props.selected }}
      />
      <Text class="label" size={props.labelSize}>
        {props.item.label}
      </Text>
    </RadioBoxItemContainer>
  );
}
