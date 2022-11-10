import { styled } from "solid-styled-components";

interface FlexRowProps {
  gap?: number;
} 

interface FlexColumnProps {
  gap?: number;
} 

export const FlexRow = styled("div")<FlexRowProps>`
  display: flex;
  gap: ${props => props.gap || 0}px;
`;

export const FlexColumn = styled("div")<FlexColumnProps>`
  display: flex;
  flex-direction: column;
  gap: ${props => props.gap || 0}px;
`;
