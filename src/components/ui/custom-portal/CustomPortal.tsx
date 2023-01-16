import { createSignal, createContext, useContext, JSX, For } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { Portal } from "solid-js/web";

interface Value {
  createPortal: (element: (close: () => void) => JSX.Element) => number
  closePortal: (index: number) => void
}

const CustomPortalContext = createContext<Value>();

interface CustomPortalProps {
  children: JSX.Element
}

export function CustomPortalProvider(props: CustomPortalProps) {

  const [elements, setElements] = createStore<((close: () => void) => JSX.Element)[]>([]);

  
  const createPortal = (element: (close: () => void) => JSX.Element) => {
    setElements([...elements, element])
    return elements.length - 1;
  }
 
  const closePortal = (index: number) => {
    setElements(produce(elements => elements.splice(index, 1)));
  }

  const value = {
    createPortal,
    closePortal
  }
  

  return (
    <CustomPortalContext.Provider value={value}>
      <div style={{display: 'flex', height: '100%', width: '100%'}}>{props.children}</div>
      <For each={elements}>{(element, i) => <Portal>{element(() => closePortal(i()))}</Portal>}</For>
    </CustomPortalContext.Provider>
  );
}

export function useCustomPortal() { return useContext(CustomPortalContext) as Value; }