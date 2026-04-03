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
import { emojiUnicodeToShortcode, unicodeToTwemojiUrl } from "@/emoji";
import { Emoji } from "./markup/Emoji";
import { JSXElement } from "solid-js";
import { LogoMono } from "../LogoMono";

const FooterContainer = styled(FlexRow)`
  gap: 10px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-top: solid 1px rgba(255, 255, 255, 0.2);
  padding: 18px;

  .language-and-socials {
  }

  @media (max-width: 318px) {
    .footer-links {
      display: flex;
      flex-direction: column;
      text-align: center;
    }
    .social-links {
      flex-wrap: wrap;
      justify-content: center;
    }
  }

  @media (max-width: 549px) {
    .language-and-socials {
      display: flex;
      flex: 1;
      flex-direction: column;
    }
  }

  @media (max-width: 920px) {
    flex-direction: column-reverse;
  }
`;
const SocialIcon = styled("img")`
  width: 20px;
  height: 20px;
  filter: grayscale(100%);
  opacity: 65%;
  transition: 0.2s;
  &:hover {
    filter: grayscale(15%);
    opacity: 100%;
  }
`;
const NerimityIcon = styled("svg")`
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
      <FlexRow gap={10} class="footer-links">
        <CustomLink decoration href="/privacy">
          Privacy Policy
        </CustomLink>
        <CustomLink decoration href="/terms-and-conditions">
          Terms And Conditions
        </CustomLink>
      </FlexRow>
      <FlexRow class="language-and-socials" itemsCenter gap={10} justifyCenter>
        <LanguageDropdown />
        <SocialLinks class="social-links">
          <CustomLink
            class={socialLinkStyle}
            href="https://nerimity.com/i/nerimity"
            target="_blank"
            rel="noopener noreferrer"
          >
            <NerimityIcon>
              <LogoMono />
            </NerimityIcon>
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
            href="https://bsky.app/profile/nerimity.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SocialIcon src={"/assets/bluesky.svg"} alt="bluesky" />
          </CustomLink>
          <CustomLink
            class={socialLinkStyle}
            href="https://mastodon.social/@nerimity"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SocialIcon src={"/assets/mastodon.svg"} alt="mastodon" />
          </CustomLink>
          <CustomLink
            class={socialLinkStyle}
            href="https://www.reddit.com/r/nerimitychat"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SocialIcon src={"/assets/reddit.svg"} alt="reddit" />
          </CustomLink>
          <CustomLink
            class={socialLinkStyle}
            href="https://www.threads.com/@nerimity"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SocialIcon src={"/assets/threads.svg"} alt="threads" />
          </CustomLink>
          <CustomLink
            class={socialLinkStyle}
            href="https://www.youtube.com/@Nerimity"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SocialIcon src={"/assets/youtube.svg"} alt="youtube" />
          </CustomLink>
          <CustomLink
            class={socialLinkStyle}
            href="https://www.producthunt.com/posts/nerimity"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SocialIcon src={"/assets/producthunt.svg"} alt="product hunt" />
          </CustomLink>
          <CustomLink
            class={socialLinkStyle}
            href="https://supertigerdev.itch.io/nerimity"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SocialIcon src={"/assets/itchio.svg"} alt="itchio" />
          </CustomLink>
        </SocialLinks>
      </FlexRow>
    </FooterContainer>
  );
}

const LanguageDropdown = () => {
  const [, actions] = useTransContext();

  const items: DropDownItem[] = Object.keys(languages).map((key) => {
    const lang = languages[key as keyof typeof languages]!;
    return {
      id: key.replace("-", "_"),
      // Use a getter to create a new element, as reused JSXElements
      // break the dropdown DOM.
      get label(): JSXElement {
        return (
          <>
            <Emoji
              class={css`
                height: 22px;
                width: 22px;
                align-self: flex-start;
                margin-right: 6px;
              `}
              name={emojiUnicodeToShortcode(lang.emoji)}
              url={unicodeToTwemojiUrl(lang.emoji)}
            />
            <span>{lang.nativeName ?? lang.name}</span>
          </>
        );
      }
    };
  });

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
