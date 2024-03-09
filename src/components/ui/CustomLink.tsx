import { classNames, conditionalClass } from "@/common/classNames";
import { A } from "solid-navigator";
import { css } from "solid-styled-components";
import { useCustomPortal } from "./custom-portal/CustomPortal";
import { DangerousLinkModal } from "./DangerousLinkModal";


type AProps = Parameters<typeof A>[0]; 

interface CustomLinkProps extends AProps {
  decoration?: boolean;
  noContextMenu?: boolean;
  isDangerous?: boolean;
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
  const {createPortal} = useCustomPortal();
  const onContextMenu = (event: MouseEvent) => {
    props.onContextMenu?.(event);
    if (!props.noContextMenu) return;
    event.preventDefault();
  };

  const onLinkClick = (e: MouseEvent) => {
    if (!props.isDangerous) return;
    e.preventDefault();
    createPortal(close => <DangerousLinkModal unsafeUrl={props.href || "#"} close={close} />);
  };

  return <A onContextMenu={onContextMenu} {...props} onClick={onLinkClick} class={classNames(conditionalClass(props.decoration, decoration), conditionalClass(!props.decoration, noDecoration), props.class)} />;
}