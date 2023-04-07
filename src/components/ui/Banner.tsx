import { JSX, JSXElement, Show, createMemo } from "solid-js";
import { FlexColumn } from "./Flexbox";
import { styled } from "solid-styled-components";
import { useWindowProperties } from "@/common/useWindowProperties";


const BannerContainer = styled(FlexColumn)`
  display: flex;
  position: relative;  
  flex-shrink: 0;
  aspect-ratio: 30/9;
  border-radius: 8px;
`;
  
const BannerImage = styled("img")`
  position: absolute;
  inset: 0;
  border-radius: 8px;
  filter: brightness(70%);
  object-fit: cover;
  height: 100%;
  width: 100%;
`;

const SolidColor = styled("div")<{color: string}>`
  position: absolute;
  inset: 0;
  border-radius: 8px;
  filter: brightness(70%);
  object-fit: cover;
  height: 100%;
  width: 100%;
  background: ${props => props.color};
`;


export function Banner(props: { margin?: number; hexColor?: string, url?: string | null, maxHeight?: number; animate?: boolean; children?: JSXElement }) {

  const { hasFocus } = useWindowProperties();


  const url = () => {
    let url = props.url;
    if (!url) return;

    if (!url?.endsWith(".gif")) return url;
    if (!hasFocus()) return url + "?type=webp";
    if (props.animate) return url;
    return url + "?type=webp";
  };

  const getStyles = () => {
    let styles: JSX.CSSProperties = {}

    if (props.maxHeight) {
      styles["max-height"] = props.maxHeight + "px";
    }

    styles.margin = (props.margin === undefined ? 10 : props.margin) + "px";
    return styles;
  }

  return (
    <BannerContainer style={getStyles()}>
      <Show when={url()}><BannerImage src={url()} alt="Banner"/></Show>
      <Show when={!url()}><SolidColor color={props.hexColor!} /></Show>
      {props.children}
    </BannerContainer>
  )
}