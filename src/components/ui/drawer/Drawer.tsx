/* @refresh reload */
import styles from "./styles.module.scss";
import { useWindowProperties } from "@/common/useWindowProperties";
import {
  Accessor,
  children,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  JSX,
  JSXElement,
  on,
  onCleanup,
  Show,
  useContext,
} from "solid-js";
import SidePane from "@/components/side-pane/SidePane";
import { classNames, cn, conditionalClass } from "@/common/classNames";
import { matchComponent, useLocation } from "solid-navigator";
import { GlobalEventName, useEventListen } from "@/common/GlobalEvents";
import { useCustomPortal } from "../custom-portal/CustomPortal";
import { rightDrawerMode, StorageKeys } from "@/common/localStorage";
import { useResizeBar } from "../ResizeBar";

interface DrawerLayoutProps {
  LeftDrawer: any;
  Content: () => JSX.Element;
  RightDrawer: any;
  children?: JSXElement;
}

interface DrawerContext {
  currentPage: Accessor<number>;
  hasLeftDrawer: () => boolean;
  hasRightDrawer: () => boolean;
  toggleLeftDrawer: () => void;
  toggleRightDrawer: () => void;
  hideLeftDrawer: () => boolean;
  goToMain: () => void;
  toggleHideLeftDrawer: () => void;
  toggleHideRightDrawer: () => void;
}

const DrawerContext = createContext<DrawerContext>();

export default function DrawerLayout(props: DrawerLayoutProps) {
  const { openedPortals } = useCustomPortal();
  const location = useLocation();
  const [hideLeftDrawer, setHideLeftDrawer] = createSignal(false);
  const [hideRightDrawer, setHideRightDrawer] = createSignal(false);

  // createEffect(
  //   on(
  //     () => location.pathname,
  //     () => {
  //       setHideLeftDrawer(false);
  //       setHideRightDrawer(false);
  //     }
  //   )
  // );

  let containerEl: HTMLDivElement | undefined;
  const startPos = { x: 0, y: 0 };
  let startTransformX = 0;
  let transformX = 0;
  const [currentPage, setCurrentPage] = createSignal(1);
  let startTime = 0;
  let pauseTouches = false;

  const { width, isMobileWidth, isSafari, isFirefox } = useWindowProperties();
  const LeftDrawer = children(() => props.LeftDrawer());
  const RightDrawer = children(() => props.RightDrawer());

  const LeftDrawerComponent = matchComponent(() => "leftDrawer");
  const RightDrawerComponent = matchComponent(() => "rightDrawer");

  const hasLeftDrawer = createMemo(() => !!LeftDrawerComponent());
  const hasRightDrawer = createMemo(() => !!RightDrawerComponent());

  const [getRightDrawerMode] = rightDrawerMode;

  let transformString: string;
  let animationFrame: number;
  const setTransformX = (value: number) => {
    transformX = value;
    transformString = "translate3d(" + value + "px, 0, 0)";

    containerEl!.style.transform = transformString;
  };

  createEffect(
    on([isMobileWidth, hasLeftDrawer, hasRightDrawer], () => {
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
      });
    }),
  );

  const addEvents = () => {
    window.addEventListener("touchstart", onTouchStart, false);
    window.addEventListener("touchend", onTouchEnd, false);
    window.addEventListener("scroll", onScroll, true);
  };
  const removeEvents = () => {
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchend", onTouchEnd);
    window.removeEventListener("scroll", onScroll);
  };

  const leftDrawerWidth = () => {
    const dWidth = width() - 50;
    const MAX_WIDTH = hasLeftDrawer() ? 330 : 72;
    if (dWidth > MAX_WIDTH) return MAX_WIDTH;
    return dWidth;
  };

  const rightDrawerWidth = () => {
    const dWidth = width() - 30;
    const MAX_WIDTH = 300;
    if (dWidth > MAX_WIDTH) return MAX_WIDTH;
    return dWidth;
  };
  const totalWidth = () => rightDrawerWidth() + leftDrawerWidth() + width();

  let velocityTimeout: any;
  const updatePage = () => {
    if (!isMobileWidth()) return;
    velocityTimeout && clearTimeout(velocityTimeout);

    containerEl!.style.transition = "transform 0.2s";
    velocityTimeout = setTimeout(() => {
      containerEl!.style.transition = "";
    }, 200);
    if (currentPage() === 0) setTransformX(0);
    if (currentPage() === 1) setTransformX(-leftDrawerWidth());
    if (currentPage() === 2) setTransformX(-totalWidth() - -width());
  };

  const onTouchStart = (event: TouchEvent) => {
    const target = event.target as HTMLElement;

    if (target.closest(".mobileBottomPane")) {
      pauseTouches = true;
      return;
    }
    if (target.closest("input[type=range]")) {
      pauseTouches = true;
      return;
    }
    if (target.closest("input[type=text]")) {
      pauseTouches = true;
      return;
    }
    if (target.closest("canvas")) {
      pauseTouches = true;
      return;
    }

    if (target.closest("textarea")) {
      pauseTouches = true;
      return;
    }
    if (openedPortals().length) {
      pauseTouches = true;
      return;
    }

    pauseTouches = false;
    window.addEventListener("touchmove", onTouchMove, false);

    containerEl!.style.transition = "";
    startTransformX = transformX;
    const x = event.touches[0].clientX;
    const y = event.touches[0].clientY;
    startPos.x = x - transformX;
    startPos.y = y;
    startTime = Date.now();
  };

  let ignoreDistance = false;

  const onTouchMove = (event: TouchEvent) => {
    // Cancel previous animation frame
    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame);
    }

    animationFrame = window.requestAnimationFrame(() => {
      if (pauseTouches) {
        window.removeEventListener("touchmove", onTouchMove, false);
        return;
      }

      // Get current touch coordinates
      const x = event.touches[0]!.clientX;
      const y = event.touches[0]!.clientY;
      const touchDistance = x - startPos.x;

      // Detect vertical scrolling
      const XDistance = Math.abs(startTransformX - transformX);
      const YDistance = Math.abs(y - startPos.y);
      if (XDistance <= 3 && YDistance >= 7 && !ignoreDistance)
        return (pauseTouches = true);

      ignoreDistance = true;

      // Clamp position when on left drawer page
      if (currentPage() === 0 && -touchDistance >= rightDrawerWidth()) {
        return setTransformX(-rightDrawerWidth());
      }

      // Block right drawer swipe when not in swipe mode
      if (
        getRightDrawerMode() !== "SWIPE" &&
        currentPage() === 1 &&
        -touchDistance >= leftDrawerWidth()
      ) {
        return setTransformX(-leftDrawerWidth());
      }

      // Clamp position when on right drawer page
      if (currentPage() === 2 && -touchDistance <= rightDrawerWidth()) {
        return setTransformX(-rightDrawerWidth());
      }

      // Reset to center when swiping right
      if (touchDistance >= 0) {
        startPos.x = x;
        return setTransformX(0);
      }

      // Clamp position when no right drawer exists
      if (!hasRightDrawer() && -touchDistance >= leftDrawerWidth()) {
        return setTransformX(-leftDrawerWidth());
      }

      // Clamp maximum left swipe distance
      if (touchDistance <= -totalWidth() + width()) {
        startPos.x = x - transformX;
        return setTransformX(-totalWidth() + width());
      }

      // Update position based on touch movement
      setTransformX(touchDistance);
    });
  };
  const onTouchEnd = (event: TouchEvent) => {
    window.removeEventListener("touchmove", onTouchMove, false);

    ignoreDistance = false;
    pauseTouches = true;
    const isOnLeftDrawer =
      transformX - -leftDrawerWidth() >= leftDrawerWidth() / 2;
    const isOnRightDrawer =
      transformX - -(totalWidth() - width()) <= rightDrawerWidth() / 2;
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
      const isSwipingLeft = distance <= 0;
      const isSwipingRight = distance >= 1;

      if (isSwipingRight && beforePage <= 2) {
        setCurrentPage(beforePage + 1);
      } else if (isSwipingLeft && beforePage >= 0) {
        setCurrentPage(beforePage - 1);
      }
    }

    updatePage();
  };
  const onScroll = () => {
    if (isSafari || isFirefox) return;
    pauseTouches = true;
    updatePage();
  };

  const toggleLeftDrawer = () => {
    if (currentPage() === 0) {
      setCurrentPage(1);
    } else {
      setCurrentPage(0);
    }
    updatePage();
  };

  const toggleRightDrawer = () => {
    if (currentPage() === 2) {
      setCurrentPage(1);
    } else {
      setCurrentPage(2);
    }
    updatePage();
  };

  const goToMain = () => {
    if (currentPage() !== 1) {
      setCurrentPage(1);
    }
    updatePage();
  };

  const goToMainListener = useEventListen(GlobalEventName.DRAWER_GO_TO_MAIN);

  goToMainListener(() => goToMain());

  const drawer: DrawerContext = {
    currentPage,
    hasLeftDrawer,
    hasRightDrawer,
    toggleLeftDrawer,
    toggleRightDrawer,
    goToMain,
    hideLeftDrawer,
    toggleHideLeftDrawer: () => setHideLeftDrawer(!hideLeftDrawer()),
    toggleHideRightDrawer: () => setHideRightDrawer(!hideRightDrawer()),
  };

  const onOpacityClicked = () => {
    setCurrentPage(1);
    updatePage();
  };

  const leftDrawerResizeBar = useResizeBar({
    storageKey: StorageKeys.LEFT_DRAWER_WIDTH,
    defaultWidth: 330,
    minWidth: 200,
    maxWidth: 400,
    element: () => containerEl?.querySelector(".leftPane"),
  });
  const rightDrawerResizeBar = useResizeBar({
    storageKey: StorageKeys.RIGHT_DRAWER_WIDTH,
    defaultWidth: 300,
    minWidth: 200,
    maxWidth: 400,
    element: () => containerEl?.querySelector(".outerRightPane"),
    invert: true,
  });

  return (
    <DrawerContext.Provider value={drawer}>
      {props.children}
      <div
        class={classNames(
          styles.drawerLayout,
          conditionalClass(isMobileWidth(), styles.mobile),
        )}
      >
        <div
          ref={containerEl}
          class={styles.container}
          style={{
            translate: transformX + "px",
            overflow: isMobileWidth() ? "initial" : "hidden",
          }}
        >
          <div
            class={cn("leftPane", styles.leftPane)}
            style={{
              width: isMobileWidth()
                ? leftDrawerWidth() + "px"
                : hasLeftDrawer()
                  ? hideLeftDrawer()
                    ? "initial"
                    : leftDrawerResizeBar.width() + "px"
                  : "initial",
              display: "flex",
              gap: "4px",
              "flex-shrink": 0,
              position: "relative",
            }}
          >
            <SidePane
              class={cn(
                styles.sideBar,
                hasLeftDrawer() && !hideLeftDrawer()
                  ? styles.hasLeftDrawer
                  : "",
              )}
            />
            {hasLeftDrawer() && (
              <>
                <div
                  class={cn(
                    styles.leftDrawer,
                    isMobileWidth() && "mobileWidth",
                  )}
                  style={
                    hideLeftDrawer() && !isMobileWidth()
                      ? { display: "none" }
                      : {}
                  }
                >
                  {LeftDrawer()}
                </div>
                <Show when={!hideLeftDrawer()}>
                  <leftDrawerResizeBar.Handle right={-2} />
                </Show>
              </>
            )}
          </div>
          <div
            class={cn(
              styles.content,
              hasRightDrawer() && !hideRightDrawer()
                ? styles.hasRightDrawer
                : "",
              hasLeftDrawer() && !hideLeftDrawer() ? styles.hasLeftDrawer : "",
            )}
            style={{ width: isMobileWidth() ? width() + "px" : "100%" }}
          >
            <div
              style={{
                "pointer-events": currentPage() !== 1 ? "initial" : "none",
                opacity: currentPage() !== 1 ? 1 : 0,
              }}
              class={styles.opacityContent}
              onClick={onOpacityClicked}
            />
            <props.Content />
          </div>
          <div
            class={"outerRightPane"}
            style={{
              width: isMobileWidth()
                ? rightDrawerWidth() + "px"
                : hasRightDrawer()
                  ? hideRightDrawer()
                    ? "0"
                    : rightDrawerResizeBar.width() + "px"
                  : "0",
              display: "flex",
              "flex-shrink": 0,
              position: "relative",
            }}
          >
            <Show when={!hideRightDrawer() && hasRightDrawer()}>
              <rightDrawerResizeBar.Handle left={-2} />
            </Show>

            <div
              class={styles.rightPane}
              style={
                hideRightDrawer() && !isMobileWidth() ? { display: "none" } : {}
              }
            >
              {RightDrawer()}
            </div>
          </div>
        </div>
      </div>
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  return useContext(DrawerContext)!;
}
