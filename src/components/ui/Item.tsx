import { styled } from "solid-styled-components";

interface ItemContainer {
  selected?: any;
  alert?: any;
}

const ItemContainer = styled("div")<ItemContainer>`
  display: flex;
  position: relative;
  flex-shrink: 0;
  border-radius: 4px;
  cursor: pointer;
  transition: 0.2s;
  user-select: none;
  align-items: center;
  text-decoration: none;
  &:after {
    content: '';
    position: absolute;
    left: 0;
    width: 3px;
    border-radius: 3px;
    height: 15px;
    transition: 0.2s;
  }  

  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }

  && {
    ${props => props.selected ? `
      background-color: rgba(255, 255, 255, 0.2);
      &:after {
        background-color: var(--primary-color);
      } 
    ` : undefined}
  }
  
  ${props => props.alert ? `
    &:after {
      background-color: var(--alert-color);
    } 
  ` : undefined}


`;

export default ItemContainer;