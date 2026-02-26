import { createStore } from "solid-js/store";
import env from "./env";
import { createMemo, createSignal } from "solid-js";
import { StorageKeys, useLocalStorage } from "./localStorage";

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const [windowProperties, setWindowProperties] = createStore({
  width: window.innerWidth,
  height: window.innerHeight,
  paneWidth: null as null | number,
  hasFocus: document.hasFocus(),
  reduceMotion: motionQuery.matches
});

window.addEventListener("resize", () => {
  setWindowProperties("width", window.innerWidth);
  setWindowProperties("height", window.innerHeight);
});

window.addEventListener("focus", () => {
  setWindowProperties("hasFocus", true);
});
window.addEventListener("blur", () => {
  setWindowProperties("hasFocus", false);
});

motionQuery.addEventListener("change", () => {
  setWindowProperties("reduceMotion", motionQuery.matches);
});

function setPaneWidth(val: number) {
  setWindowProperties({ paneWidth: val });
}

const isMobileAgent = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isFirefox = navigator.userAgent.includes("Firefox");
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isChrome = /^((?!chrome|android).)*chrome/i.test(navigator.userAgent);

const [blurEffectEnabled, setBlurEffectEnabled] = useLocalStorage(
  StorageKeys.BLUR_EFFECT_ENABLED,
  isChrome
);

export type ReduceMotionMode = "enabled" | "disabled" | "auto";

const [reduceMotionMode, setReduceMotionMode] =
  useLocalStorage<ReduceMotionMode>(StorageKeys.REDUCE_MOTION_MODE, "auto");

const [paneBackgroundColor, setPaneBackgroundColor] = createSignal<
  undefined | string
>(undefined);

const userReduceMotion = createMemo(() => {
  const mode = reduceMotionMode();
  const reduceMotion =
    mode == "auto" ? windowProperties.reduceMotion : mode == "enabled";
  return reduceMotion;
});

export function useWindowProperties() {
  const isWindowFocusedAndBlurEffectEnabled = () => {
    if (!windowProperties.hasFocus) return false;
    return blurEffectEnabled();
  };

  return {
    blurEffectEnabled,
    setBlurEffectEnabled,
    reduceMotionMode,
    setReduceMotionMode,
    isWindowFocusedAndBlurEffectEnabled,
    setPaneWidth,
    width: () => windowProperties.width,
    height: () => windowProperties.height,
    isMobileWidth: () => windowProperties.width <= env.MOBILE_WIDTH,
    isMainPaneMobileWidth: () =>
      (windowProperties.paneWidth || windowProperties.width) <= 600,
    paneWidth: () => windowProperties.paneWidth,
    hasFocus: () => windowProperties.hasFocus,
    reduceMotion: userReduceMotion,
    shouldAnimate: (hover: boolean = false) => {
      return windowProperties.hasFocus && (hover || !userReduceMotion());
    },
    isMobileAgent: () => isMobileAgent,
    isSafari,
    isFirefox,
    paneBackgroundColor,
    setPaneBackgroundColor
  };
}
