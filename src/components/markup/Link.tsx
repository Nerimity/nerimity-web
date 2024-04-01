import { CustomLink } from "../ui/CustomLink";

export function Link(props: { url: string, text?: string; }) {
  const safeUrl = () => {
    const startsWithHttp = props.url.startsWith("http://");
    const startsWithHttps = props.url.startsWith("https://");
    if (startsWithHttp || startsWithHttps) return props.url;
    return `https://${props.url}`;
  };

  return (
    <CustomLink decoration isDangerous={!!props.text && props.text !== safeUrl()} href={safeUrl()} target="_blank" rel="noopener noreferrer">{props.text || safeUrl()}</CustomLink>
  );
}