import { styled } from "solid-styled-components";

interface FlexRowProps {
  gap?: number;
  itemsCenter?: boolean
} 

interface FlexColumnProps {
  gap?: number;
} 

export const FlexRow = styled("div")<FlexRowProps>`
  display: flex;
  gap: ${props => props.gap || 0}px;
  ${props => props.itemsCenter ? 'align-items: center;' : ''}
`;

export const FlexColumn = styled("div")<FlexColumnProps>`
  display: flex;
  flex-direction: column;
  gap: ${props => props.gap || 0}px;
`;
