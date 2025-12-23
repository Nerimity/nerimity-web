import { classNames, conditionalClass } from "@/common/classNames";
import { A, useNavigate, useSearchParams } from "solid-navigator";
import { css } from "solid-styled-components";
import { useCustomPortal } from "./custom-portal/CustomPortal";
import { DangerousLinkModal } from "./DangerousLinkModal";
import { openInviteBotModal } from "./openInviteBotModal";

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
const PROFILE_LINK_REGEX = /^https?:\/\/nerimity\.com\/app\/profile\/(\d+)$/i;
const BOT_INVITE_REGEX = /nerimity\.com\/bot\/(\d+)(?:\?perms=(\d+))?/i;

export function CustomLink(props: CustomLinkProps) {
  const { createPortal } = useCustomPortal();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  const onContextMenu = (event: MouseEvent) => {
    props.onContextMenu?.(event);
    if (!props.noContextMenu) return;
    event.preventDefault();
  };

  const onLinkClick = (e: MouseEvent) => {
    const href = props.href || "";
    const isNerimity = href.includes("nerimity.com");

    if (props.isDangerous && !isNerimity) {
      e.preventDefault();
      createPortal((close) => (
        <DangerousLinkModal unsafeUrl={href || "#"} close={close} />
      ));
      return;
    }

    // Bot Invite Links
    const botMatch = href.match(BOT_INVITE_REGEX);
    if (botMatch) {
      e.preventDefault();
      const appId = botMatch[1];
      const perms = botMatch[2] ? parseInt(botMatch[2]) : undefined;
      openInviteBotModal(createPortal, appId, perms);
      return;
    }

    // Post Redirects
    const postMatch = href.match(POST_LINK_REGEX);
    if (postMatch) {
      e.preventDefault();
      setSearchParams({ postId: postMatch[1] });
      return;
    }

    // Profile Redirects
    const profileMatch = href.match(PROFILE_LINK_REGEX);
    if (profileMatch) {
      e.preventDefault();
      navigate(`/app/profile/${profileMatch[1]}`);
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
