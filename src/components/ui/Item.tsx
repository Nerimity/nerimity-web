import { keyframes, styled } from "solid-styled-components";

interface ItemContainer {
  selected?: any;
  alert?: any;
  handlePosition?: "top" | "bottom" | "left" | "right"
}

const handleLeftBottomAnimate = keyframes`
  from {
    transform: scale(1, 0);
  }
  to {
    transform: scale(1, 1);
  }
`;
const handleTopBottomAnimate = keyframes`
  from {
    transform: scale(0, 1);
  }
  to {
    transform: scale(1, 1);
  }
`;

const ItemContainer = styled("div")<ItemContainer>`
  display: flex;
  position: relative;
  flex-shrink: 0;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
  user-select: none;
  align-items: center;
  text-decoration: none;
  &:after {
    content: '';
    position: absolute;
    width: 3px;
    height: 15px;

    ${props => props.handlePosition === "left" || !props.handlePosition ? 'left: 0' : undefined};
    ${props => props.handlePosition === "right" ? 'right: 0' : undefined};

    ${props => props.handlePosition === "top" ? `
      top: 0;
      height: 3px;
      width: 15px;
    ` : undefined}

    ${props => props.handlePosition === "bottom" ? `
      bottom: 0;
      height: 3px;
      width: 15px;
    ` : undefined}

    border-radius: 3px;
    transition: 0.2s;
  }  

  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }

  && {
    ${props => props.selected ? `
      background-color: rgba(255, 255, 255, 0.2);
      &:after {
        animation: ${ (props.handlePosition === "top" || props.handlePosition === "bottom") ? handleTopBottomAnimate : handleLeftBottomAnimate} 0.2s ease-in-out;
        background-color: var(--primary-color);
      } 
      ` : undefined}
    }
    
    && {
      ${props => props.alert ? `
      &:after {
        animation: ${ (props.handlePosition === "top" || props.handlePosition === "bottom") ? handleTopBottomAnimate : handleLeftBottomAnimate} 0.2s ease-in-out;
        background-color: var(--alert-color);
      } 
    ` : undefined}
    }
`;

export default ItemContainer;