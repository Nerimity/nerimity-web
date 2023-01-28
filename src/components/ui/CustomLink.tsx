import { AnchorProps, Link } from "@nerimity/solid-router";
import { JSX } from "solid-js";

interface CustomLinkProps extends AnchorProps {
  decoration?: boolean;
  noContextMenu?: boolean;
}

export function CustomLink(props: CustomLinkProps) {
  const styles: () => JSX.CSSProperties = () => ({
    ...(!props.decoration ? {"text-decoration": 'none'} : undefined)
  })

  const onContextMenu = (event: MouseEvent) => {
    if (!props.noContextMenu) return;
    event.preventDefault();
  }

  return <Link style={styles()} oncontextmenu={onContextMenu} {...props} />
}