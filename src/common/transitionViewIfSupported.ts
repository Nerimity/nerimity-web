export const transitionViewIfSupported = (updateCb: () => void) => {
  if (document.startViewTransition) {
    document.startViewTransition(updateCb);
  } else {
    updateCb();
  }
};
