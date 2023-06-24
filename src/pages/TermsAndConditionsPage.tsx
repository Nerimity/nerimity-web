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


export default function TermsAndConditionsPage() {

  return (
    <PageContainer class="page-container">
      <PageHeader showLogo={false} />
      <Content class='content'>
        <CenterContainer>
          <InformationContainer>
            <Title>Nerimity Terms and Conditions of Use</Title>
            <Text opacity={0.6} size={14}>Last updated: 24 June 2023</Text>
            <Text opacity={0.8} size={16}>If you find something missing or have any questions, email us at nerimityapp@gmail.com.</Text>
          </InformationContainer>
          <Block title='1. Terms'>
            By accessing this website (https://nerimity.com), you agree to these website terms and conditions of use. You agree that you are responsible for complying with local laws. If you disagree with any of these terms, you cannot access this site.
          </Block>
          <Block title='2. Use License'>
            Permission is granted to temporarily download a copy of the materials on Nerimity's Website for personal, noncommercial use only. This is the grant of a license, not a transfer of title. Under this license you may not use the materials for commercial purposes.
          </Block>
          <Block title='3. Disclaimer'>
            All Nerimity's Website materials are provided "as is". Nerimity makes no promises, expressly or impliedly, therefore negates all other warranties. Furthermore, Nerimity does not represent the accuracy or reliability of the use of the materials on its Website. It does not represent any sites linked to this Website.
          </Block>
          <Block title='4. Limitations'>
            Nerimity or its suppliers will not be held accountable for any damages that arise from the use or inability to use the materials on Nerimity’s Website. This is even if Nerimity or an authorized representative of this Website has been notified, orally or written, of the possibility of such damage. Some jurisdictions do not allow limitations on implied warranties or liability for incidental damages, so these limitations may not apply to you.
          </Block>
          <Block title='5. Revisions and Errata'>
            Nerimity's Website may contain technical, typographical, or photographic errors. Nerimity does not promise that the materials on this Website are accurate, complete, or current. Nerimity may change its Website materials at any time without notice. Nerimity does not guarantee any updates.
          </Block>
          <Block title='6. Links'>
            Nerimity has not reviewed all sites connected to its Website and is not responsible for their contents. The presence of any link does not imply endorsement by Nerimity of the site. Any linked website is used at the user’s own risk.
          </Block>
          <Block title='7. Your Privacy'>
            Please read our <CustomLink decoration href="/privacy">Privacy Policy.</CustomLink>
          </Block>
          <Block title='8. Governing Law'>
            Any claim relating to Nerimity's Website shall be governed by the laws of GB without regard to its conflict of law provisions.
          </Block>
          <Block title='9. Age requirement'>
            By creating an account on Nerimity, you agree and are positive you are over the age of 14 and the age of consent in your country. If you are caught underage, your account will be suspended. You may email us at nerimity@gmail.com with proof of your age to un-suspend your account.
          </Block>
          <Block title='10. Servers'>
            Creating a server on Nerimity that involves exploitation of any game or creating a NSFW based server will cause your account to be suspended and the server to be deleted. This is to ensure our members have a comfortable environment to learn and have fun in.
          </Block>
          <Block title='11. Behavior'>
            Racism or harassment is prohibited on Nerimity. We would like everyone to feel safe when using this platform. We want to keep things positive. Anyone reported or caught violating this term will be suspended immediately.
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








