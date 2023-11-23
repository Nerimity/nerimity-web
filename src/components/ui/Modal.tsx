import { classNames } from '@/common/classNames';
import { useWindowProperties } from '@/common/useWindowProperties';
import { JSX, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { css, keyframes, styled } from 'solid-styled-components';
import { FlexColumn, FlexRow } from './Flexbox';
import Icon from './icon/Icon';
import Text from './Text';
import Button from './Button';


const showUp = keyframes`
  0% {
    transform: translateY(20px);
  }
  100% {
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

const ModalContainer = styled(FlexColumn)<{mobile: boolean, maxHeight?: number, maxWidth?: number}>`
  background-color: var(--pane-color);
  border: solid 1px rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  overflow: hidden;
  align-self: ${props => props.mobile ? 'flex-end': 'center'};


  ${props => (props.maxWidth) ? `
    max-width: ${props.maxWidth}px;
    width: 100%;
  ` : ''}

  ${props => props.maxHeight ? `
    max-height: ${props.maxHeight}px;
    height: ${props.mobile ? 'calc(100% - 20px)': '100%'};
  ` : ''}

  ${props => props.mobile ? `
    width: 100%;
    max-width: initial;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-bottom: none;
    border-left: none;
    border-right: none;
  ` : ''}



`;
  // max-height: ${props => props.mobile ? 'calc(100vh - 20px)': '100vh'};
  // max-width: 100vw;

const TopBarContainer = styled(FlexRow)`
  align-items: center;
  padding: 10px;
  height: 30px;
  flex-shrink: 0;
`;
const CloseButtonContainer = styled("div")`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
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
  opacity: 1;
  padding: 5px;
  flex: 1;
`;

const ActionContainer = styled(FlexRow)`

`;


interface Props {
  children: JSX.Element;
  title: string;
  icon?: string;
  actionButtons?: JSX.Element;
  close?: () => void;
  ignoreBackgroundClick?: boolean
  class?: string;
  maxHeight?: number;
  maxWidth?: number;
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
          <ModalContainer mobile={isMobileWidth()} maxHeight={props.maxHeight} maxWidth={props.maxWidth}  class={classNames(props.class, 'modal')}>
            <TopBarContainer>
              <Show when={props.icon}>
                <Icon class={topBarIconStyle} onClick={props.close} name={props.icon} color='var(--primary-color)' size={18} />
              </Show>
              <Text style={{"font-weight": 'bold'}} size={16} color='var(--primary-color)'>{props.title}</Text>
              <Show when={props.close}>
                <CloseButtonContainer>
                  <Button color='var(--alert-color)' onClick={props.close} iconName='close' iconSize={16} />
                </CloseButtonContainer>
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