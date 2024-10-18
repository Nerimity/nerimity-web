import { onCleanup, onMount } from "solid-js";
import { electronWindowAPI } from "./Electron";
import { createStore, reconcile } from "solid-js/store";

export const [downKeys, setDownKeys] = createStore<(string | number)[]>([]);

const onMouseDown = (e: MouseEvent) => {
  if (e.button === 0) return;
  const code = `MOUSE ${e.button}`;
  if (!downKeys.includes(code)) {
    setDownKeys([...downKeys, code]);
  }
};
const onMouseUp = (e: MouseEvent) => {
  if (e.button === 0) return;
  const code = `MOUSE ${e.button}`;
  setDownKeys(downKeys.filter((k) => k !== code));
};

const onKeyDown = (e: KeyboardEvent) => {
  let code = e.code || e.key;
  if (code.startsWith("Key")) {
    code = code.slice(3);
  }
  if (!downKeys.includes(code)) {
    setDownKeys([...downKeys, code]);
  }
};

const onKeyUp = (e: KeyboardEvent) => {
  let code = e.code || e.key;
  if (code.startsWith("Key")) {
    code = code.slice(3);
  }
  setDownKeys(downKeys.filter((k) => k !== code));
};

if (electronWindowAPI()?.isElectron) {
  electronWindowAPI()?.onGlobalKey(({ event }) => {
    if (event.name === "MOUSE LEFT") return;
    if (event.state === "DOWN") {
      setDownKeys([...downKeys, event.name.trim() || event.vKey]);
    } else {
      setDownKeys(
        downKeys.filter((k) => k !== event.name.trim() && k !== event.vKey)
      );
    }
  });
}

export const useGlobalKey = () => {
  let started = false;
  const start = () => {
    started = true;
    if (!electronWindowAPI()?.isElectron) {
      document.addEventListener("mousedown", onMouseDown);
      document.addEventListener("mouseup", onMouseUp);
      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("keyup", onKeyUp);
      return;
    }
    electronWindowAPI()?.startGlobalKeyListener();
  };

  const stop = () => {
    if (!started) return;
    setDownKeys(reconcile([]));
    if (!electronWindowAPI()?.isElectron) {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      return;
    }
    electronWindowAPI()?.stopGlobalKeyListener();
  };

  onCleanup(() => {
    stop();
  });

  return { start, stop };
};
