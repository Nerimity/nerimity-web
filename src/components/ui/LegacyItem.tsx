import { JSX } from "solid-js/jsx-runtime";
import { keyframes, styled } from "solid-styled-components";

interface ItemContainer {
  selected?: any;
  alert?: any;
  handlePosition?: "top" | "bottom" | "left" | "right";
  handleColor?: string;
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
  border-radius: 6px;
  cursor: pointer;
  transition: 0.2s;
  user-select: none;
  align-items: center;
  text-decoration: none;

  ${(props) =>
    props.handlePosition === "top" || props.handlePosition === "bottom"
      ? "justify-content: center;"
      : ""}

  &:after {
    content: "";
    position: absolute;
    width: 3px;
    height: 15px;

    ${(props) =>
      props.handlePosition === "left" || !props.handlePosition
        ? "left: 0"
        : undefined};
    ${(props) => (props.handlePosition === "right" ? "right: 0" : undefined)};

    ${(props) =>
      props.handlePosition === "top"
        ? `
      top: 0;
      height: 3px;
      width: 15px;
    `
        : undefined}

    ${(props) =>
      props.handlePosition === "bottom"
        ? `
      bottom: 0;
      height: 3px;
      width: 15px;
    `
        : undefined}

    border-radius: 3px;
    transition: 0.2s;
  }

  &:hover {
    background-color: var(--drawer-item-hover-background-color);
  }

  && {
    ${(props) =>
      props.selected
        ? `
      background-color: var(--drawer-item-background-color);
      &:after {
        animation: ${
          props.handlePosition === "top" || props.handlePosition === "bottom"
            ? handleTopBottomAnimate
            : handleLeftBottomAnimate
        } 0.2s ease-in-out;
        background-color: ${props.handleColor || "var(--primary-color)"};
      } 
      `
        : undefined}
  }

  && {
    ${(props) =>
      props.alert
        ? `
      &:after {
        animation: ${
          props.handlePosition === "top" || props.handlePosition === "bottom"
            ? handleTopBottomAnimate
            : handleLeftBottomAnimate
        } 0.2s ease-in-out;
        background-color: var(--alert-color);
      } 
    `
        : undefined}
  }
`;

type ItemProps = ItemContainer & JSX.HTMLAttributes<HTMLDivElement>;

export default (props: ItemProps) => {
  return <ItemContainer {...props} data-selected={!!props.selected} />;
};
