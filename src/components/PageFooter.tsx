import { css, styled } from "solid-styled-components";
import { CustomLink } from "./ui/CustomLink";
import { FlexRow } from "./ui/Flexbox";
import DropDown, { DropDownItem } from "./ui/drop-down/DropDown";
import {
  getCurrentLanguage,
  getLanguage,
  languages,
  setCurrentLanguage
} from "@/locales/languages";
import { useTransContext } from "@nerimity/solid-i18lite";
import { appLogoUrl } from "@/common/worldEvents";

const FooterContainer = styled(FlexRow)`
  gap: 10px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-top: solid 1px rgba(255, 255, 255, 0.2);
  padding: 18px;

  @media (max-width: 760px) {
    flex-direction: column-reverse;
  }
`;
const SocialIcon = styled("img")`
  width: 28px;
  height: 28px;
  filter: grayscale(100%);
  opacity: 65%;
  transition: 0.2s;
  &:hover {
    filter: grayscale(15%);
    opacity: 100%;
  }
`;

const socialLinkStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
`;
const SocialLinks = styled(FlexRow)`
  gap: 10px;
  flex-shrink: 0;
`;

export default function PageFooter() {
  return (
    <FooterContainer>
      <FlexRow gap={10}>
        <CustomLink decoration href="/privacy">
          Privacy Policy
        </CustomLink>
        <CustomLink decoration href="/terms-and-conditions">
          Terms And Conditions
        </CustomLink>
      </FlexRow>
      <FlexRow itemsCenter gap={10} justifyCenter>
        <LanguageDropdown />
        <SocialLinks>
          <CustomLink
            class={socialLinkStyle}
            href="/i/nerimity"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SocialIcon src={appLogoUrl()} alt="nerimity" />
          </CustomLink>
          <CustomLink
            class={socialLinkStyle}
            href="https://discord.gg/7PXjkSd"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SocialIcon src={"/assets/discord.svg"} alt="discord" />
          </CustomLink>
          <CustomLink
            class={socialLinkStyle}
            href="https://twitter.com/nerimity"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SocialIcon src={"/assets/twitter.svg"} alt="twitter" />
          </CustomLink>
          <CustomLink
            class={socialLinkStyle}
            href="https://ko-fi.com/supertiger"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SocialIcon src={"/assets/kofi.svg"} alt="ko-fi" />
          </CustomLink>
        </SocialLinks>
      </FlexRow>
    </FooterContainer>
  );
}

const LanguageDropdown = () => {
  const [, actions] = useTransContext();

  const items: DropDownItem[] = Object.keys(languages).map((key) => ({
    id: key.replace("-", "_"),
    label: languages[key as keyof typeof languages].name
  }));

  const currentLanguage = () => getCurrentLanguage() || "en-gb";

  const onChange = async (item: DropDownItem) => {
    const id = item.id;
    if (id !== "en_gb") {
      const language = await getLanguage(id);
      if (language) actions.addResources(id, "translation", language);
    }

    actions.changeLanguage(id);
    setCurrentLanguage(id);
  };

  return (
    <div class={"languageDropdown"}>
      <DropDown
        items={items}
        selectedId={currentLanguage()}
        onChange={onChange}
      />
    </div>
  );
};
