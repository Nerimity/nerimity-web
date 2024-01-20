/* @refresh reload */
import styles from './styles.module.scss'
import { useWindowProperties } from '@/common/useWindowProperties';
import {Accessor, children, ChildrenReturn, createContext, createEffect, createMemo, createSignal, JSX, on, onCleanup, onMount, Show, useContext} from 'solid-js';
import env from '@/common/env';
import SidePane from '@/components/side-pane/SidePane';
import { classNames, conditionalClass } from '@/common/classNames';
import { matchComponent } from 'solid-navigator';

interface DrawerLayoutProps {
  LeftDrawer: any;
  Content: () => JSX.Element;
  RightDrawer: any;
}


interface DrawerContext {
  currentPage: Accessor<number>
  hasLeftDrawer: () => boolean
  hasRightDrawer: () => boolean
  toggleLeftDrawer: () => void;
  toggleRightDrawer: () => void;
  goToMain: () => void;
}

const DrawerContext = createContext<DrawerContext>();


export default function DrawerLayout(props: DrawerLayoutProps) {
  
  let containerEl: HTMLDivElement | undefined = undefined;
  const startPos = {x: 0, y: 0};
  let startTransformX = 0;
  let transformX = 0;
  const [currentPage, setCurrentPage] = createSignal(1);
  let startTime = 0;
  let pauseTouches = false;

  const {width, isMobileWidth} = useWindowProperties();
  const LeftDrawer = children(() => props.LeftDrawer())
  const RightDrawer = children(() => props.RightDrawer())

  const LeftDrawerComponent = matchComponent(() => "leftDrawer")
  const RightDrawerComponent = matchComponent(() => "rightDrawer")
  
  
  
  const hasLeftDrawer = createMemo(() => !!LeftDrawerComponent());
  const hasRightDrawer = createMemo(() => !!RightDrawerComponent());


  let transformString: string;
  let animationFrame: number;
  const setTransformX = (value: number) => {
    transformX = value;
    transformString = "translate3d(" + value + "px, 0, 0)";

    animationFrame && window.cancelAnimationFrame(animationFrame);
    
    animationFrame = window.requestAnimationFrame(function() {
      containerEl!.style.transform = transformString;
    });
  }
  

  
  
  createEffect(on([isMobileWidth, hasLeftDrawer, hasRightDrawer], () => {
    if (isMobileWidth()) {
      addEvents();
      updatePage();
    }
    if (!isMobileWidth()) {
      setCurrentPage(1);
      removeEvents();
      setTransformX(0);
    }


    onCleanup(() => {
      removeEvents();
    })
  }))

  const addEvents = () => {
    window.addEventListener("touchstart", onTouchStart, false);
    window.addEventListener("touchmove", onTouchMove, false);
    window.addEventListener("touchend", onTouchEnd, false);
    window.addEventListener("scroll", onScroll, true);
  }
  const removeEvents = () => {
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
    window.removeEventListener("scroll", onScroll);
  }



  
  const leftDrawerWidth = () => {
    const dWidth = width() - 60;
    const MAX_WIDTH =  hasLeftDrawer() ? 300 : 65;
    if (dWidth > MAX_WIDTH) return MAX_WIDTH;
    return dWidth;
  };

  const rightDrawerWidth = () => {
    const dWidth = width() - 60;
    const MAX_WIDTH = 300;
    if (dWidth > MAX_WIDTH) return MAX_WIDTH;
    return dWidth;
  };
  const totalWidth = () => (rightDrawerWidth() + leftDrawerWidth()) + width() 

  let velocityTimeout: any;
  const updatePage = () => {
    if (!isMobileWidth()) return;
    velocityTimeout && clearTimeout(velocityTimeout);

    containerEl!.style.transition = `transform 0.2s`
    velocityTimeout = setTimeout(() => {
      containerEl!.style.transition = "";
    }, 200)  
    if (currentPage() === 0) setTransformX(0);
    if (currentPage() === 1) setTransformX(-leftDrawerWidth());
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
    startTransformX = transformX;
    const x = event.touches[0].clientX;
    const y = event.touches[0].clientY;
    startPos.x =  x - transformX;
    startPos.y = y;
    startTime = Date.now();
  }


  let ignoreDistance = false;

  const onTouchMove = (event: TouchEvent) => {
    if (pauseTouches) return;
    const x = event.touches[0].clientX;
    const y = event.touches[0].clientY;
    const touchDistance = x - startPos.x;

    const XDistance = Math.abs(startTransformX - transformX);
    const YDistance = Math.abs(y - startPos.y);
    if (XDistance <= 3 && YDistance >= 7 && !ignoreDistance) return pauseTouches = true;

    ignoreDistance = true;

    if (currentPage() === 0 && -touchDistance >= rightDrawerWidth() ) {
      return setTransformX(-rightDrawerWidth());
    }

    if (currentPage() === 2 && -touchDistance <= rightDrawerWidth()) {
      return setTransformX(-rightDrawerWidth());
    }

    if (touchDistance >=0) {
      startPos.x = x;
      return setTransformX(0);
    }

    if (!hasRightDrawer() && -touchDistance >= leftDrawerWidth() ) {
      return setTransformX(-leftDrawerWidth());
    }

    if (touchDistance <= -totalWidth() + width() ) {
      startPos.x = x - transformX
      return setTransformX(-totalWidth() + width());
    }

    setTransformX(touchDistance);
  }
  const onTouchEnd = (event: TouchEvent) => {
    ignoreDistance = false;
    pauseTouches = false;
    const isOnLeftDrawer = transformX - -leftDrawerWidth() >= leftDrawerWidth() /2;
    const isOnRightDrawer = transformX - -(totalWidth() - width())<= rightDrawerWidth() /2;
    const isOnContent = !isOnLeftDrawer && !isOnRightDrawer;

    const beforePage = currentPage();
    
    
    if (isOnLeftDrawer) setCurrentPage(0);
    if (isOnContent) setCurrentPage(1);
    if (isOnRightDrawer) setCurrentPage(2);

    if (isOnRightDrawer && !hasRightDrawer()) {
      setCurrentPage(1);
    }


    const distance = startTransformX - transformX;
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


  const toggleLeftDrawer = () => {
    if (currentPage() === 0) {
      setCurrentPage(1);
    } else {
      setCurrentPage(0);
    }
    updatePage()
  }

  const toggleRightDrawer = () => {
    if (currentPage() === 2) {
      setCurrentPage(1);
    } else {
      setCurrentPage(2);
    }
    updatePage()
  }
  
  const goToMain = () =>  {
    if (currentPage() !== 1) {
      setCurrentPage(1);
    }
    updatePage();
  }


  const drawer = {
    currentPage,
    hasLeftDrawer,
    hasRightDrawer,
    toggleLeftDrawer,
    toggleRightDrawer,
    goToMain,
  }

  const onOpacityClicked = () => {
    setCurrentPage(1);
    updatePage();
  }


  return (
    <DrawerContext.Provider value={drawer}>
      <div class={classNames(styles.drawerLayout, conditionalClass(isMobileWidth(), styles.mobile))}>
        <div ref={containerEl} class={styles.container}  style={{translate: transformX + "px", overflow: isMobileWidth() ? 'initial' : 'hidden'}}>
          <div style={{width: isMobileWidth() ? leftDrawerWidth() + "px" : hasLeftDrawer() ? "330px" : '65px', display: 'flex', "flex-shrink": 0}}>
            <SidePane/>
            {hasLeftDrawer() && <div class={styles.leftDrawer}>{LeftDrawer()}</div>}
          </div>
          <div class={styles.content} style={{width: isMobileWidth() ? width() + "px" : '100%'}}>
            <div style={{
              "pointer-events": currentPage() !== 1 ? 'initial' :'none',
              "opacity": currentPage() !== 1 ? 1 :0,
            }} class={styles.opacityContent} onclick={onOpacityClicked}/>
            <props.Content/>
          </div>
          <div style={{width: isMobileWidth() ? rightDrawerWidth() + "px" : hasRightDrawer() ? '300px' : '0', display: 'flex', "flex-shrink": 0}}>
            <div class={styles.rightPane}>{RightDrawer()}</div>
          </div>
        </div>
      </div>
    </DrawerContext.Provider>
  )
}




export function useDrawer() { 
  return useContext(DrawerContext)!;
}