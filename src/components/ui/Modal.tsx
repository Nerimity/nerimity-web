import { JSX } from 'solid-js';
import { Portal } from 'solid-js/web';
import { keyframes, styled } from 'solid-styled-components';
import Text from './Text';


const showUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;


const BackgroundContainer = styled("div")`
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 1111;
`;

const ModalContainer = styled("div")`
  padding: 20px;
  background-color: var(--background-color);
  border: solid 1px rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  overflow: hidden;
`;

const TopBarContainer = styled("div")`
  margin-bottom: 10px;
`;

const Body = styled("div")`
  animation: ${showUp};
  animation-duration: 0.2s;
  animation-fill-mode: forwards;
`;


export default function Modal(props: {title: string, children: JSX.Element, close?: () => void}) {
  let mouseDownTarget: HTMLDivElement | null = null;

  const onBackgroundClick = (event: MouseEvent) => {
    if(mouseDownTarget?.closest("." + ModalContainer.class({}))) return; 
    props.close?.()
  }
  return (
      <Portal>
        <BackgroundContainer onclick={onBackgroundClick} onMouseDown={e => mouseDownTarget = e.target as any}>
          <ModalContainer>
            <TopBarContainer>
              <Text size={22} >{props.title}</Text>
            </TopBarContainer>
            <Body>{props.children}</Body>
          </ModalContainer>
        </BackgroundContainer>
      </Portal>
  )
}