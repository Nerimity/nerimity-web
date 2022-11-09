import Icon from '@/components/ui/icon/Icon';
import { styled } from 'solid-styled-components';
import Text from './Text';

interface Props {
  color?: string;
  class?: string;
  label?: string; 
  iconName?: string;
  onClick?: () => void;
  primary?: boolean;
}

const ButtonContainer = styled("div")`
  display: flex;
  text-align: center;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  padding: 10px;
  flex-shrink: 0;
  margin: 5px;
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

  const color = props.color || "var(--primary-color)";

  const style = {
    ...(props.primary ? {"background-color": color} : undefined),
  }


  return (
    <ButtonContainer style={style}  class={props.class} onClick={props.onClick}>
      { props.iconName && <Icon name={props.iconName} color={props.primary ? 'white' : color} /> }
      { props.label && <Text class='label' color={props.primary ? 'white' : color}>{props.label}</Text> }
    </ButtonContainer>
  )
}