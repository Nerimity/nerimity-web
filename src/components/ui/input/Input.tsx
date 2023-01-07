import { createSignal, Show } from 'solid-js';
import { classNames, conditionalClass } from '@/common/classNames';
import styles from './styles.module.scss';
import { styled } from 'solid-styled-components';
import Text from '../Text';
import { FlexRow } from '../Flexbox';

interface Error {message: string, path: string};
interface Props {
  label?: string, 
  type?: string, 
  value?: string,
  onText?: (value: string) => void, 
  error?: Error | string | null
  errorName?: string
  class?: string;
  height?: number;
  prefix?: string;
  placeholder?: string;
}


const Base = styled("div")`
  display: flex;
  flex-direction: column;
  margin-top: 10px;
  margin-bottom: 10px;
`;

const Label = styled(Text)`
  margin-bottom: 5px;
`;

const ErrorLabel = styled(Text)`
  margin-top: 5px;
  font-size: 14px;
`;


const CustomInput = styled("input")`
  outline: none;
  background: transparent;
  width: 100%;
  height: 100%;
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
`;

const PrefixLabel = styled(Text)`
  padding-top: 12px;
  padding-left: 10px;
  margin-right: -10px;
`;

const InputContainer = styled(FlexRow)<{focused: boolean}>`
  position: relative;
  border-radius: 8px;
  border: solid 1px rgba(255, 255, 255, 0.2);
  background-color: rgba(0, 0, 0, 0.6);
  border-bottom: solid 2px rgba(255, 255, 255, 0.3);
  transition: 0.2s;
  cursor: text;
  ${props => props.focused ? "border-bottom: solid 2px var(--primary-color);" : ''}
`;

export default function Input(props: Props) {
  let [isFocused, setFocused] = createSignal(false);
  let inputEl: undefined | HTMLInputElement = undefined;
  const error = () => {
    let error = "";
  
    if (props.error && typeof props.error !== 'string') {
      let errorField = props.errorName || props.label
      if (errorField?.toLowerCase() === props.error.path?.toLowerCase()){
        error = props.error.message;
      }
    }
    if (typeof props.error === 'string') {
      error = props.error;
    }
    return error;
  }
  const focus = (event?: MouseEvent) => {
    event?.preventDefault();
    inputEl?.focus()
  }

  const onChange = (event: any) => props.onText?.(event.target.value);
  return (
    <Base class={props.class}>
      <Show when={props.label}><Label color='rgba(255, 255, 255, 0.8)'>{props.label}</Label></Show>
      <InputContainer focused={isFocused()}>
        <Show when={props.prefix}><PrefixLabel opacity={0.6} onmousedown={focus} size={12}>{props.prefix}</PrefixLabel></Show>
        <Show when={props.type === "textarea"}><CustomTextArea placeholder={props.placeholder} style={{height: `${props.height}px`}} ref={inputEl} onfocus={() => setFocused(true)} onblur={() => setFocused(false)} onInput={onChange} value={props.value || ""} /></Show>
        <Show when={props.type !== "textarea"}><CustomInput ref={inputEl} onfocus={() => setFocused(true)} onblur={() => setFocused(false)} onInput={onChange} type={props.type || "text"} value={props.value || ""} /></Show>
      </InputContainer>
      <Show when={error()}><ErrorLabel color="var(--alert-color)">{error()}</ErrorLabel></Show>
    </Base>

  )
}