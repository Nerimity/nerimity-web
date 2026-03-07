import { styled } from "solid-styled-components";

interface CheckboxProps {
  onChange?: (value: number) => void;
  onEnd?: () => void;
  value: number;
  min: number;
  max: number;
}

const SliderContainer = styled("div")`
  display: flex;
  gap: 10px;
  align-items: center;
  user-select: none;
  cursor: pointer;
`;

export default function Slider(props: CheckboxProps) {
  return (
    <SliderContainer class="slider">
      <input
        onPointerUp={props.onEnd}
        type="range"
        min={props.min}
        max={props.max}
        value={props.value}
        onInput={(e) => props.onChange?.(e.target.value)}
      />
    </SliderContainer>
  );
}
