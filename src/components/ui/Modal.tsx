import { classNames } from '@/common/classNames';
import { useWindowProperties } from '@/common/useWindowProperties';
import { JSX, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { css, keyframes, styled } from 'solid-styled-components';
import { FlexColumn, FlexRow } from './Flexbox';
import Icon from './icon/Icon';
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

const ModalContainer = styled(FlexColumn)<{mobile: boolean}>`
  background-color: var(--background-color);
  border: solid 1px rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  overflow: hidden;
  align-self: ${props => props.mobile ? 'flex-end': 'center'};
  margin: ${props => props.mobile ? '10px': '0'};

  
`;

const TopBarContainer = styled(FlexRow)`
  align-items: center;
  padding: 10px;
  height: 30px;
  background: var(--pane-color);
  flex-shrink: 0;
  margin-bottom: 10px;
`;
const closeButtonStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  border-radius: 8px;
  width: 30px;
  height: 30px;
  cursor: pointer;
  transition: 0.2s;
  opacity: 0.7;
  &:hover {
    background: rgba(255,255,255,0.2);
    opacity: 1;
  }
`;
const topBarIconStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
  opacity: 0.7;
  margin-right: 7px;
`;

const Body = styled(FlexColumn)`
  overflow: hidden;
  animation: ${showUp};
  animation-duration: 0.2s;
  animation-fill-mode: forwards;
  padding: 10px;
  padding-top: 0;
  flex: 1;
`;

const ActionContainer = styled(FlexRow)`
  background: var(--pane-color);
`;


interface Props {
  children: JSX.Element;
  title: string;
  icon?: string;
  actionButtons?: JSX.Element;
  close?: () => void;
  ignoreBackgroundClick?: boolean
  class?: string;
}

export default function Modal(props: Props) {
  const {isMobileWidth} = useWindowProperties();
  let mouseDownTarget: HTMLDivElement | null = null;


  const onBackgroundClick = (event: MouseEvent) => {
    if (props.ignoreBackgroundClick)return;
    if(mouseDownTarget?.closest(".modal")) return; 
    props.close?.()
  }
  return (
      <Portal>
        <BackgroundContainer onclick={onBackgroundClick} onMouseDown={e => mouseDownTarget = e.target as any}>
          <ModalContainer mobile={isMobileWidth()} class={classNames(props.class, 'modal')}>
            <TopBarContainer>
              <Show when={props.icon}>
                <Icon class={topBarIconStyle} onClick={props.close} name={props.icon} size={18} />
              </Show>
              <Text size={16}>{props.title}</Text>
              <Show when={props.close}>
                <Icon class={closeButtonStyle} onClick={props.close} name='close' size={16} />
              </Show>
            </TopBarContainer>
            <Body>
              {props.children}
            </Body>
            <ActionContainer>
              {props.actionButtons}
            </ActionContainer>
          </ModalContainer>
        </BackgroundContainer>
      </Portal>
  )
}