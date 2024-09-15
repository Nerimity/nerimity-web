import Icon from "@/components/ui/icon/Icon";
import { JSX, JSXElement, splitProps } from "solid-js";
import Text from "./Text";
import { cn } from "@/common/classNames";
import style from "./Button.module.scss";
import { Dynamic } from "solid-js/web";
import { A } from "solid-navigator";

export type ButtonProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  "color"
> & {
  color?: string | null;
  label?: string;
  margin?: number | number[];
  padding?: number | number[];
  iconSize?: number;
  textSize?: number;
  iconName?: string;
  primary?: boolean;
  customChildren?: JSXElement;
  customChildrenLeft?: JSXElement;
  href?: string;
  styles?: JSX.CSSProperties;
  tabIndex?: string;
  hoverText?: string;
  iconClass?: string;
  alert?: boolean;
};

export default function Button(props: ButtonProps) {
  const [customProps, ogProps] = splitProps(props, [
    "color",
    "label",
    "margin",
    "padding",
    "iconSize",
    "textSize",
    "iconName",
    "primary",
    "customChildren",
    "href",
    "customChildrenLeft",
    "styles",
    "tabIndex",
    "hoverText",
    "iconClass",
    "alert",
  ]);
  const color = () =>
    customProps.alert
      ? "var(--alert-color)"
      : customProps.color || "var(--primary-color)";

  const btnStyle = () => ({
    ...(customProps.primary ? { "background-color": color() } : {}),
    margin:
      props.margin !== undefined
        ? typeof props.margin === "object"
          ? props.margin.join("px ") + "px"
          : props.margin + "px"
        : undefined,
    padding:
      props.padding !== undefined
        ? typeof props.padding === "object"
          ? props.padding.join("px ") + "px"
          : props.padding + "px"
        : undefined,
    ...customProps.styles,
  });

  return (
    <Dynamic
      component={customProps.href ? A : "button"}
      href={customProps.href}
      {...ogProps}
      title={customProps.hoverText}
      tabindex={customProps.tabIndex}
      style={btnStyle()}
      class={cn(
        style.container,
        props.class,
        customProps.primary && style.primary,
        "button"
      )}
    >
      {customProps.customChildrenLeft && customProps.customChildrenLeft}
      {customProps.iconName && (
        <Icon
          class={customProps.iconClass}
          size={customProps.iconSize}
          name={customProps.iconName}
          color={customProps.primary ? "white" : color()}
        />
      )}
      {customProps.label && (
        <Text
          size={customProps.textSize || 14}
          class="label"
          color={customProps.primary ? "white" : color()}
        >
          {customProps.label}
        </Text>
      )}
      {customProps.customChildren && customProps.customChildren}
    </Dynamic>
  );
}
