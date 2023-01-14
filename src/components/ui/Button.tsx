import Icon from '@/components/ui/icon/Icon';
import { JSXElement } from 'solid-js';
import { styled } from 'solid-styled-components';
import Text from './Text';

interface Props {
  color?: string;
  class?: string;
  label?: string; 
  margin?: number;
  iconName?: string;
  onClick?: () => void;
  primary?: boolean;
  customChildren?: JSXElement
}

const ButtonContainer = styled("div")<{margin?: number}>`
  display: flex;
  text-align: center;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 10px;
  flex-shrink: 0;
  margin: ${props => props.margin !== undefined ? props.margin : 5}px;
  color: white;
  cursor: pointer;
  user-select: none;
  transition: 0.2s;
  background-color: rgba(255, 255, 255, 0.08);

  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }

  :nth-child(2) {
    margin-left: 5px;
  }
`;

export default function Button(props: Props) {

  const color = () => props.color || "var(--primary-color)";

  const style = () => ({
    ...(props.primary ? {"background-color": color()} : undefined),
  })


  return (
    <ButtonContainer margin={props.margin} style={style()}  class={`${props.class} button`} onClick={props.onClick}>
      { props.iconName && <Icon name={props.iconName} color={props.primary ? 'white' : color()} /> }
      { props.label && <Text class='label' color={props.primary ? 'white' : color()}>{props.label}</Text> }
      {props.customChildren && props.customChildren}
    </ButtonContainer>
  )
}