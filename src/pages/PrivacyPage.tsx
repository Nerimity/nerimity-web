import PageHeader from "../components/PageHeader";
import { styled } from "solid-styled-components";
import Text from "@/components/ui/Text";
import { FlexColumn } from "@/components/ui/Flexbox";
import { JSXElement } from "solid-js";
import { CustomLink } from "@/components/ui/CustomLink";
import PageFooter from "@/components/PageFooter";
import { MetaTitle } from "@/common/MetaTitle";
import Icon from "@/components/ui/icon/Icon";

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
      <MetaTitle>Privacy Policy</MetaTitle>

      <PageHeader />
      <Content class="content">
        <CenterContainer>
          <InformationContainer>
            <Title>Nerimity Privacy Policy</Title>
            <Text opacity={0.8} size={14}>
              Last updated: 20 February 2026
            </Text>
            <CustomLink
              decoration
              href="https://github.com/Nerimity/nerimity-web/commits/main/src/pages/PrivacyPage.tsx"
              target="_blank"
              rel="noopener noreferrer"
            >
              View policy history
            </CustomLink>
            <Text opacity={0.6} size={14}>
              If you have questions or notice something missing, you may email
              us at{" "}
              <a href="mailto:nerimityapp@gmail.com">nerimityapp@gmail.com</a>.
            </Text>
          </InformationContainer>

          <Block title="Data We Store Automatically" icon="storage">
            When registering an account on Nerimity and using its services, we
            store some information. The information we store may include but not
            be limited to email address, username, messages, images or other
            content.
          </Block>
          <Block title="Information We May Inspect" icon="search">
            To ensure users comply with the TOS, we may view your private/public
            channels (Message logs) only when receiving a report. We may warn
            you followed by account/server termination if you continue to
            refuse.
          </Block>
          <Block title="Data We Collect Automatically" icon="data_usage">
            While using Nerimity and its services, we store certain information
            such as your IP Address, your account creation date, and your online
            status. We store this information in service providers' databases.
            We collect and store IP addresses to limit or ban users attacking
            Nerimity.
          </Block>
          <Block title="Third-party services" icon="integration_instructions">
            You may permit us to connect your account with third party services
            such as your Google account. When you do this, users gain
            functionality (for example, uploading images or files to Google
            Drive). After you connect your account with third-party services, we
            may collect refresh tokens or user details from the services and
            save them in the database. We also use Google's Firebase Cloud
            Messaging to send push notifications to mobile devices.
          </Block>
          <Block title="Voice Calling" icon="call">
            Voice calls on Nerimity are peer-to-peer, meaning your voice data is
            sent directly between participants without routing through our
            servers. However, if a direct connection cannot be established due
            to firewall or network restrictions, calls will use Cloudflare's
            TURN servers as a relay. When using TURN servers, your connection
            metadata may be processed by Cloudflare according to their privacy
            policy.
          </Block>
          <Block title="Admin and Moderation Access" icon="security">
            Server administrators and our moderation team have access to certain
            administrative tools to manage their communities and enforce our
            Terms of Service. This includes the ability to view guild message
            counts, suspend users, and review message logs when investigating
            reports of abuse or policy violations.
          </Block>
          <Block title="Data Retention and Deletion" icon="delete">
            You can delete your Nerimity account at any time through your
            account settings. When you delete your account, you have the option
            to delete all of your messages or keep them archived. Deleted
            messages and accounts cannot be recovered. If you choose to keep
            your messages after account deletion, they will remain visible in
            servers but will be anonymized.
          </Block>
          <Block title="Your Data Privacy" icon="lock">
            We do not sell, trade, or share your personal data with third
            parties for marketing, advertising, or any other commercial
            purposes. Your data is only used to operate and improve Nerimity's
            services.
          </Block>
          <Block title="Cookies" icon="cookie">
            We use cookies and similar storage technologies to store local data
            such as recent emojis, logged in users ID and other information. We
            may store and expand cookie usage to save more data as this service
            gets updated. We use Cloudflare services including proxy
            infrastructure and security features (Turnstile) which may utilize
            cookies to store and collect data{" "}
            <CustomLink
              decoration
              href="https://www.cloudflare.com/privacypolicy"
              target="_blank"
              rel="noopener noreferrer"
            >
              (See Cloudflare policies)
            </CustomLink>
            .
          </Block>
        </CenterContainer>
      </Content>
      <PageFooter />
    </PageContainer>
  );
}

const BlockContainer = styled(FlexColumn)``;

const BlockTitle = styled(Text)`
  font-weight: bold;
  font-size: 18px;
`;

const TitleWithIcon = styled("div")`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

function Block(props: {
  title: string;
  icon?: string;
  children: JSXElement
}) {
  return (
    <BlockContainer>
      <TitleWithIcon>
        {props.icon && <Icon name={props.icon} size={24} />}
        <BlockTitle>{props.title}</BlockTitle>
      </TitleWithIcon>
      <Text size={14} opacity={0.8}>
        {props.children}
      </Text>
    </BlockContainer>
  );
}
