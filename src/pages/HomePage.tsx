import env from '@/common/env'
import Button from '@/components/ui/Button'
import { Link, useNavigate } from '@solidjs/router'
import PageHeader from '../components/PageHeader'
import { styled } from 'solid-styled-components'
import Text from '@/components/ui/Text'
import { appLogoUrl } from '@/common/worldEvents'
import { useTransContext } from '@mbarzda/solid-i18next'
import { FlexColumn, FlexRow } from '@/components/ui/Flexbox'
import Icon from '@/components/ui/icon/Icon'
import { CustomLink } from '@/components/ui/CustomLink'
import PageFooter from '@/components/PageFooter'

const HomePageContainer = styled("div")`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
`;

const Content = styled("div")`
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--pane-color);
  margin: 8px;
  margin-top: 0;
  margin-bottom: 0;
  border-radius: 8px;
  flex: 1;
`;

const ArtImage = styled("img")`
  position: absolute;
  bottom: 0;
  right: 0;
  width: auto;
  height: 100%;
  opacity: 0.02;
  pointer-events: none;
  @media (orientation: portrait) {
    width: 100%;
    height: auto;
  }
`;

const TopContainer = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 490px;
  flex-shrink: 0;
`;

const ButtonsContainer = styled("div")`
  margin-top: 10px;;
  display: flex;
  margin-left: -5px;

  a {
    text-decoration: none;
    div {
      width: 130px;
    }
  }
`;

const Logo = styled("img")`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.86);
  backdrop-filter: blur(34px);
`;

export default function HomePage () {
  const [t] = useTransContext();
  
  const releaseLink = `https://github.com/Nerimity/nerimity-web/releases/${env.APP_VERSION ? `tag/${env.APP_VERSION}` : '' }`

  return (
    <HomePageContainer class="home-page-container">
      <PageHeader showLogo={false} />
      <Content class='content'>
        <TopContainer class='top-container'>
          <Logo src={appLogoUrl()} alt="logo"/>
          <Text class="title" size={60}>{env.APP_NAME}</Text>
          <Text class="slogan" opacity={0.7}>{t('homePage.slogan')}</Text>
          <a href={releaseLink} target="_blank" rel="noopener noreferrer">{env.APP_VERSION || "Unknown Version"}</a>
          <ButtonsContainer class="buttons-container">
            <a href='/register'><Button iconName='open_in_browser' label={t('homePage.joinButton', {appName: env.APP_NAME})!} primary={true} /></a>
            <a href="https://github.com/Nerimity/nerimity-web" target="_blank" rel="noopener noreferrer"><Button color='white' iconName='code' label={t('homePage.viewGitHubButton')!}  /></a>
          </ButtonsContainer>
          <PlatformDownloadLinks/>
        </TopContainer>
        <FeatureList/>
        <ArtImage src="./assets/home-page-art.svg" alt=""/>
      </Content>
      <PageFooter/>
    </HomePageContainer>
  )
}




const PlatformDownloadLinks = () => {
  const navigate = useNavigate();
  return (
    <FlexColumn gap={10} itemsCenter style={{"margin-top": "10px"}}>
      <Text size={16} opacity={0.7} style={{}}>Available on</Text>
      <FlexRow wrap justifyCenter>
        <Button onClick={() => navigate('/register')} color='' label='Browser' iconName='public' primary />
        <Button onClick={() => window.open('https://github.com/Nerimity/nerimity-desktop/releases/latest', '_blank')} color='' label='Windows' iconName='grid_view' primary />
        <Button  onClick={() => window.open('https://github.com/Nerimity/NerimityReactNative/releases/latest', '_blank')} color='#31a952' customChildren={
          <FlexRow itemsCenter>
            <Text>Android</Text>
            <Text opacity={0.8} size={12}>(Experimental)</Text>
          </FlexRow>
        } iconName='android' primary />
      </FlexRow>  
    </FlexColumn>
  )
}


const FeatureListContainer = styled("div")`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  max-width: 800px;
  gap: 10px;
  column-gap: 20px;
  align-self: center;
  margin-top: 100px;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 10px;
  border-radius: 8px;
  backdrop-filter: blur(34px);
  z-index: 1111;
  margin: 10px;

  @media (max-width: 820px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

function FeatureList() {
  return (
    <FeatureListContainer>
      <Feature icon='gif' label='Free animated avatars & emojis'/>
      <Feature icon='preview' label='Sleek design'/>
      <Feature icon='sell' label='Change your tag for free'/>
      <Feature icon='add' label='Create posts on your profile'/>
      <Feature icon='dns' label='Create your own community'/>
      <Feature icon='explore' label='Find new communities'/>
      <Feature icon='volunteer_activism' label='Runs from donations'/>
      <Feature icon='code' label='Full source code on GitHub'/>
    </FeatureListContainer>
  )
}


const FeatureContainer = styled(FlexRow)`
  align-items: center;
`;

function Feature(props: {icon: string, label: string;}) {
  return (
    <FeatureContainer gap={10}>
      <Icon style={{background: 'rgba(255,255,255,0.05)', padding: "10px", "border-radius": "50%"}} name={props.icon} size={26} />
      <Text style={{"font-weight": "bold"}} size={14} opacity={0.8}>{props.label}</Text>
    </FeatureContainer>
  )
}