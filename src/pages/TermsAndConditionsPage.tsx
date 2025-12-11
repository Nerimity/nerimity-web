import PageHeader from "../components/PageHeader";
import { styled } from "solid-styled-components";
import Text from "@/components/ui/Text";
import { FlexColumn } from "@/components/ui/Flexbox";
import { JSXElement, For } from "solid-js";
import { CustomLink } from "@/components/ui/CustomLink";
import PageFooter from "@/components/PageFooter";
import { MetaTitle } from "@/common/MetaTitle";
import { createSignal } from "solid-js";

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

      <PageHeader />
      <Content class="content">
        <CenterContainer>
          <InformationContainer>
            <Title>Nerimity Terms and Conditions of Use</Title>
            <Text opacity={0.8} size={14}>
              Last updated: 11 December 2025
            </Text>
            <Text opacity={0.6} size={14}>
              If you have questions or notice something missing, you may email
              us at{" "}
              <a href="mailto:nerimityapp@gmail.com">nerimityapp@gmail.com</a>.
            </Text>
          </InformationContainer>

          <Block title="Notes" important>
            <ul>
              <li>
                This is currently a hobby project, but it may grow and expand in
                the future. Moderation is flexible to help keep the community
                safe and enjoyable for everyone.
              </li>
            </ul>
          </Block>

          <Block title="1. Terms">
            By accessing or using this website (https://nerimity.com), you
            acknowledge and agree to be bound by these Terms and Conditions of
            Use. You further agree that you are solely responsible for ensuring
            compliance with all applicable local laws. If you do not agree to
            any provision of these terms, you must not access or use this
            website.{" "}
            <strong>
              Continued access to or use of Nerimity following the publication
              of any amendments to these Terms and Conditions shall be deemed to
              constitute your acceptance of those amendments.
            </strong>{" "}
            We encourage users to review these Terms and Conditions regularly to
            remain informed of any updates or changes.
          </Block>
          <Block title="2. Age Requirements">
            To use Nerimity or any associated services, you must be at least{" "}
            <strong>14 years old</strong>, and meet the minimum age required by
            the laws in your country or region. Accounts reasonably believed to
            belong to users below the required minimum age may be suspended
            until satisfactory proof of age is provided.
            <div style={{ "margin-top": "10px" }}>
              <strong>Exceptions:</strong> Certain countries or regions have a
              higher minimum age requirement. For a list of these exceptions,
              please expand the section below:
            </div>
            <AgeDropdown />
            <div style={{ "margin-top": "10px" }}>
              Where local law requires a higher minimum age than those listed
              above,
              <strong> the higher age requirement shall apply</strong>.
            </div>
          </Block>

          <Block title="3. Behaviour">
            Racism, sexism, homophobia, targeted harassment, serious bullying or
            doxxing <strong>are prohibited</strong> on Nerimity. However, if
            someone has a different opinion from yours that isn't harming
            anyone, we advise you to simply block them instead. We would like
            everyone to feel safe when using this platform. We want to keep
            things positive. Anyone reported or caught violating this term will
            be suspended immediately.
            <div style={{ "margin-top": "15px" }}>
              <strong>
                Any images, links, or videos depicting bodily gore, self-harm,
                disturbing imagery, triggering material, or illegal topics are
                absolutely prohibited on Nerimity.
              </strong>
            </div>
            <div style={{ "margin-top": "15px" }}>
              Any discussion of the aforementioned topics is also not allowed
              via text. We reserve the right to suspend anyone posting
              disturbing or triggering media or content.
            </div>
          </Block>

          <Block title="4. Servers">
            Creating a server on Nerimity that involves exploitation of any game
            or creating an NSFW-based server will cause your account to be
            suspended and the server deleted. This is to ensure our members have
            a comfortable environment to learn and have fun in.
          </Block>

          <Block title="5. Links">
            Nerimity has not reviewed all sites connected to its Website and is
            not responsible for their contents. The presence of any link does
            not imply endorsement by Nerimity of the site. Any linked website is
            used at the user's own risk.
          </Block>

          <Block title="6. Use Licence">
            For details on usage rights, please refer to the licenses provided
            in each repository on our{" "}
            <a
              href="https://github.com/orgs/Nerimity/repositories"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            . These outline what you can and cannot do with the code and
            materials.
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
            Nerimity's Website. This is even if Nerimity or an authorised
            representative of this Website has been notified, orally or in
            writing, of the possibility of such damage. Some jurisdictions do
            not allow limitations on implied warranties or liability for
            incidental damages, so these limitations may not apply to you.
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
const DropdownContainer = styled("div")`
  margin-top: 15px;
  border-radius: 12px;
  background-color: var(--background-dark);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;

  &:hover {
    background-color: var(--background-dark-hover);
  }
`;

const DropdownHeader = styled("div")`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 14px;
`;

const DropdownContent = styled("div")`
  margin-top: 12px;
  background-color: var(--background-light-alt);
  border-radius: 12px;
  padding: 12px;
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.05);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
`;

const CountryItem = styled("div")`
  font-size: 13px;
  background-color: var(--background-light);
  border-radius: 8px;
  padding: 6px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

export function AgeDropdown() {
  const [open, setOpen] = createSignal(false);

  const countries = [
    { name: "Croatia", age: "16" },
    { name: "Czech Republic", age: "15" },
    { name: "France", age: "15" },
    { name: "Germany", age: "16" },
    { name: "Greece", age: "15" },
    { name: "Hungary", age: "16" },
    { name: "Ireland", age: "16" },
    { name: "Netherlands", age: "16" },
    { name: "Poland", age: "16" },
    { name: "Romania", age: "16" },
    { name: "San Marino", age: "16" },
    { name: "Serbia", age: "16" },
    { name: "Slovakia", age: "16" },
    // { name: "South Korea", age: "14" },
    // { name: "Austria", age: "14" },
    // { name: "Bulgaria", age: "14" },
    // { name: "Cyprus", age: "14" },
    // { name: "Italy", age: "14" },
    // { name: "Spain", age: "14" },
  ];

  return (
    <DropdownContainer onClick={() => setOpen(!open())}>
      <DropdownHeader>
        List of minimum ages
        <span>{open() ? "▲" : "▼"}</span>
      </DropdownHeader>

      {open() && (
        <DropdownContent>
          <For each={countries}>
            {(c) => (
              <CountryItem>
                <span>{c.name}</span>
                <span>{c.age}+</span>
              </CountryItem>
            )}
          </For>
        </DropdownContent>
      )}
    </DropdownContainer>
  );
}
