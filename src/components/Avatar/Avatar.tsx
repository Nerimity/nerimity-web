import styles from './styles.module.scss';

interface Props {
  hexColor: string;
  url?: string;
  size: number;
}

export default function Avatar(props: Props) {
  return (
    <div class={styles.avatar} style={{"background-color": props.hexColor, height: props.size + "px", width: props.size + "px"}}>
      {!props.url && <img class={styles.avatarImage} src="/assets/avatar.png" alt="User Avatar" />}
    </div>
  )
}