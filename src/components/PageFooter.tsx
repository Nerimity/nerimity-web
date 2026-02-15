import { css, styled } from "solid-styled-components";
import { CustomLink } from "./ui/CustomLink";
import { FlexRow } from "./ui/Flexbox";
import DropDown, { DropDownItem } from "./ui/drop-down/DropDown";
import {
  getCurrentLanguage,
  getLanguage,
  languages,
  setCurrentLanguage,
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
`;

const SocialLink = styled("img")`
  width: 36px;
  height: 36px;
  filter: grayscale(100%);
  opacity: 65%;
  &:hover {
    filter: grayscale(15%);
    opacity: 100%;
  }
`;

export default function PageFooter() {
  return (
    <FooterContainer>
      <CustomLink decoration href="/privacy">
        Privacy Policy
      </CustomLink>
      <CustomLink decoration href="/terms-and-conditions">
        Terms And Conditions
      </CustomLink>
      <LanguageDropdown />
      <CustomLink href="/i/nerimity" target="_blank" rel="noopener noreferrer" >
        <SocialLink src={appLogoUrl()} alt="nerimity"/>
      </CustomLink>
      <CustomLink href="https://discord.gg/7PXjkSd" target="_blank" rel="noopener noreferrer">
        <SocialLink src={"/assets/discord.svg"} alt="discord"/>
      </CustomLink>
      <CustomLink href="https://twitter.com/nerimity" target="_blank" rel="noopener noreferrer">
        <SocialLink src={"/assets/twitter.svg"} alt="twitter"/>
      </CustomLink>
      <CustomLink href="https://ko-fi.com/supertiger" target="_blank" rel="noopener noreferrer">
        <SocialLink src={"/assets/kofi.svg"} alt="ko-fi"/>
      </CustomLink>
    </FooterContainer>
  );
}

const LanguageDropdown = () => {
  const [, actions] = useTransContext();

  const items: DropDownItem[] = Object.keys(languages).map((key) => ({
    id: key.replace("-", "_"),
    label: languages[key as keyof typeof languages].name,
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
    <div
      class={css`
        border-left: solid 1px rgba(255, 255, 255, 0.2);
        padding-left: 14px;
      `}
    >
      <DropDown
        items={items}
        selectedId={currentLanguage()}
        onChange={onChange}
      />
    </div>
  );
};
