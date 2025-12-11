import { classNames, conditionalClass } from "@/common/classNames";
import { A, useSearchParams } from "solid-navigator";
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
  color: var(--text-color);
`;

const decoration = css`
  text-decoration: none;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const POST_LINK_REGEX = /^https?:\/\/nerimity\.com\/p\/(\d+)$/i;

export function CustomLink(props: CustomLinkProps) {
  const { createPortal } = useCustomPortal();
  const [, setSearchParams] = useSearchParams();

  const onContextMenu = (event: MouseEvent) => {
    props.onContextMenu?.(event);
    if (!props.noContextMenu) return;
    event.preventDefault();
  };

  const onLinkClick = (e: MouseEvent) => {
    const href = props.href;
    if (props.isDangerous) {
      e.preventDefault();
      createPortal((close) => (
        <DangerousLinkModal unsafeUrl={href || "#"} close={close} />
      ));
      return;
    }

    const match = href?.match(POST_LINK_REGEX);
    const postId = match ? match[1] : undefined;

    if (postId) {
      e.preventDefault();
      // Open post
      setSearchParams({ postId });

      return;
    }

    return props.onClick?.(e) || props.onclick?.(e);
  };

  return (
    <A
      onContextMenu={onContextMenu}
      {...props}
      onClick={onLinkClick}
      class={classNames(
        conditionalClass(props.decoration, decoration),
        conditionalClass(!props.decoration, noDecoration),
        props.class
      )}
    />
  );
}
