import { createSignal, createContext, useContext, JSX, For } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { Portal } from "solid-js/web";

interface Value {
  createPortal: (element: (close: () => void) => JSX.Element, id?: string) => number | undefined
  closePortal: (index: number) => void
}

const CustomPortalContext = createContext<Value>();

interface CustomPortalProps {
  children: JSX.Element
}

export function CustomPortalProvider(props: CustomPortalProps) {

  const [elements, setElements] = createStore<{element: ((close: () => void) => JSX.Element), id?: string}[]>([]);

  
  const createPortal = (element: (close: () => void) => JSX.Element, id?: string) => {
    if (id && isPortalOpened(id)) return;
    setElements([...elements, {element, id}])
    return elements.length - 1;
  }
 
  const closePortal = (index: number) => {
    setElements(produce(elements => elements.splice(index, 1)));
  }
  const isPortalOpened = (id: string) => elements.find(e => e.id === id) !== undefined;

  const value = {
    createPortal,
    closePortal
  }
  

  return (
    <CustomPortalContext.Provider value={value}>
      <div style={{display: 'flex', height: '100%', width: '100%'}}>{props.children}</div>
      <For each={elements}>{(item, i) => <Portal>{item.element(() => closePortal(i()))}</Portal>}</For>
    </CustomPortalContext.Provider>
  );
}

export function useCustomPortal() { return useContext(CustomPortalContext) as Value; }