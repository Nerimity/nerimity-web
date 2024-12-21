import env from "@/common/env";
import Button from "@/components/ui/Button";
import { Link } from "solid-navigator";
import PageHeader from "../components/PageHeader";
import { styled } from "solid-styled-components";
import Text from "@/components/ui/Text";
import { appLogoUrl } from "@/common/worldEvents";
import { useTransContext } from "@mbarzda/solid-i18next";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import Icon from "@/components/ui/icon/Icon";
import { JSXElement } from "solid-js";
import { CustomLink } from "@/components/ui/CustomLink";
import PageFooter from "@/components/PageFooter";
import { MetaTitle } from "@/common/MetaTitle";

const PageContainer = styled("div")`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
`;

const Content = styled("div")`
  display: flex;
  flex-direction: column;
  margin: 8px;
  margin-top: 0;
  margin-bottom: 0;
  border-radius: 8px;
  flex: 1;

  ul {
    margin: 0;
    padding: 0;
    margin-block: 0;
    margin-left: 20px;
  }
  li + li {
    margin-top: 10px;
  }
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
      <MetaTitle>Terms and Conditions</MetaTitle>

      <PageHeader showLogo={false} />
      <Content class="content">
        <CenterContainer>
          <InformationContainer>
            <Title>Nerimity Terms and Conditions of Use</Title>
            <Text opacity={0.8} size={14}>
              Last updated: 10 October 2024
            </Text>
            <Text opacity={0.6} size={14}>
              If you find something missing or have any questions, email us at
              nerimityapp@gmail.com.
            </Text>
          </InformationContainer>
          <Block title="Notes" important>
            <ul>
              <li>
                This is a hobby passion project and I reserve the right to
                suspend anyone for any reason
              </li>
              <li>
                Due to this website being so small with a small moderation team,
                <strong>
                  {` everyone must make their servers and the content inside it in
                  English `}
                </strong>
                (Because of legal reasons as I have to abide by British law and
                be able to moderate the content on my platform)
              </li>
            </ul>
          </Block>

          <Block title="1. Terms">
            By accessing this website (https://nerimity.com), you agree to these
            website terms and conditions of use. You agree that you are
            responsible for complying with local laws. If you disagree with any
            of these terms, you cannot access this site.
          </Block>

          <Block title="2. Age requirement">
            By creating an account on Nerimity, you agree and are positive{" "}
            <strong>you are over the age of 14</strong> and the age of consent
            in your country. If you are caught underage, your account will be
            suspended. If you think we made a false decision in banning you, you
            may email us at nerimityapp@gmail.com with proof of your age to
            un-suspend your account.
          </Block>
          <Block title="3. Behavior">
            Racism, sexism, homophobia, targeted harassment, serious bullying or
            doxxing <strong>are prohibited</strong> on Nerimity. However if
            someone has a different opinion from yours that isn't harming
            anyone, we advise you to just block them instead. We would like
            everyone to feel safe when using this platform. We want to keep
            things positive. Anyone reported or caught violating this term will
            be suspended immediately.
            <div style={{ "margin-top": "15px" }}>
              <strong>
                Any images, links, videos depicting mentions of bodily gore,
                self harm, disturbing imagery, triggering or illegal topics are
                absolutely prohibited on Nerimity.
              </strong>
            </div>
            <div style={{ "margin-top": "15px" }}>
              Any discussions of the aforementioned topics is also not allowed
              via text. We reserve the right to suspend anyone posting
              disturbing or triggering media or content.
            </div>
          </Block>
          <Block title="4. Servers">
            Creating a server on Nerimity that involves exploitation of any game
            or creating a NSFW based server will cause your account to be
            suspended and the server to be deleted. This is to ensure our
            members have a comfortable environment to learn and have fun in.
            Servers must be primarily in English
          </Block>
          <Block title="5. Links">
            Nerimity has not reviewed all sites connected to its Website and is
            not responsible for their contents. The presence of any link does
            not imply endorsement by Nerimity of the site. Any linked website is
            used at the user’s own risk.
          </Block>

          <Block title="6. Use License">
            Permission is granted to temporarily download a copy of the
            materials on Nerimity's Website for personal, noncommercial use
            only. This is the grant of a license, not a transfer of title. Under
            this license you may not use the materials for commercial purposes.
          </Block>
          <Block title="7. Disclaimer">
            All Nerimity's Website materials are provided "as is". Nerimity
            makes no promises, expressly or impliedly, therefore negates all
            other warranties. Furthermore, Nerimity does not represent the
            accuracy or reliability of the use of the materials on its Website.
            It does not represent any sites linked to this Website.
          </Block>
          <Block title="8. Limitations">
            Nerimity or its suppliers will not be held accountable for any
            damages that arise from the use or inability to use the materials on
            Nerimity’s Website. This is even if Nerimity or an authorized
            representative of this Website has been notified, orally or written,
            of the possibility of such damage. Some jurisdictions do not allow
            limitations on implied warranties or liability for incidental
            damages, so these limitations may not apply to you.
          </Block>
          <Block title="9. Revisions and Errata">
            Nerimity's Website may contain technical, typographical, or
            photographic errors. Nerimity does not promise that the materials on
            this Website are accurate, complete, or current. Nerimity may change
            its Website materials at any time without notice. Nerimity does not
            guarantee any updates.
          </Block>

          <Block title="10. Your Privacy">
            Please read our{" "}
            <CustomLink decoration href="/privacy">
              Privacy Policy.
            </CustomLink>
          </Block>
          <Block title="11. Governing Law">
            Any claim relating to Nerimity's Website shall be governed by the
            laws of GB without regard to its conflict of law provisions.
          </Block>
        </CenterContainer>
      </Content>
      <PageFooter />
    </PageContainer>
  );
}

const BlockContainer = styled(FlexColumn)`
  position: relative;
  &[data-important="true"]:before {
    background-color: var(--alert-color);
    content: "";
    position: absolute;
    left: -16px;
    top: -4px;
    bottom: -8px;
    border-radius: 99px;
    width: 5px;
  }
`;

const BlockTitle = styled(Text)`
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 10px;
`;

function Block(props: {
  title: string;
  children: JSXElement;
  important?: boolean;
}) {
  return (
    <BlockContainer data-important={props.important}>
      <BlockTitle>{props.title}</BlockTitle>
      <Text size={14} opacity={0.8}>
        {props.children}
      </Text>
    </BlockContainer>
  );
}
