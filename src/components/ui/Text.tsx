import { styled } from "solid-styled-components";

interface TextProps {
  color?: string;
  opacity?: number;
  size?: number;
  bold?: boolean;
}

const Text = styled("span")<TextProps>`
  color: ${props => props.color || "white"};
  font-size: ${props => props.size || "16"}px;
  opacity: ${props => props.opacity || "1"};
  ${props => props.bold ? `font-weight: bold` : ''};
`;

export default Text;