import { createStore } from "solid-js/store";
import env from "./env";
import { createSignal } from "solid-js";
import { StorageKeys, useReactiveLocalStorage } from "./localStorage";



const [windowProperties, setWindowProperties] = createStore({
  width: window.innerWidth,
  height: window.innerHeight,
  paneWidth: null as null | number,
  hasFocus: document.hasFocus(),
});



window.addEventListener("resize", () => {
  setWindowProperties('width', window.innerWidth)
  setWindowProperties('height', window.innerHeight)
})

window.addEventListener('focus', () => {
  setWindowProperties('hasFocus', true)
})
window.addEventListener('blur', () => {
  setWindowProperties('hasFocus', false)
})


function setPaneWidth(val: number) {
  setWindowProperties({ paneWidth: val });
}


const isMobileAgent = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const [blurEffectEnabled, setBlurEffectEnabled] = useReactiveLocalStorage(StorageKeys.BLUR_EFFECT_ENABLED, !isMobileAgent())



export function useWindowProperties() {
  const isWindowFocusedAndBlurEffectEnabled  = () => {
    if (!windowProperties.hasFocus) return false;
    return blurEffectEnabled();
  }

  return {
    blurEffectEnabled,
    setBlurEffectEnabled,
    isWindowFocusedAndBlurEffectEnabled,
    setPaneWidth,
    width: () => windowProperties.width,
    height: () => windowProperties.height,
    isMobileWidth: ()  => windowProperties.width <= env.MOBILE_WIDTH,
    paneWidth: () => windowProperties.paneWidth,
    hasFocus: () => windowProperties.hasFocus,
    isMobileAgent,
  }
}