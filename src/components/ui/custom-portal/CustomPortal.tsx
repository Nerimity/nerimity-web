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
  closePortal: (id: string) => void;
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
  const id = "toast-" + Math.random();
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
      id: id
    }
  ]);
};

export const prompt = (
  body: string,
  title?: string,
  icon?: string,
  onSubmit?: (value: string) => void
) => {
  const id = "prompt-" + Math.random();
  setElements((e) => [
    ...e,
    {
      element: (close) => (
        <ToastModal
          icon={icon}
          close={close}
          body={body}
          title={title || "Alert"}
          onSubmit={onSubmit}
          prompt
        />
      ),
      id: id
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
    const portalId = id || "portal-" + Math.random();
    if (id && toggle) {
      if (isPortalOpened(id)) {
        closePortalById(id);
        return;
      }
    }
    if (id && isPortalOpened(id)) return;
    setElements([...elements, { element, id: portalId }]);
    return portalId;
  };

  const closePortal = async (id: string) => {
    const index = elements.findIndex((e) => e.id === id);
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
        {(item) => (
          <PortalItem
            item={item}
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
  closePortal: (id: string) => void;
  setElements: SetStoreFunction<Item[]>;
}) => {
  const close = () => {
    if (props.item.id) {
      props.closePortal(props.item.id);
    }
  };

  const setCustomCloseHandler = (customCloseHandler: () => void) => {
    const index = elements.findIndex((e) => e.id === props.item.id);
    if (index !== -1) {
      props.setElements(index, "customCloseHandler", () => customCloseHandler);
    }
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
