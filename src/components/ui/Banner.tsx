import { JSX, JSXElement, Show, createMemo } from "solid-js";
import { FlexColumn } from "./Flexbox";
import { styled } from "solid-styled-components";
import { useWindowProperties } from "@/common/useWindowProperties";


const BannerContainer = styled(FlexColumn)<{radius: number}>`
  display: flex;
  position: relative;  
  aspect-ratio: 30/12;
  flex-shrink: 0;
  border-radius: ${props => props.radius}px;
`;
  
const BannerImage = styled("img")<{brightness?: number; radius: number}>`
  position: absolute;
  inset: 0;
  border-radius: ${props => props.radius}px;
  filter: brightness(${props => props.brightness === undefined ? "70" : props.brightness }%);
  object-fit: cover;
  height: 100%;
  width: 100%;
`;

const SolidColor = styled("div")<{color: string; brightness?: number; radius: number}>`
  position: absolute;
  inset: 0;
  border-radius: ${props => props.radius}px;
  filter: brightness(${props => props.brightness === undefined ? "70" : props.brightness }%);
  object-fit: cover;
  height: 100%;
  width: 100%;
  background: ${props => props.color};
`;


export function Banner(props: {radius?: number; brightness?: number; class?: string; margin?: number; hexColor?: string, url?: string | null, maxHeight?: number; animate?: boolean; children?: JSXElement }) {

  const { hasFocus } = useWindowProperties();


  const url = () => {
    const url = props.url;
    if (!url) return;

    if (!url?.endsWith(".gif")) return url;
    if (!hasFocus()) return url + "?type=webp";
    if (props.animate) return url;
    return url + "?type=webp";
  };

  const getStyles = () => {
    const styles: JSX.CSSProperties = {
      width: "100%"
    };

    if (props.maxHeight !== undefined) {
      styles["max-height"] = props.maxHeight + "px";
    } 


    return styles;
  };

  const getOuterStyles = () => {

    return {
      padding: (props.margin === undefined ? 10 : props.margin) + "px",
      display: "flex"
    }
  }

  return (
    <div style={getOuterStyles()}>
      <BannerContainer radius={props.radius || 8} class={props.class}  style={getStyles()}>
        <Show when={url()}><BannerImage class="banner-inner" radius={props.radius || 8} brightness={props.brightness} src={url()} alt="Banner"/></Show>
        <Show when={!url()}><SolidColor class="banner-inner" radius={props.radius || 8} brightness={props.brightness} color={props.hexColor!} /></Show>
        {props.children}
      </BannerContainer>
    </div>
  );
}