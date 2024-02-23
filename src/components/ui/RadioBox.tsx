import { styled } from "solid-styled-components";
import { FlexColumn, FlexRow } from "./Flexbox";
import Text from "./Text";
import { For, createEffect, createSignal } from "solid-js";

export interface RadioBoxItem {
  id: any;
  label: string;
}

interface RadioBoxProps {
  onChange?(item: RadioBoxItem): void;
  items: RadioBoxItem[]
  initialId: string | number;
}

const RadioBoxContainer = styled(FlexColumn)`
`;

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
    <RadioBoxContainer>
      <For each={props.items}>
        {item => <RadioBoxItem onClick={() => onClick(item)} item={item} selected={item.id === selectedId()} />}
      </For>
    </RadioBoxContainer>
  );
}


export const RadioBoxItemCheckBox = styled(FlexRow)<{selected: boolean, size?: number}>`
  width: ${props => props.size || 10}px;
  height: ${props => props.size || 10}px;
  border-radius: 50%;
  background-color: white;
  transition: 0.2s;
  border: solid ${props => (props.size || 10) / 2}px ${props => props.selected ? "var(--primary-color)" : "gray"};
  
`;

const RadioBoxItemContainer = styled(FlexRow)<{selected: boolean}>`
  align-items: center;
  cursor: pointer;
  padding: 5px;
  border-radius: 8px;
  transition: 0.2s;
  .label {
    color: ${props => props.selected ? "white" : "rgba(255,255,255,0.6)"};
    transition: 0.2s;
  }

  &:hover {
    background-color: rgba(255,255,255,0.1);
    .label {
      color: white;
    }
  }
`;

interface RadioBoxItemProps {
  onClick(): void;
  item: RadioBoxItem;
  selected: boolean;
}

function RadioBoxItem(props: RadioBoxItemProps) {
  return (
    <RadioBoxItemContainer selected={props.selected} gap={5} onClick={props.onClick}>
      <RadioBoxItemCheckBox selected={props.selected} />
      <Text class="label">{props.item.label}</Text>
    </RadioBoxItemContainer>
  );
}