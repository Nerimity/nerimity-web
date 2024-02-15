import { JSXElement, Show } from "solid-js";
import { FlexRow } from "./Flexbox";
import { css, styled } from "solid-styled-components";
import { CustomLink } from "./CustomLink";
import { Dynamic } from "solid-js/web";
import Icon from "./icon/Icon";

interface BreadcrumbProps {
  children: JSXElement
}

interface BreadcrumbItemProps {
  title?: string;
  icon?: string;
  href?: string;
}

const BreadcrumbContainer = styled(FlexRow)`
  align-items: center;
  gap: 4px;
  margin-bottom: 15px;
  flex-wrap: wrap;
`;

export default function Breadcrumb(props: BreadcrumbProps) {
  return (<BreadcrumbContainer children={props.children} />);
}


const breadcrumbItemStyles = css`
  display: flex;
  align-items: center;
  position: relative;
  border-radius: 8px;
  padding: 5px;
  height: 20px;
  cursor: pointer;
  user-select: none;
  transition: 0.2s;
  color: rgba(255, 255, 255, 0.5);
  margin-right: 14px;

  font-size: 12px;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &:hover, &:last-child {
    color: white;
  }

  &:last-child {
    font-weight: bold;
    &:after {display: none;}
    &:hover {background-color: transparent;}
    cursor: default;
    pointer-events: none;
  }

  &:after {
    position: absolute;
    content: ">";
    right: -15px;
    color: rgba(255, 255, 255, 0.5);
    pointer-events: none;
  }
`;
export function BreadcrumbItem(props: BreadcrumbItemProps) {
  return (
    <Dynamic class={breadcrumbItemStyles} component={props.href ? CustomLink : "div"} href={props.href!}>
      <Show when={props.icon}><Icon class={css`color: inherit;`} style={props.title ? {"margin-right": "5px"} : undefined} size={22} name={props.icon}/></Show>
      <Show when={props.title}>{props.title}</Show>
    </Dynamic>
  );
}