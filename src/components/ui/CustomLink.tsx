import { classNames, conditionalClass } from "@/common/classNames";
import { A } from "solid-navigator";
import { css } from "solid-styled-components";


type AProps = Parameters<typeof A>[0]; 

interface CustomLinkProps extends AProps {
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
    props.onContextMenu?.(event);
    if (!props.noContextMenu) return;
    event.preventDefault();
  };

  return <A onContextMenu={onContextMenu} {...props} class={classNames(conditionalClass(props.decoration, decoration), conditionalClass(!props.decoration, noDecoration), props.class)} />;
}