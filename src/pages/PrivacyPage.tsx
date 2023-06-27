import env from '@/common/env'
import Button from '@/components/ui/Button'
import { Link } from '@solidjs/router'
import PageHeader from '../components/PageHeader'
import { styled } from 'solid-styled-components'
import Text from '@/components/ui/Text'
import { appLogoUrl } from '@/common/worldEvents'
import { useTransContext } from '@nerimity/solid-i18next'
import { FlexColumn, FlexRow } from '@/components/ui/Flexbox'
import Icon from '@/components/ui/icon/Icon'
import { JSXElement } from 'solid-js'
import { CustomLink } from '@/components/ui/CustomLink'
import PageFooter from '@/components/PageFooter'

const PageContainer = styled("div")`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
`;

const Content = styled("div")`
  display: flex;
  flex-direction: column;
  background: var(--pane-color);
  margin: 8px;
  margin-top: 0;
  margin-bottom: 0;
  border-radius: 8px;
  flex: 1;
`;

const CenterContainer = styled(FlexColumn)`
  gap: 30px;
  margin: 30px;
  margin-top: 50px;
  max-width: 800px;
  align-self: center;

`;
const InformationContainer = styled(FlexColumn)``;

const Title = styled(Text)`
  font-size: 24px;
  font-weight: bold;
`;


export default function PrivacyPage() {

  return (
    <PageContainer class="page-container">
      <PageHeader showLogo={false} />
      <Content class='content'>
        <CenterContainer>
          <InformationContainer>
            <Title>Nerimity Privacy Policy</Title>
            <Text opacity={0.6} size={14}>Last updated: 24 June 2023</Text>
            <Text opacity={0.8} size={16}>If you find something missing or have any questions, email us at nerimityapp@gmail.com.</Text>
          </InformationContainer>
          <Block title='Personal Information We Collect'>
            When registering an account on Nerimity and using its services, we may collect some information. The information we collect may include but not be limited to email address username, full name, age, messages, images or other content.
          </Block>
          <Block title='Information We May Inspect'>
            To ensure users comply with the TOS, we may view your private/public channels (Message logs) only when receiving a report. We may warn you followed by account/server termination if you continue to refuse.
          </Block>
          <Block title='Data We Collect Automatically'>
            While using Nerimity and its services, we will collect certain information such as your IP Address, your account creation date and your activities such as your online status. We may store this information in service providers' databases. We may also track and store details while you interact with Nerimity. This includes tracking the number of visitors to the website and the number of messages a user has sent. We collect IP addresses to limit or ban users attacking Nerimity.
          </Block>
          <Block title='Third-party services'>
            You may permit us to connect your account with third party services such as your Google account. When you do this, users gain functionality (for example, uploading images or files to Google Drive). After you connect your account with third-party services, we may collect refresh tokens or user details from the services and save them in the database. We also use Googles Firebase Cloud Messaging to send push notifications to mobile decides.
          </Block>
          <Block title='Cookies'>
            We use cookies and similar storage technologies to collect local data such as recent emojis, logged in users ID and other information. We may store and expand cookie usage to save more data as this service gets updated. We may use third-party technologies such as Cloudflare Turnstile that utilizes cookies to store some data and collect some data <CustomLink decoration href='https://www.cloudflare.com/privacypolicy' target="_blank" rel="noopener noreferrer">(See Cloudflare policies)</CustomLink>.
          </Block>
        </CenterContainer>
      </Content>
      <PageFooter/>
    </PageContainer>
  )
}

const BlockContainer = styled(FlexColumn)`
`;

const BlockTitle = styled(Text)`
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 10px;
`;

function Block(props: { title: string, children: JSXElement }) {
  return (
    <BlockContainer>
      <BlockTitle>{props.title}</BlockTitle>
      <Text size={14} opacity={0.8}>{props.children}</Text>
    </BlockContainer>
  )
}








