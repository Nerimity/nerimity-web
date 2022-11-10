import { styled } from "solid-styled-components";

interface FlexRowProps {
  gap?: number;
} 

export const FlexRow = styled("div")<FlexRowProps>`
  display: flex;
  gap: ${props => props.gap || 0}px;
`;

export const FlexColumn = styled("div")`
  display: flex;
  flex-direction: column;
`;
