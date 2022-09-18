import styles from './styles.module.scss'
import { useWindowProperties } from '@/common/useWindowProperties';
import {createEffect, createSignal, JSX, on, onCleanup, onMount} from 'solid-js';
import env from '@/common/env';

interface DrawerLayoutProps {
  LeftDrawer: () => JSX.Element;
  Content: () => JSX.Element;
  RightDrawer: () => JSX.Element;
}





export default function DrawerLayout(props: DrawerLayoutProps) {

  let containerEl: HTMLDivElement | undefined = undefined;
  const [startPos, setStartPos] = createSignal({x: 0, y: 0});
  const [startTransformX, setStartTransformX] = createSignal(0);
  const [transformX, setTransformX] = createSignal(0);
  const [currentPage, setCurrentPage] = createSignal(1);
  let startTime = 0;
  let pauseTouches = false;

  const {width} = useWindowProperties();

  const isMobile = () => width() <= env.MOBILE_WIDTH;

  
  
  createEffect(on(isMobile, () => {
    if (isMobile()) {
      addEvents();
      updatePage();
    }
    if (!isMobile()) {
      removeEvents();
      setTransformX(0);
    }


    onCleanup(() => {
      removeEvents();
    })
  }))

  const addEvents = () => {
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("scroll", onScroll, true);
  }
  const removeEvents = () => {
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
    window.removeEventListener("scroll", onScroll);
  }



  
  const drawerWidth = () => {
    const dWidth = width() - 60;
    const MAX_WIDTH = 300;
    if (dWidth > MAX_WIDTH) return MAX_WIDTH;
    return dWidth;
  };
  const totalWidth = () => (drawerWidth() * 2) + width() 

  let velocityTimeout: any;
  const updatePage = () => {
    if (!isMobile()) return;
    velocityTimeout && clearTimeout(velocityTimeout);

    containerEl!.style.transition = `translate 0.2s`
    velocityTimeout = setTimeout(() => {
      containerEl!.style.transition = "";
    }, 200)  
    if (currentPage() === 0) setTransformX(0);
    if (currentPage() === 1) setTransformX(-drawerWidth());
    if (currentPage() === 2) setTransformX(-totalWidth() - -width());
  }


  const onTouchStart = (event: TouchEvent) => {
    const target = event.target as HTMLElement;

    if (target.closest("input[type=range]")) {
      pauseTouches = true;
      return;
    }
    if (target.closest("input[type=text]")) {
      pauseTouches = true;
      return;
    }

    if (target.closest("textarea")) {
      pauseTouches = true;
      return;
    }

    pauseTouches = false;

    containerEl!.style.transition = "";
    setStartTransformX(transformX());
    const x = event.touches[0].clientX;
    const y = event.touches[0].clientY;
    setStartPos({x: x - transformX(), y});
    startTime = Date.now();
  }


  let ignoreDistance = false;

  const onTouchMove = (event: TouchEvent) => {
    if (pauseTouches) return;
    const x = event.touches[0].clientX;
    const y = event.touches[0].clientY;
    const touchDistance = x - startPos().x;

    const XDistance = Math.abs(startTransformX() - transformX());
    const YDistance = Math.abs(y - startPos().y);
    if (XDistance <= 3 && YDistance >= 7 && !ignoreDistance) return pauseTouches = true;


    ignoreDistance = true;

    if (currentPage() === 0 && -touchDistance >= drawerWidth() ) {
      return setTransformX(-drawerWidth());
    }


    if (currentPage() === 2 && -touchDistance <= drawerWidth()) {
      return setTransformX(-drawerWidth());
    }
    if (touchDistance >=0) {
      setStartPos({...startPos(), x});
      return setTransformX(0);
    }
    if (touchDistance <= -totalWidth() + width() ) {
      setStartPos({...startPos(), x: x - transformX()});
      return setTransformX(-totalWidth() + width());
    }




    setTransformX(touchDistance);
  }
  const onTouchEnd = (event: TouchEvent) => {
    ignoreDistance = false;
    pauseTouches = false;
    const isOnLeftDrawer = transformX() - -drawerWidth() >= drawerWidth() /2;
    const isOnRightDrawer = transformX() - -(totalWidth() - width())<= drawerWidth() /2;
    const isOnContent = !isOnLeftDrawer && !isOnRightDrawer;

    const beforePage = currentPage();
    
    
    if (isOnLeftDrawer) setCurrentPage(0);
    if (isOnContent) setCurrentPage(1);
    if (isOnRightDrawer) setCurrentPage(2);


    const distance = startTransformX() - transformX();
    const time = Date.now() - startTime;
    const velocity = Math.abs(distance / time);


    if (time <= 150 && velocity >= 0.5) {
      const isSwipingLeft = distance <=0;
      const isSwipingRight = distance >=1;

      if (isSwipingRight && beforePage <= 2) {
        setCurrentPage(beforePage+1);
      } else if (isSwipingLeft && beforePage >=0) {
        setCurrentPage(beforePage-1);
      }
    }



    updatePage();


  }
  const onScroll = () => {
    pauseTouches = true;
    updatePage();
  }



  return (
    <div class={styles.drawerLayout}>
      <div ref={containerEl} class={styles.container}  style={{translate: transformX() + "px"}}>
        <div style={{width: drawerWidth() + "px", display: 'flex', "flex-shrink": 0}}><props.LeftDrawer/></div>
        <div class={styles.content} style={{width: isMobile() ? width() + "px" : '100%'}}><props.Content/></div>
        <div style={{width: isMobile() ? drawerWidth() + "px" : '250px', display: 'flex', "flex-shrink": 0}}><props.RightDrawer/></div>
      </div>
    </div>
  )
}