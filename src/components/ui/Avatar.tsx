import { avatarUrl } from '@/chat-api/store/useUsers';
import { classNames } from '@/common/classNames';
import { useWindowProperties } from '@/common/useWindowProperties';
import { read } from 'fs';
import { createMemo, JSX, JSXElement, Match, Show, Switch } from 'solid-js';
import { keyframes, styled } from 'solid-styled-components';
import Text from './Text';
import { hasBit, USER_BADGES } from '@/chat-api/Bitwise';
import styles from './AvatarStyles.module.scss';

interface Props {
  url?: string | null;
  size: number;
  class?: string;
  animate?: boolean;
  user?: { avatar?: string, hexColor: string, badges?: number};
  server?: { avatar?: string, hexColor: string, verified: boolean; };
  borderColor?: string;
  children?: JSXElement;
  showBorder?: boolean
}

interface ServerOrUser {
  avatar: string;
  hexColor: string;
  badges?: number;
  verified?: boolean;
}

export default function Avatar(props: Props) {

  const { hasFocus } = useWindowProperties();

  const serverOrUser = () => (props.server || props.user) as ServerOrUser;


  const url = () => {
    let url = props.url;
    if (!url) {
      url = avatarUrl(serverOrUser());
    }

    if (!url?.endsWith(".gif")) return url;
    if (!hasFocus()) return url + "?type=webp";
    if (props.animate) return url;
    return url + "?type=webp";
  }

  return (
    <div style={{width: props.size + "px", height: props.size + "px"}} class={classNames(styles.avatarContainer, "avatar-container", props.class)}>
      <Show when={props.borderColor}>
        <BasicBorder size={props.size} color={props.borderColor!} label=''  />
      </Show>
      <AvatarBorder size={props.size} hovered={props.animate || props.showBorder} serverOrUser={serverOrUser()} />
      <div class={styles.imageContainer}>
        <Show when={!url()}>
          <div class={styles.avatarBackground} style={{background: serverOrUser().hexColor}} />
        </Show>
        <Switch>
          <Match when={props.children}>{props.children}</Match>
          <Match when={url()}><img class={styles.image} loading="lazy" src={url()!} alt="User Avatar" /></Match>
          <Match when={!url()}><img class={styles.image} src="/assets/profile.png" alt="User Avatar" /></Match>
        </Switch>
        
      </div>
    </div>
  )
}





const badgesArr = Object.values(USER_BADGES);


function AvatarBorder(props: { size: number, hovered?: boolean, serverOrUser: ServerOrUser }) {


  const badge = createMemo(() => !props.serverOrUser?.badges ? undefined : badgesArr.find(b => hasBit(props.serverOrUser.badges || 0, b.bit)))

  return (
    <>
      <Show when={badge()}>
        <BasicBorder size={props.size} color={badge()?.color} label={badge()?.name} hovered={props.hovered} />
      </Show>
      <Show when={props.serverOrUser?.verified}>
        <BasicBorder size={props.size} color="var(--primary-color)" label='Verified' hovered={props.hovered} />
      </Show>
    </>
  )
}

const BasicAvatarBorderContainer = styled("div") <{ size: number, color: string }>`
  position: absolute;
  inset: 0;

  display: flex;
  justify-content: center;
  border-radius: 50%;

  border: solid ${props => props.size / 100 * 8}px ${props => props.color};

  left: -${props => props.size / 100 * 5}px;
  top: -${props => props.size / 100 * 5}px;
  right: -${props => props.size / 100 * 5}px;
  bottom: -${props => props.size / 100 * 5}px;

  z-index: 1;

`;

const rotate = keyframes`
  0% { 
    opacity: 0;
    transform: translateY(10px);
  }
  100% { 
    opacity: 1;
    transform: translateY(0);
  }
`

const BasicBorderLabelContainer = styled("div")`
  pointer-events: none;
  font-weight: bold;
  position: absolute;
  color: rgba(0,0,0,0.7);

  animation: ${ rotate } 0.2s ease-out forwards;
`;





function BasicBorder(props: { size: number, hovered?: boolean, color: string; label: string }) {
  return (
    <BasicAvatarBorderContainer class="basic-border" color={props.color} size={props.size}>
      <Show when={props.hovered}>
        <BasicBorderLabelContainer style={{
          "font-size": props.size / 100 * 17 + "px",
          "border-radius": props.size / 100 * 8 + "px",
          bottom: -(props.size / 100 * 15) + "px",
          padding: props.size / 100 * 5 + "px",
          background: props.color
        }}>{props.label}</BasicBorderLabelContainer>
      </Show>
    </BasicAvatarBorderContainer>
  )
}