import { createEffect, createSignal, on, Show } from 'solid-js';
import { css, styled } from 'solid-styled-components';
import Icon from './icon/Icon';
import Text from './Text';

interface CheckboxProps {
  checked: boolean
  onChange?: (checked: boolean) => void
  disableLocalUpdate?: boolean
  label?: string
}

const boxStyle = css`
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  transition: 0.2s;
  color: transparent;
  transition: 0.2s;
  padding: 3px;
`;

const CheckboxContainer = styled("div")`
  display: flex;
  gap: 10px;
  align-items: center;
  user-select: none;
  cursor: pointer;

  &:hover .${boxStyle} {
    background: rgba(255,255,255,0.2);
    color: rgba(255, 255, 255, 0.3);
  }

  &.selected .${boxStyle} {
    background-color: var(--primary-color);
    color: white;
  }
`;

export default function Checkbox (props: CheckboxProps) {
  const [checked, setChecked] = createSignal(props.checked || false);

  createEffect(on(() => props.checked, () => 
    setChecked(props.checked)
  ));

  const onClick = () => {
    const newState = !checked() 
    !props.disableLocalUpdate &&  setChecked(newState);
    props.onChange?.(newState);
  }

  return (
    <CheckboxContainer class={checked() ? 'selected' : ''} onClick={onClick}>
      <Icon size={13} class={boxStyle} name="done" />
      <Show when={props.label}>
        <Text>{props.label}</Text>
      </Show>
    </CheckboxContainer>
  )
}
