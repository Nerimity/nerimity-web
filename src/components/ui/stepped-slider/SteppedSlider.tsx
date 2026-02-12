import { createEffect, createSignal } from 'solid-js';
import style from './SteppedSlider.module.css';

export interface SteppedSliderStep {
  label: string;
  value: number;
  [key: string]: unknown;
}
interface SteppedSlider {
    steps: SteppedSliderStep[];
    currentValue: number;
    onChange?: (step: SteppedSliderStep) => void;
}
export const SteppedSlider = (props: SteppedSlider) => {
  const [currentValue, setCurrentValue] = createSignal(props.currentValue);
  let sliderBarEl: HTMLDivElement | undefined;
  const edgeMarginPercent = 2;

  createEffect(() => {
    setCurrentValue(props.currentValue);
  })

  createEffect(() => {
    const currentStep = props.steps.find(step => step.value === currentValue());
    if (currentStep && props.onChange) {
      props.onChange(currentStep);
    }
  })

  const updateCurrentValue = (event: MouseEvent) => {
    const sliderRect = sliderBarEl!.getBoundingClientRect();
    const stepsCount = props.steps.length;
    if (stepsCount <= 1) return;
    const edgeMarginPx = sliderRect.width * (edgeMarginPercent / 100);
    const availableWidth = Math.max(0, sliderRect.width - edgeMarginPx * 2);
    const clickX = Math.min(
      Math.max(0, event.clientX - sliderRect.left - edgeMarginPx),
      availableWidth
    );
    const stepWidth = availableWidth / (stepsCount - 1);
    const clickedStepIndex = Math.round(clickX / stepWidth);
    const clickedStep = props.steps[clickedStepIndex];
    if (!clickedStep) return;
    setCurrentValue(clickedStep.value);

  }

  let isDragging = false;
  const handleMouseDown = (event: MouseEvent) => {
    isDragging = true;
    updateCurrentValue(event);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
  const handleMouseUp = () => {
    isDragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }
  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging) return;
    updateCurrentValue(event);
  }


  const positionPercent = (index: number) => {
    const stepsCount = props.steps.length;
    if (stepsCount <= 1) return 0;
    const ratio = index / (stepsCount - 1);
    return edgeMarginPercent + ratio * (100 - edgeMarginPercent * 2);
  };

  const fillWidth = () => positionPercent(props.steps.findIndex(step => step.value === currentValue()));

  return (
    <div class={style.slider}>
        <div class={style.sliderBar} ref={sliderBarEl} onMouseDown={handleMouseDown}>
            <div class={style.sliderFill} style={{ width: `${fillWidth()}%` }}>
              <div class={style.sliderThumb} />
            </div>
        </div>
        <div class={style.labels}>
            {props.steps.map((step, index) => (
              <div class={style.label} style={{ left: `${positionPercent(index)}%` }}>
                  <div class={style.markers}></div>
                    {step.label}
                </div>
            ))}
        </div>
    </div>
  );
}