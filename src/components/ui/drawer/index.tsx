import styles from './styles.module.scss'
import { useWindowProperties } from '@/common/useWindowProperties';
import {createEffect, createSignal, JSX, on, onCleanup, onMount} from 'solid-js';

interface DrawerLayoutProps {
  LeftDrawer: () => JSX.Element;
  Content: () => JSX.Element;
  RightDrawer: () => JSX.Element;
}





export default function DrawerLayout(props: DrawerLayoutProps) {

  let containerEl: HTMLDivElement | undefined = undefined;
  const [startPos, setStartPos] = createSignal({x: 0, y: 0});
  const [xTransform, setXTransform] = createSignal(0);
  const [currentPage, setCurrentPage] = createSignal(1);

  const {width} = useWindowProperties();

  
  
  
  const drawerWidth = () => {
    const dWidth = width() - 60;
    const MAX_WIDTH = 300;
    if (dWidth > MAX_WIDTH) return MAX_WIDTH;
    return dWidth;
  };
  const totalWidth = () => (drawerWidth() * 2) + width() 

  createEffect(on(currentPage, () => {
    setXTransform(-drawerWidth())
  }))

  const onTouchStart = (event: TouchEvent) => {
    const x = event.touches[0].clientX;
    const y = event.touches[0].clientY;
    setStartPos({x: x - xTransform(), y});
  }
  const onTouchMove = (event: TouchEvent) => {
    const x = event.touches[0].clientX;
    const touchDistance = x - startPos().x;
    if (touchDistance >=0) {
      setStartPos({...startPos(), x});
      return setXTransform(0);
    }
    if (touchDistance <= -totalWidth() + width() ) {

      setStartPos({...startPos(), x: x - xTransform()});
      return setXTransform(-totalWidth() + width());
    }
    setXTransform(touchDistance);
  }
  const onTouchEnd = () => {

  }
  const onScroll = () => {

  }

  onMount(() => {
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("scroll", onScroll, true);
    onCleanup(() => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("scroll", onScroll);
    })
  })


  return (
    <div class={styles.drawerLayout}>
      <div ref={containerEl} class={styles.container}  style={{translate: xTransform() + "px"}}>
        <div style={{width: drawerWidth() + "px", display: 'flex'}}><props.LeftDrawer/></div>
        <div class={styles.content} style={{width: width() + "px"}}><props.Content/></div>
        <div style={{width: drawerWidth() + "px", display: 'flex'}}><props.RightDrawer/></div>
      </div>
    </div>
  )
}