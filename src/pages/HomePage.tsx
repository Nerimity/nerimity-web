import env from '@/common/env'
import Button from '@/components/ui/Button'
import { Link } from '@nerimity/solid-router'
import PageHeader from '../components/PageHeader'
import { styled } from 'solid-styled-components'
import Text from '@/components/ui/Text'
import { appLogoUrl } from '@/common/worldEvents'
import { useTransContext } from '@nerimity/solid-i18next'

const HomePageContainer = styled("div")`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const Content = styled("div")`
  display: flex;
  background: var(--pane-color);
  margin: 8px;
  margin-top: 0;
  border-radius: 8px;
  height: 100%;
`;

const ArtImage = styled("img")`
  position: fixed;
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
  justify-content: center;
  height: 400px;
  margin-left: 40px;
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
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
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
            <Link href='/register'><Button iconName='open_in_browser' label={t('homePage.joinButton', {appName: env.APP_NAME})} primary={true} /></Link>
            <a href="https://github.com/Nerimity/nerimity-web" target="_blank" rel="noopener noreferrer"><Button color='white' iconName='code' label={t('homePage.viewGitHubButton')}  /></a>
          </ButtonsContainer>
        </TopContainer>
      </Content>
      <ArtImage src="./assets/home-page-art.svg" alt=""/>
    </HomePageContainer>
  )
}

