import { CustomLink } from "../ui/CustomLink";
import { DangerousLinkModal } from "../ui/DangerousLinkModal";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";

export function Link(props: { url: string, text?: string; }) {
  const {createPortal} = useCustomPortal();
  const safeUrl = () => {
    const startsWithHttp = props.url.startsWith("http://");
    const startsWithHttps = props.url.startsWith("https://")
    if (startsWithHttp || startsWithHttps) return props.url;
    return `https://${props.url}`
  }
  const onClick = (event: any) => {
    if (props.text === undefined) return;
    if (props.text === safeUrl()) return; 
    event?.preventDefault();
    createPortal(close => <DangerousLinkModal unsafeUrl={props.url} close={close} />)
  }

  return (
    <CustomLink decoration href={safeUrl()} target="_blank" rel="noopener noreferrer" onClick={onClick}>{props.text || safeUrl()}</CustomLink>
  )
}