import {
  createEffect,
  createSignal,
  JSX,
  JSXElement,
  Match,
  on,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { classNames, conditionalClass } from "@/common/classNames";
import styles from "./styles.module.scss";
import { styled } from "solid-styled-components";
import Text from "../Text";
import { FlexRow } from "../Flexbox";

interface Error {
  message: string;
  path: string;
}
interface Props {
  label?: string;
  type?: string;
  value?: string;
  onText?: (value: string) => void;
  onBlur?(event: FocusEvent): void;
  onFocus?(event: FocusEvent): void;
  error?: Error | string | null;
  success?: string | false;
  errorName?: string | string[];
  class?: string;
  height?: number;
  minHeight?: number;
  prefix?: string;
  suffix?: string | JSXElement;
  placeholder?: string;
  ref?: (el: HTMLInputElement | HTMLTextAreaElement) => void;
  margin?: number | number[];
  maxLength?: number;
  onInput?: (event: InputEvent) => void;
  primaryColor?: string;
  onChange?: JSX.ChangeEventHandlerUnion<HTMLInputElement, Event>;
  disabled?: boolean;
  onClick?: (event: MouseEvent) => void;
}

const Base = styled("div")<{ margin?: number | number[] }>`
  display: flex;
  flex-direction: column;
  margin: ${(props) =>
    props.margin !== undefined
      ? typeof props.margin === "object"
        ? props.margin.join("px ")
        : props.margin
      : 0}px;

  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type="number"] {
    -moz-appearance: textfield;
  }
  input[type="datetime-local"] {
    color-scheme: dark;
  }
`;

const Label = styled(Text)`
  margin-bottom: 4px;
  margin-left: 2px;
`;

const ErrorLabel = styled(Text)`
  margin-top: 4px;
  margin-left: 2px;
`;

const CustomInput = styled("input")`
  outline: none;
  background: transparent;
  width: 100%;
  border: none;
  color: white;
  padding: 10px;
`;
const CustomTextArea = styled("textarea")`
  outline: none;
  background: transparent;
  width: 100%;
  height: 100%;
  border: none;
  color: white;
  padding: 10px;
  max-height: 200px;
`;

const PrefixLabel = styled(Text)`
  padding-left: 10px;
  margin-right: -10px;
  place-self: center;
  white-space: nowrap;
`;

const SuffixLabel = styled(Text)`
  place-self: center;
  padding-right: 10px;
`;

const InputContainer = styled(FlexRow)<{
  focused: boolean;
  primaryColor?: string;
}>`
  position: relative;
  border-radius: 8px;
  border: solid 1px rgba(255, 255, 255, 0.2);
  background-color: rgba(0, 0, 0, 0.6);
  border-bottom: solid 1px rgba(255, 255, 255, 0.3);
  transition: 0.2s;
  cursor: text;
  ${(props) =>
    props.focused
      ? `border-bottom: solid 1px ${
          props.primaryColor || "var(--primary-color)"
        };`
      : ""}
`;

export default function Input(props: Props) {
  const [isFocused, setFocused] = createSignal(false);
  let inputEl: undefined | HTMLInputElement | HTMLTextAreaElement;

  onMount(() => {
    props.ref?.(inputEl as HTMLInputElement | HTMLTextAreaElement);
  });

  const error = () => {
    if (props.error && typeof props.error !== "string") {
      const errorField = props.errorName || props.label;
      if (Array.isArray(errorField)) {
        if (
          errorField
            .map((e) => e.toLowerCase())
            .includes(props.error.path.toLowerCase())
        ) {
          return props.error.message;
        }
      } else if (
        errorField?.toLowerCase() === props.error.path?.toLowerCase()
      ) {
        return props.error.message;
      }
    }
    if (typeof props.error === "string") {
      return props.error;
    }
  };
  const focus = (event?: MouseEvent) => {
    event?.preventDefault();
    inputEl?.focus();
  };

  createEffect(
    on(
      () => props.value,
      () => {
        auto_grow();
      }
    )
  );

  function auto_grow() {
    if (inputEl?.tagName !== "TEXTAREA") return;
    inputEl.style.height = "5px";
    inputEl.style.height = inputEl.scrollHeight - 20 + "px";
  }

  const onChange = (event: any) => {
    props.onInput?.(event);
    auto_grow();
    props.onText?.(event.target.value);
  };

  const onBlur = (event: FocusEvent) => {
    setFocused(false);
    props.onBlur?.(event);
  };

  const onFocus = (event: FocusEvent) => {
    setFocused(true);
    props.onFocus?.(event);
  };
  return (
    <Base margin={props.margin} class={props.class}>
      <Show when={props.label}>
        <Label size={14} color="rgba(255, 255, 255, 0.8)">
          {props.label}
        </Label>
      </Show>
      <InputContainer primaryColor={props.primaryColor} focused={isFocused()}>
        <Show when={props.prefix}>
          <PrefixLabel opacity={0.6} onmousedown={focus} size={12}>
            {props.prefix}
          </PrefixLabel>
        </Show>
        <Show when={props.type === "textarea"}>
          <CustomTextArea
            maxlength={props.maxLength}
            placeholder={props.placeholder}
            style={{
              "min-height": props.minHeight
                ? `${props.minHeight}px`
                : undefined,
              height: `${props.height}px`,
            }}
            ref={inputEl}
            onfocus={onFocus}
            onblur={onBlur}
            onInput={onChange}
            value={props.value || ""}
          />
        </Show>
        <Show when={props.type !== "textarea"}>
          <CustomInput
            disabled={props.disabled}
            onchange={props.onChange}
            maxlength={props.maxLength}
            placeholder={props.placeholder}
            ref={inputEl}
            onfocus={onFocus}
            onblur={onBlur}
            onInput={onChange}
            type={props.type || "text"}
            value={props.value || ""}
            onClick={props.onClick}
          />
        </Show>
        <Show when={props.suffix}>
          <Switch fallback={props.suffix}>
            <Match when={typeof props.suffix === "string"}>
              <SuffixLabel opacity={0.6} onmousedown={focus} size={12}>
                {props.suffix}
              </SuffixLabel>
            </Match>
          </Switch>
        </Show>
      </InputContainer>
      <Show when={error()}>
        <ErrorLabel color="var(--alert-color)" size={14}>
          {error()}
        </ErrorLabel>
      </Show>
      <Show when={props.success}>
        <ErrorLabel color="var(--success-color)" size={14}>
          {props.success}
        </ErrorLabel>
      </Show>
    </Base>
  );
}
