import styles from './Skeleton.module.scss'
import { For, JSX } from "solid-js"

const SkeletonList = (props: {count?: number, children: JSX.Element; style?: JSX.CSSProperties}) => {
  return (
    <div class={styles.skeletonList} style={props.style}>
      <For each={Array(props.count ?? 30).fill(undefined)}>
        {() => props.children}
      </For>
    </div>
  )
}

const SkeletonItem = (props: {width?: string, height?: string, style?: JSX.CSSProperties}) => {
  const style: JSX.CSSProperties = {
    ...(props.height ? {height: props.height} : undefined),
    ...(props.width ? {width: props.width} : undefined),
    ...props.style,
  }
  return (
    <div style={style} class={styles.skeletonItem} />
  )
}

export const Skeleton = {
  List: SkeletonList,
  Item: SkeletonItem
}