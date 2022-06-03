import styles from './styles.module.scss';

interface Error {message: string, path: string};
interface Props {
  label: string, 
  type?: string, 
  value?: string,
  onText?: (value: string) => void, 
  error?: Error | string
  errorName?: string
}


export default function Input(props: Props) {


  const error = () => {
    let error = "";
  
    if (props.error && typeof props.error !== 'string') {
      let errorField = props.errorName || props.label
      if (errorField.toLowerCase() === props.error.path.toLowerCase()){
        error = props.error.message;
      }
    }
    if (typeof props.error === 'string') {
      error = props.error;
    }
    return error;
  }

  const onChange = (event: any) => props.onText?.(event.target.value);
  return (
    <div class={styles.inputContainer}>
      <div class={styles.label}>{props.label}</div>
        <input onChange={onChange} class={styles.input} type={props.type || "text"} value={props.value || undefined} />
        {error() && <div class={styles.errorMessage}>{error()}</div>}
    </div>

  )
}