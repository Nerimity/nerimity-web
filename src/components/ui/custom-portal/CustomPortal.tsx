import {
  createContext,
  useContext,
  JSX,
  For,
  lazy,
  ComponentProps
} from "solid-js";
import { createStore, produce, SetStoreFunction } from "solid-js/store";
import { Dynamic, Portal } from "solid-js/web";

const ToastModal = lazy(() => import("../toasts/ToastModal"));

const registeredPortals = {
  ProfileFlyout: lazy(
    () => import("@/components/floating-profile/FloatingProfile")
  )
};

type RegisteredPortal = typeof registeredPortals;

interface PortalBaseValue {
  createRegisteredPortal: <T extends keyof RegisteredPortal>(
    component: T,
    props: ComponentProps<RegisteredPortal[T]>,
    id?: string,
    toggle?: boolean
  ) => void;
  createPortal: (
    element: (close: () => void) => JSX.Element,
    id?: string,
    toggle?: boolean
  ) => number | undefined;
  closePortal: (index: number) => void;
  closePortalById: (id: string) => void;
  isPortalOpened: (id: string) => boolean;
  openedPortals: () => {
    element: (close: () => void) => JSX.Element;
    id?: string;
  }[];
}

type CustomCloseHandler = () => Promise<unknown>;

interface PortalItemValue {
  close: () => void;
  setCustomCloseHandler: (customCloseHandler: CustomCloseHandler) => void;
}

const CustomPortalBaseContext = createContext<PortalBaseValue>();
const CustomPortalItemContext = createContext<PortalItemValue>();

interface CustomPortalProps {
  children: JSX.Element;
}

interface Item {
  element: (close: () => void) => JSX.Element;
  id?: string;
  customCloseHandler?: CustomCloseHandler;
  closing?: boolean;
}
const [elements, setElements] = createStore<Item[]>([]);

export const toast = (body: string, title?: string, icon?: string) => {
  setElements((e) => [
    ...e,
    {
      element: (close) => (
        <ToastModal
          icon={icon}
          close={close}
          body={body}
          title={title || "Alert"}
        />
      ),
      id: "toast-" + Math.random()
    }
  ]);
};

export function CustomPortalProvider(props: CustomPortalProps) {
  function createRegisteredPortal<T extends keyof RegisteredPortal>(
    component: T,
    props: ComponentProps<RegisteredPortal[T]>,
    id?: string,
    toggle?: boolean
  ) {
    createPortal(
      (c) => (
        <Dynamic
          component={registeredPortals[component]}
          {...props}
          close={c}
        />
      ),
      id,
      toggle
    );
  }

  const createPortal = (
    element: (close: () => void) => JSX.Element,
    id?: string,
    toggle?: boolean
  ) => {
    if (id && toggle) {
      if (isPortalOpened(id)) {
        closePortalById(id);
        return;
      }
    }
    if (id && isPortalOpened(id)) return;
    setElements([...elements, { element, id }]);
    return elements.length - 1;
  };

  const closePortal = async (index: number) => {
    const element = elements[index];
    if (!element) return;
    if (element?.closing) return;
    setElements(index, "closing", true);
    await element?.customCloseHandler?.();
    setElements(produce((elements) => elements.splice(index, 1)));
  };
  const closePortalById = async (id: string) => {
    const element = elements.find((e) => e.id === id);
    if (!element) return;
    if (element?.closing) return;
    const index = elements.findIndex((e) => e.id === id);
    setElements(index, "closing", true);
    await element?.customCloseHandler?.();
    setElements(elements.filter((e) => e.id !== id));
  };

  const isPortalOpened = (id: string) =>
    elements.find((e) => e.id === id) !== undefined;
  const openedPortals = () => elements;

  const value = {
    createPortal,
    closePortal,
    closePortalById,
    isPortalOpened,
    openedPortals,
    createRegisteredPortal
  };

  return (
    <CustomPortalBaseContext.Provider value={value}>
      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          height: "100%",
          width: "100%"
        }}
      >
        {props.children}
      </div>
      <For each={elements}>
        {(item, i) => (
          <PortalItem
            item={item}
            i={i()}
            closePortal={closePortal}
            setElements={setElements}
          />
        )}
      </For>
    </CustomPortalBaseContext.Provider>
  );
}

const PortalItem = (props: {
  item: Item;
  i: number;
  closePortal: (index: number) => void;
  setElements: SetStoreFunction<Item[]>;
}) => {
  const close = () => {
    props.closePortal(props.i);
  };

  const setCustomCloseHandler = (customCloseHandler: () => void) => {
    props.setElements(props.i, "customCloseHandler", () => customCloseHandler);
  };

  return (
    <CustomPortalItemContext.Provider value={{ close, setCustomCloseHandler }}>
      <Portal>{props.item.element(close)}</Portal>
    </CustomPortalItemContext.Provider>
  );
};

export function useCustomPortalItem() {
  return useContext(CustomPortalItemContext) as PortalItemValue;
}

export function useCustomPortal() {
  return useContext(CustomPortalBaseContext) as PortalBaseValue;
}
