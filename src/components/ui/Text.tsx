import { styled } from "solid-styled-components";

interface TextProps {
  color?: string;
  opacity?: number;
  size?: number;
}

const Text = styled("div")<TextProps>`
  color: ${props => props.color || "white"};
  font-size: ${props => props.size || "16"}px;
  opacity: ${props => props.opacity || "1"};
`;

export default Text;