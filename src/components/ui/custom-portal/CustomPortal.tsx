import { createSignal, createContext, useContext, JSX, For } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { Portal } from "solid-js/web";

const CustomPortalContext = createContext<(element: (close: () => void) => JSX.Element) => void>();

interface CustomPortalProps {
  children: JSX.Element
}

export function CustomPortalProvider(props: CustomPortalProps) {

  const [elements, setElements] = createStore<((close: () => void) => JSX.Element)[]>([]);

  
  const createPortal = (element: (close: () => void) => JSX.Element) => {
    setElements([...elements, element])
  }
 
  const onCloseClick = (index: number) => {
    setElements(produce(elements => elements.splice(index, 1)))
  }
  

  return (
    <CustomPortalContext.Provider value={createPortal}>
      <div style={{display: 'flex', height: '100%', width: '100%'}}>{props.children}</div>
      <For each={elements}>{(element, i) => <Portal>{element(() => onCloseClick(i()))}</Portal>}</For>
    </CustomPortalContext.Provider>
  );
}

export function useCustomPortal() { return useContext(CustomPortalContext); }