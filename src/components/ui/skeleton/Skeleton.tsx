import { useWindowProperties } from "@/common/useWindowProperties";
import styles from "./Skeleton.module.scss";
import { For, JSX, onCleanup, onMount } from "solid-js";
import { classNames, conditionalClass } from "@/common/classNames";

const SkeletonList = (props: {count?: number, children: JSX.Element; style?: JSX.CSSProperties}) => {
  return (
    <div class={styles.skeletonList} style={props.style}>
      <For each={Array(props.count ?? 30).fill(undefined)}>
        {() => props.children}
      </For>
    </div>
  );
};

const SkeletonItem = (props: {width?: string, height?: string, style?: JSX.CSSProperties; onInView?: () => void}) => {
  const {hasFocus} = useWindowProperties();
  let element : HTMLDivElement | undefined;

  const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting) {
      props.onInView?.();
    }
  };

  onMount(() => {
    if (props.onInView) {
      const observer = new IntersectionObserver(handleIntersection);

      observer.observe(element!);

      onCleanup(() => {
        observer.disconnect();
      });
    }
  });


  const style: JSX.CSSProperties = {
    ...(props.height ? {height: props.height} : undefined),
    ...(props.width ? {width: props.width} : undefined),
    ...props.style
  };
  return (
    <div ref={element} style={style} class={classNames(styles.skeletonItem, conditionalClass(!hasFocus(), styles.stopAnimate))} />
  );
};

export const Skeleton = {
  List: SkeletonList,
  Item: SkeletonItem
};