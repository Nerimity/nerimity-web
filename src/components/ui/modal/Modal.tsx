import style from "./Modal.module.scss";
import { createContext, JSXElement, Show, useContext } from "solid-js";
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
}
const Root = (props: RootProps) => {
  const { isMobileWidth } = useWindowProperties();

  const onBackgroundClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) props.close?.();
  };

  return (
    <ModalContext.Provider value={{ close: props.close }}>
      <div
        onMouseUp={onBackgroundClick}
        class={cn(
          style.modalBackground,
          isMobileWidth() ? style.mobile : undefined
        )}
      >
        <div class={cn(style.modalRoot, props.class)}>{props.children}</div>
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
      <Button
        iconName="close"
        color="var(--alert-color)"
        onClick={modal?.close}
        padding={0}
        margin={0}
      />
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
