import { createStore } from "solid-js/store";



const [windowProperties, setWindowProperties] = createStore({
  width: window.innerWidth,
  paneWidth: null as null | number,
  hasFocus: document.hasFocus(),
});



window.addEventListener("resize", () => {
  setWindowProperties('width', window.innerWidth)
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
export function useWindowProperties() {

  return {
    setPaneWidth,
    width: () => windowProperties.width,
    paneWidth: () => windowProperties.paneWidth,
    hasFocus: () => windowProperties.hasFocus,
    isMobileAgent: () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
  }
}