import style from "./Modal.module.scss";
import {
  createContext,
  createEffect,
  JSXElement,
  onCleanup,
  onMount,
  Show,
  useContext,
} from "solid-js";
import Button, { ButtonProps } from "../Button";
import Icon from "../icon/Icon";
import { cn } from "@/common/classNames";
import { useWindowProperties } from "@/common/useWindowProperties";

const ModalContext = createContext<{
  close?: () => void;
}>();

interface RootProps {
  children: JSXElement;
  close?: () => void;
  class?: string;
  /**
   @default true
  */
  closeOnEscape?: boolean;
  doNotCloseOnBackgroundClick?: boolean;
  desktopMaxWidth?: number;
}
const Root = (props: RootProps) => {
  const { isMobileWidth } = useWindowProperties();

  let startClick = { x: 0, y: 0 };
  let textSelected = false;

  const onBackgroundClick = (event: MouseEvent) => {
    if (props.doNotCloseOnBackgroundClick) return;
    if (event.target !== event.currentTarget) return;

    const xDistance = Math.abs(startClick.x - event.clientX);
    const yDistance = Math.abs(startClick.y - event.clientY);

    const clickedPos = xDistance > 3 || yDistance > 3;
    if (clickedPos || textSelected) {
      return;
    }

    props.close?.();
  };

  const onMouseDown = (event: MouseEvent) => {
    startClick = {
      x: event.clientX,
      y: event.clientY,
    };
    textSelected = !!window.getSelection()?.toString();
  };

  onMount(() => {
    const closeOnEscape = props.closeOnEscape ?? true;
    if (!closeOnEscape) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") props.close?.();
    };
    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => document.removeEventListener("keydown", onKeyDown));
  });

  return (
    <ModalContext.Provider value={{ close: props.close }}>
      <div
        onMouseUp={onBackgroundClick}
        onMouseDown={onMouseDown}
        class={cn(
          style.modalBackground,
          isMobileWidth() ? style.mobile : undefined
        )}
      >
        <div
          class={cn(style.modalRoot, props.class)}
          style={{
            ...(!isMobileWidth() && props.desktopMaxWidth
              ? { "max-width": props.desktopMaxWidth + "px" }
              : {}),
          }}
        >
          {props.children}
        </div>
      </div>
    </ModalContext.Provider>
  );
};

interface HeaderProps {
  title: string;
  icon?: string;
  alert?: boolean;
}
const Header = (props: HeaderProps) => {
  const modal = useContext(ModalContext);
  return (
    <div class={style.modalHeader}>
      <div class={style.titleAndIcon}>
        <Show when={props.icon}>
          <Icon
            name={props.icon}
            color={props.alert ? "var(--alert-color)" : "var(--primary-color)"}
            class={style.modalHeaderIcon}
          />
        </Show>
        <span style={{ color: props.alert ? "var(--alert-color)" : undefined }}>
          {props.title}
        </span>
      </div>
      <Show when={modal?.close}>
        <Button
          iconName="close"
          color="var(--alert-color)"
          onClick={modal?.close}
          padding={0}
          margin={0}
        />
      </Show>
    </div>
  );
};

interface BodyProps {
  children: JSXElement;
  class?: string;
}
const Body = (props: BodyProps) => {
  return <div class={cn(style.modalBody, props.class)}>{props.children}</div>;
};

interface FooterProps {
  children: JSXElement;
}

const Footer = (props: FooterProps) => {
  return <div class={style.modalFooter}>{props.children}</div>;
};

const ModalButton = (props: ButtonProps) => {
  return <Button {...props} margin={0} />;
};

export const Modal = {
  Root,
  Header,
  Body,
  Footer,
  Button: ModalButton,
};
