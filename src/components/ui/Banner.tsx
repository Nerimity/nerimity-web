import { JSX, JSXElement, Show, createMemo } from "solid-js";
import { FlexColumn } from "./Flexbox";
import { styled } from "solid-styled-components";
import { useWindowProperties } from "@/common/useWindowProperties";

const BannerContainer = styled(FlexColumn)<{ radius: number }>`
  display: flex;
  position: relative;
  aspect-ratio: 30/12;
  flex-shrink: 0;
  border-radius: ${(props) => props.radius}px;
  overflow: hidden;
  width: 100%;
`;

const BannerImage = styled("img")<{ brightness?: number; radius: number }>`
  position: absolute;
  inset: 0;
  border-radius: ${(props) => props.radius}px;
  filter: brightness(
    ${(props) => (props.brightness === undefined ? "70" : props.brightness)}%
  );
  object-fit: cover;
  height: 100%;
  width: 100%;
`;

const SolidColor = styled("div")<{
  color: string;
  brightness?: number;
  radius: number;
}>`
  position: absolute;
  inset: 0;
  border-radius: ${(props) => props.radius}px;
  filter: brightness(
    ${(props) => (props.brightness === undefined ? "70" : props.brightness)}%
  );
  object-fit: cover;
  height: 100%;
  width: 100%;
  background: ${(props) => props.color};
`;

export function Banner(props: {
  resize?: number;
  radius?: number;
  brightness?: number;
  class?: string;
  margin?: number;
  hexColor?: string;
  url?: string | null;
  maxHeight?: number;
  animate?: boolean;
  children?: JSXElement;
}) {
  const { hasFocus } = useWindowProperties();

  const url = () => {
    if (!props.url) return;
    const url = new URL(props.url);

    if (props.resize) {
      url.searchParams.set("size", props.resize.toString());
    }

    if (!props.url?.endsWith(".gif") && !props.url.endsWith("#a"))
      return url.href;

    if (!hasFocus() || !props.animate) {
      url.searchParams.set("type", "webp");
    }

    return url.href;
  };

  const getStyles = () => {
    const styles: JSX.CSSProperties = {
      flex: "1",
    };

    if (props.maxHeight !== undefined) {
      styles["max-height"] = props.maxHeight + "px";
    }

    return styles;
  };

  const getOuterStyles = () => {
    return {
      padding: (props.margin === undefined ? 10 : props.margin) + "px",
      display: "flex",
      "flex-shrink": "0",
      overflow: "hidden",
    };
  };

  return (
    <div style={getOuterStyles()}>
      <BannerContainer
        radius={props.radius || 8}
        class={props.class}
        style={getStyles()}
      >
        <Show when={url()}>
          <BannerImage
            class="banner-inner"
            radius={props.radius || 8}
            brightness={props.brightness}
            src={url()}
            alt="Banner"
          />
        </Show>
        <Show when={!url()}>
          <SolidColor
            class="banner-inner"
            radius={props.radius || 8}
            brightness={props.brightness}
            color={props.hexColor!}
          />
        </Show>
        {props.children}
      </BannerContainer>
    </div>
  );
}
