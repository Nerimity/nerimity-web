import { classNames, conditionalClass } from "@/common/classNames";
import { AnchorProps, Link } from "@solidjs/router";
import { css } from "solid-styled-components";

interface CustomLinkProps extends AnchorProps {
  decoration?: boolean;
  noContextMenu?: boolean;
}

const noDecoration = css`
  text-decoration: none;
  color: white;
  &:focus {
    outline: solid 1px;
  }
`;

const decoration = css`
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

export function CustomLink(props: CustomLinkProps) {
  const onContextMenu = (event: MouseEvent) => {
    if (!props.noContextMenu) return;
    event.preventDefault();
  }

  return <Link oncontextmenu={onContextMenu} {...props} class={classNames(conditionalClass(props.decoration, decoration), conditionalClass(!props.decoration, noDecoration), props.class)} />
}